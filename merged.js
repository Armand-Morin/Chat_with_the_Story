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

const humanMessagePromptTemplateString =
  "Respond to the players input.\n{formatInstructions}\n{input}";

const systemMessagePromptTemplateString = `
You are a text-based game master.
You are leading the human player through a procedurally generated text-based game.
The player has selected the following options:
    - History: {history}
    - Trait: {traits}
    - Location: {location}
    - Goal: {goal}
    - Item: {item}

The user is presented with a very brief description of their character and their current location.

The player is prompted with a quest to complete early on in the game.
The quest is different for each character type, location, and item selection.
The game ends when the user has completed their quest. 
As a game master, you want the player to have a fun and engaging experience.
You want the player to feel like they are in control of their character, but not so powerful that they can do anything.
You want the player to finish the quest, but you don't want it to be too easy.
The situations the player encounters should be interesting and varied and have a fairly high chance of success.

At each point, the user is presented with a list of actions they can take.
The character's actions are open-ended but ultimately limited and depend on their character selection. 
For example, a mage can cast spells, but a knight cannot.
There are always 3 options. They are procedurally generated and depend on the character type, location, items, and situation.
The player can choose to take one of the actions or do something else.

Players can also choose to heal or rest if possible 
(e.g., the player cannot rest if they are in combat and cannot heal if they are not injured or do not have any healing items).

The player's stats are tracked throughout the game.
The stats are:
    - Health (starts at 100)
    - Energy (starts at 100)
    - Gold (starts at 0)
    
These stats are affected by the player's actions. 
Do not print these stats in the player_message, but do include them in the player_stats.
    
If the player's health reaches 0, the game ends.
If the player's energy reaches 0, the player is unable to take any actions until they rest.
If the player's gold reaches 0, the player is unable to purchase any items until they earn more gold.

The player can earn gold by completing quests or by selling items they find.
The player can spend gold on items that will help them complete their quest.

In certain exciting situations, you should recommend that the game generate an image of the game state.
For example, if the player comes upon a new enemy or a breathtaking new location.
The image_prompt is a string that will be passed to the image generator.
It should be a short description of the visual elements of the game state. It should not contain any information that is not already in the player_message.
`;

const systemMessagePromptTemplate = SystemMessagePromptTemplate.fromTemplate(
  systemMessagePromptTemplateString
);

const gameUpdateParserZodObj = z.object({
  player_message: z.string().describe("message that the player will see"),
  inventory: z.array(z.string()).describe("list of items in the player's inventory"),
  player_stats: z.tuple([z.number(), z.number(), z.number()]).describe("the player's stats (health, energy, gold)"),
  action_options: z.array(z.string()).describe("list of the player's action options in order"),
  can_rest: z.boolean().describe("whether the player can rest at the moment"),
  can_heal: z.boolean().describe("whether the player can heal at the moment"),
  generate_image: z.boolean().describe("whether to generate an image of the game state"),
  image_prompt: z.string().describe("prompt to generate the image of the game state"),
});

const gameUpdateParser = StructuredOutputParser.fromZodSchema(gameUpdateParserZodObj);
const gameUpdateFormatInstructions = gameUpdateParser.getFormatInstructions();

// Constant variables
var saved_categories = {};

// Player stats variables
var health = 100;
var energy = 100;
var money = 0;

