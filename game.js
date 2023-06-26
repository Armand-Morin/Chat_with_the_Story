import { z } from "zod";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OutputFixingParser, StructuredOutputParser } from "langchain/output_parsers";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
} from "langchain/prompts";
import { HumanChatMessage } from "langchain/schema";

const { Configuration, OpenAIApi } = require("openai");

async function getChatCompletion(prompt) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return chatCompletion;
}

// Example usage:
getChatCompletion("Hello, how are you?").then((response) => {
  console.log(response.data.choices[0].message.content);
});



const humanMessagePromptTemplateString = "Respond to the players input.\n{formatInstructions}\n{input}"

const systemMessagePromptTemplateString = `
You are a text-based game master.
You are leading the human player through a procedurally generated text-based game.
The player has selected the following options:
    - History: {history}
    - Trait: {traits}
    - Location: {location}
    - Goal: {goal}
    - Item: {item}

The user is presented with very brief a description of their character and their current location.

The player is prompted with a quest to complete early on in the game.
The quest is different for each character type, location, and item selection.
The game ends when the user has completed their quest. 
As a game master, you want the player to have a fun and engaging experience.
You want the player to feel like they are in control of their character, but not so powerful that they can do anything.
You want the player to finish the quest, but you don't want it to be too easy.
The situations the player encounters should be interesting and varied, and have a fairly high chance of success.

At each point, the user is presented with a list of actions they can take.
The characters actions open-ended, but ultimitely limited, and depend on their character selection. 
For example, a mage can cast spells, but a knight cannot.
There are always 3 options. They are procedurally generated and depend on the character type, location, items, and situation.
The player can choose to take one of the actions, or to do something else.

Players can also choose to heal or rest if possible 
(e.g. the player cannot rest if they are in combat, and cannot heal if they are not injured or do not have any healing items).

The players stats are tracked throughout the game.
The stats are:
    - Health (starts at 100)
    - Energy (starts at 100)
    - Gold (starts at 0)
    
These stats are affected by the player's actions. 
Do not print these stats in the player_message, but do include them in the player_stats.
    
If the player's health reaches 0, the game ends.
If the player's energy reaches 0, the player is unable to take any actions until they rest.
If the player's gold reaches 0, the player is unable to purchase any items until they earn more gold.

The player can earn gold by completing quests, or by selling items they find.
The player can spend gold on items that will help them complete their quest.

In certain exciting situations, the you should recomend that the game generate an image of the game state.
For example, if the player comes upon a new enemy, or a breathtaking new location.
The image_prompt is a string that will be passed to the image generator.
It should be a short description of the visual elements of the game state. It should not contain any information that is not already in the player_message.
`
var systemMessagePromptTemplate = SystemMessagePromptTemplate.fromTemplate(
    systemMessagePromptTemplateString
)

// GAME UPDATE PARSER
const gameUpdateParserZodObj = z.object({
    player_message: z.string().describe("message that the player will see"),
    inventory: z.array(z.string()).describe("list of items in the player's inventory"),
    player_stats: z.array(z.number()).describe("the player's stats (health, energy, gold)"),
    action_options: z.array(z.string()).describe("list of the player's action options in order"),
    can_rest: z.boolean().describe("whether the player can rest at the moment"),
    can_heal: z.boolean().describe("whether the player can heal at the moment"),
    generate_image: z.boolean().describe("whether to generate an image of the game state"),
    image_prompt: z.string().describe("prompt to generate the image of the game state"),
});

const gameUpdateParser = StructuredOutputParser.fromZodSchema(gameUpdateParserZodObj)
const gameUpdateFormatInstructions = gameUpdateParser.getFormatInstructions();


const chatPrompt = new ChatPromptTemplate({
    promptMessages: [
        systemMessagePromptTemplate.format({
            history: 'placeholder',
            trait: 'placeholder',
            location: 'placeholder',
            goal: 'placeholder',
            item: 'placeholder',
        }),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate(humanMessagePromptTemplateString),
    ],
    inputVariables: ["history", "input"],
    partialVariables: { "formatInstructions": gameUpdateFormatInstructions },
});

const chat = new ChatOpenAI({
    streaming: false
});

const chain = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
    prompt: chatPrompt,
    llm: chat,
});




// const input = await chain.format({
//     question: "What is the capital of France?",
// });
// const response = await model.call(input);

// console.log(input);


// await chain.call([
//     new HumanChatMessage("Write me a song about sparkling water."),
// ]);