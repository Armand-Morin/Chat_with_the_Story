from fastapi import FastAPI
from langchain.chains import ConversationChain
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.output_parsers import OutputFixingParser, PydanticOutputParser
from langchain.prompts import (ChatPromptTemplate, HumanMessagePromptTemplate,
                               MessagesPlaceholder,
                               SystemMessagePromptTemplate)
from langchain.schema import (OutputParserException, messages_from_dict,
                              messages_to_dict)
from starlette.middleware.cors import CORSMiddleware

from models import AIGameUpdate, CharSelection, PlayerGameUpdate, AIGameUpdateExtension
from params import TEMPERATURE
from prompts import (human_message_prompt_template,
                     system_message_prompt_template)

ai_game_update_parser = PydanticOutputParser(pydantic_object=AIGameUpdate)
ai_game_update_extension_parser = PydanticOutputParser(pydantic_object=AIGameUpdateExtension)
player_game_update_parser = PydanticOutputParser(pydantic_object=PlayerGameUpdate)

# system_message_prompt = SystemMessagePromptTemplate.from_template(
system_message_prompt = HumanMessagePromptTemplate.from_template(
    system_message_prompt_template
)

human_message_prompt = HumanMessagePromptTemplate.from_template(
    human_message_prompt_template,
)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

input_variables = ["input", "history"]

game_update_fmt_instructions = ai_game_update_parser.get_format_instructions()


def get_conversation_chain(char_selection: CharSelection):

    partial_variables = dict(
        format_instructions=game_update_fmt_instructions,
        background=char_selection.background,
        trait=char_selection.trait,
        location=char_selection.location,
        goal=char_selection.goal,
        item=char_selection.item,                       
    )

    messages = [
        # sys_msg,
        system_message_prompt,
        MessagesPlaceholder(variable_name="history"),
        human_message_prompt,
    ]

    prompt = ChatPromptTemplate(
        messages=messages,
        input_variables=input_variables,
        partial_variables=partial_variables,
    )

    chat_llm = ChatOpenAI(temperature=TEMPERATURE)
    memory = ConversationBufferMemory(return_messages=True)
    conversation = ConversationChain(memory=memory, prompt=prompt, llm=chat_llm)

    return conversation


@app.post("/game/start")
async def start_game(char_selection: CharSelection):

    conversation = get_conversation_chain(char_selection)
    response = conversation.predict(input="Let's start")
    
    ai_game_update = ai_game_update_extension_parser.parse(response)
    ai_game_update.char_selection = char_selection
    ai_game_update.previous_messages = messages_to_dict(
        conversation.memory.chat_memory.messages
    )
    
    return ai_game_update


@app.post("/game/update")
async def update_game(player_game_update: PlayerGameUpdate):
    # restore conversation from previous messages
    messages = messages_from_dict(player_game_update.previous_messages)
    conversation = get_conversation_chain(player_game_update.char_selection)
    conversation.memory.chat_memory.messages = messages

    # add player's move to the conversation and get AI's response
    response = conversation.predict(input=player_game_update.player_move)
                                    
    try:
        ai_game_update = ai_game_update_extension_parser.parse(response)

    except OutputParserException as e:
        fix_parser = OutputFixingParser.from_llm(parser=ai_game_update_extension_parser, llm=conversation.llm)
        ai_game_update = fix_parser.parse(response)


    # send AI's response to the client, along with the previous messages 
    # and info for chaining
    ai_game_update.char_selection = player_game_update.char_selection
    ai_game_update.previous_messages = messages_to_dict(
        conversation.memory.chat_memory.messages
    )

    return ai_game_update