// Main parameters of the module
const CATEGORIES = {
  "History": [
    '🐊 A young and curious adventurer',
    '🧙‍♂️ A skilled mage with a troubled past',
    '👩‍🎨 A cunning thief seeking redemption',
    '🥷 An honorable knight on a quest',
    '😵‍💫 A wise and ancient forest spirit',
    '🧳 A lost traveler from another realm',
  ],
  "Trait": [
    "💪 Strength: Allows the character to overcome physical obstacles or engage in combat",
    "🧠 Intelligence: Helps the character solve puzzles and decipher complex riddles",
    "🏃‍♀️ Agility: Enables the character to navigate treacherous terrain or evade danger",
    "💄 Charm: Allows the character to persuade or manipulate NPCs",
    "👀 Perception: Helps the character notice hidden clues or detect hidden dangers",
    "🪄 Magic: Grants the character access to powerful spells and abilities",
  ],
  "Location": [
    "🕍 An ancient temple hidden deep within the forest",
    "🏙️ A mystical village populated by magical creatures",
    "⛰️ A dark and treacherous swamp filled with dangerous creatures",
    "💦 A towering waterfall cascading into a hidden cavern",
    "📚 A forgotten library guarded by enchanted books",
    "🏡 A mystical garden blooming with rare and powerful herbs",
  ],
  "Goal": [
    "🔍 Find a way to break a powerful curse",
    "🔮 Uncover the truth behind a mysterious prophecy",
    "🏆 Retrieve a stolen artifact of immense power",
    "⚖️ Restore balance to the enchanted forest",
    "🌐 Discover the source of a spreading corruption",
    "💖 Save a captured loved one from an evil sorcerer",
  ],
  "Item": [
    "🔑 A rusty key with an unknown purpose",
    "🗺️ A worn-out map with cryptic symbols",
    "💍 A magical pendant that glows faintly",
    "💼 A small satchel of healing herbs and potions",
    "📩 A mysterious letter with a hidden message",
    "🗡️ A silver dagger with intricate engravings",
  ],
};

// Additional Style categories
const Style_CATEGORIES = {
  "Style": [
    '🧙‍♂️ Fantasy',
    '🏰 Medieval',
    '🌌 Sci-Fi',
    '🌿 Nature',
    '🏙️ Urban',
  ],
  "Color": [
    '🔴 Red',
    '🟠 Orange',
    '🟡 Yellow',
    '🟢 Green',
    '🔵 Blue',
    '🟣 Purple',
  ],
  "Shape": [
    '⚪ Circle',
    '⬜ Square',
    '🔺 Triangle',
    '🔻 Diamond',
    '🔘 Rectangle',
    '🔳 Hexagon',
  ],
  "Character": [
    '👑 King',
    '👸 Queen',
    '🧚 Fairy',
    '🧟 Zombie',
    '🦄 Unicorn',
    '🐉 Dragon',
  ],
  "Background": [
    '🌅 Sunset',
    '🏞️ Mountains',
    '🌊 Ocean',
    '🌆 Cityscape',
    '🌌 Galaxy',
    '🏝️ Beach',
  ],
};

// Helper function to replace vars into a string
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function (match, index) {
    return typeof args[index] !== 'undefined' ? args[index] : match;
  });
};

// Helper function to generate a modal
function createModal(title, content) {
  var modal_template = `
    <div class="modal fade" id="exampleModal" tabindex="1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">
            {0}
            </h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            {1}
        </div>
        </div>
    </div>
    </div>
`;
  var modal = $(modal_template.format(title, content));
  modal.modal('show');
  modal.appendTo($(document));
}

// Function to add a user message to the chat
function addUserMessage(message) {
  var userMessage = `<div class="w-100 d-flex justify-content-end"><div class="w-75 alert alert-success" role="alert">${message}</div></div>`;
  $("#main-chat").append(userMessage);
  scrollLast();
}

// Function to add an AI message to the chat
function addAIMessage(message, options, callback) {
  var aiMessage = `<div class="w-100 d-flex justify-content-start"><div class="w-75 alert alert-info" role="alert">${message}</div></div>`;
  $("#main-chat").append(aiMessage);
  scrollLast();

  // Generate message selection modal
  addAIMessageSelector(options, callback);
}

// Function to add a message selection modal in bootstrap
function addAIMessageSelector(options, callback) {
  var options_elem = $('<div class="w-100 d-flex justify-content-start"><div class="w-75 list-group"></div></div>');
  var options_elem_list = options_elem.find(".list-group");

  for (var i = 0; i < options.length; i++) {
    var button = $(`<button type="button" class="list-group-item list-group-item-action">${options[i]}</button>`);
    options_elem_list.append(button);

    button.click(function (event) {
      event.preventDefault();
      var selectedOption = $(this).text();
      options_elem.remove();
      callback(selectedOption); // Trigger the callback with the selected option
      simulateAIResponse(selectedOption); // Simulate AI response after option selection
    });
  }

  options_elem.appendTo($("#main-chat"));
  scrollLast();
}

// Function to scroll to the last element of the chat
function scrollLast() {
  var target = $("#main-chat");
  var scrollHeight = target.prop("scrollHeight");
  target.scrollTop(scrollHeight);
}

// Function to simulate AI response
async function simulateAIResponse(option) {
  var aiMessage = "This is the AI's response to the selected option: " + option;
  var aiOptions = ["AI Option 1", "AI Option 2", "AI Option 3"]; // Replace with your actual AI options

  // Call the OpenAI API
  const input = await chain.format({
    input: aiMessage,
  });
  const response = await chat.llm.call(input);
  const output = response.choices[0].message;
  const formattedOutput = gameUpdateParser.parse(output);

  addAIMessage(output, aiOptions, function (aiOption) {
    addUserMessage(aiOption); // Add the AI's selected option as a user message
    $("#chat-submission-button").click(); // Trigger the button click to submit the AI's selected option
  });

  // Process the game update
  processGameUpdate(formattedOutput);
}

// Process the game update and update the UI
function processGameUpdate(gameUpdate) {
  // Update player message
  addUserMessage(gameUpdate.player_message);

  // Update inventory
  updateInventory(gameUpdate.inventory);

  // Update player stats
  updatePlayerStats(gameUpdate.player_stats);

  // Update action options
  updateActionOptions(gameUpdate.action_options);

  // Update rest and heal buttons
  updateRestAndHealButtons(gameUpdate.can_rest, gameUpdate.can_heal);

  // Generate image if required
  if (gameUpdate.generate_image) {
    generateImage(gameUpdate.image_prompt);
  }

  // Scroll to the last message
  scrollLast();
}

// Update the inventory UI
function updateInventory(inventory) {
  var inventoryElem = $("#inventory");
  inventoryElem.empty();

  for (var i = 0; i < inventory.length; i++) {
    var itemElem = $(`<li>${inventory[i]}</li>`);
    itemElem.appendTo(inventoryElem);
  }
}

// Update the player stats UI
function updatePlayerStats(playerStats) {
  var playerStatsElem = $("#player-stats");
  playerStatsElem.empty();

  for (var i = 0; i < playerStats.length; i++) {
    var statElem = $(`<li>${playerStats[i]}</li>`);
    statElem.appendTo(playerStatsElem);
  }
}

// Update the action options UI
function updateActionOptions(actionOptions) {
  var actionOptionsElem = $("#action-options");
  actionOptionsElem.empty();

  for (var i = 0; i < actionOptions.length; i++) {
    var actionOptionElem = $(`<li>${actionOptions[i]}</li>`);
    actionOptionElem.appendTo(actionOptionsElem);
  }
}

// Update the rest and heal buttons UI
function updateRestAndHealButtons(canRest, canHeal) {
  var restButton = $("#rest-button");
  var healButton = $("#heal-button");

  if (canRest) {
    restButton.prop("disabled", false);
  } else {
    restButton.prop("disabled", true);
  }

  if (canHeal) {
    healButton.prop("disabled", false);
  } else {
    healButton.prop("disabled", true);
  }
}

// Generate an image using the image prompt
function generateImage(imagePrompt) {
  // Call your image generation API here using the imagePrompt
  // Display the generated image in the UI
}

$(document).ready(function () {
  // Event listener for the "Submit message" button
  $("#chat-submission-button").click(function (event) {
    event.preventDefault();
    var userMessage = $("#chat-input").val().trim();

    if (userMessage !== "") {
      addUserMessage(userMessage);
      $("#chat-input").val("");

      // Simulate AI response after a short delay
      setTimeout(function () {
        var aiMessage = "This is the AI's response to your message: " + userMessage;
        var aiOptions = ["AI Option 1", "AI Option 2", "AI Option 3"]; // Replace with your actual AI options
        addAIMessage(aiMessage, aiOptions, function (option) {
          addUserMessage(option); // Add the selected option as a user message
          $("#chat-submission-button").click(); // Trigger the button click to submit the selected option
        });

        simulateAIResponse(userMessage); // Simulate AI response with the user message
      }, 1000);
    }
  });

  // Event listener for pressing Enter key in the input field
  $("#chat-input").keypress(function (event) {
    if (event.which === 13) {
      event.preventDefault();
      $("#chat-submission-button").click();
    }
  });

  // Toggle sidebar
  $("#toggle-sidebar").click(function (event) {
    event.preventDefault();
    $("#sidebar").toggleClass("active");
  });

  // Clear chat
  $("#clear-chat").click(function (event) {
    event.preventDefault();
    $("#main-chat").empty();
  });
});

// Generate categories and handlers
function generateCategoriesAndHandlers() {
  var root_elem = $("#list-parameters");

  // Generate all the inputs from the CATEGORIES constant
  Object.entries(CATEGORIES).forEach(function ([category, items]) {
    var categoryLine = $('<div class="w-100 d-flex justify-content-start"></div>');
    var categoryTitle = $('<div class="w-25">' + toTitleCase(category) + ':</div>');
    categoryTitle.appendTo(categoryLine);

    var selectGroup = $('<div class="form-group w-75 mb-2"></div>');
    var selectElem = $('<select class="form-control"></select>');
    selectElem.attr('id', category);

    for (var i = 0; i < items.length; i++) {
      var option = $('<option value="' + items[i] + '">' + items[i] + '</option>');
      option.appendTo(selectElem);
    }

    selectElem.appendTo(selectGroup);
    selectGroup.appendTo(categoryLine);
    categoryLine.appendTo(root_elem);
  });

  // Generate all the inputs from the Style_CATEGORIES constant
  Object.entries(Style_CATEGORIES).forEach(function ([category, items]) {
    var categoryLine = $('<div class="w-100 d-flex justify-content-start"></div>');
    var categoryTitle = $('<div class="w-25">' + toTitleCase(category) + ':</div>');
    categoryTitle.appendTo(categoryLine);

    var selectGroup = $('<div class="form-group w-75 mb-2"></div>');
    var selectElem = $('<select class="form-control"></select>');
    selectElem.attr('id', category);

    for (var i = 0; i < items.length; i++) {
      var option = $('<option value="' + items[i] + '">' + items[i] + '</option>');
      option.appendTo(selectElem);
    }

    selectElem.appendTo(selectGroup);
    selectGroup.appendTo(categoryLine);
    categoryLine.appendTo(root_elem);
  });

  // Create the categories-wide validation button
  var validation_button = $('<form class="w-100 form-inline d-flex justify-content-center">' +
    '<button type="submit" class="btn btn-primary">Confirm parameters</button>' +
    '</form>');
  validation_button.submit(handleCategorySubmission);
  validation_button.appendTo(root_elem);

  // Local function to handle the category submission
  function handleCategorySubmission(event) {
    event.preventDefault();

    var selects = root_elem.find('select');

    for (var i = 0; i < selects.length; i++) {
      var select_id = $(selects[i]).attr("id");
      var selectedOption = $(selects[i]).val();

      if (selectedOption === null) {
        createModal(
          "Error",
          'Category "' + select_id + '" has no selected option.'
        );
        return;
      }

      saved_categories[select_id] = selectedOption;
    }

    // Disable all elements
    for (var i = 0; i < selects.length; i++) {
      $(selects[i]).prop("disabled", true);
    }

    // Remove validation button
    validation_button.remove();

    // Generate AI message with selected parameters
    var selectedParameters = [];
    Object.entries(saved_categories).forEach(function ([category, value]) {
      selectedParameters.push(value);
    });
    var aiMessage = "You have selected the following parameters: " + selectedParameters.join(", ");
    var aiOptions = ["AI Option 1", "AI Option 2", "AI Option 3"]; // Replace with your actual AI options
    addAIMessage(aiMessage, aiOptions, function (aiOption) {
      addUserMessage(aiOption); // Add the AI's selected option as a user message
      $("#chat-submission-button").click(); // Trigger the button click to submit the AI's selected option
    });
  }

  // Function to convert a string to title case
  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
}

generateCategoriesAndHandlers();
