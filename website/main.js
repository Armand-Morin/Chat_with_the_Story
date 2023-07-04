API_ENDPOINT = 'http://127.0.0.1:8000'

// Main parameters of the module
const CATEGORIES = {
  "History": [
    '👩‍🎨 A cunning thief seeking redemption',
    '🧙‍♂️ A skilled mage with a troubled past',
    '🐊 A young and curious adventurer',
    '🥷 An honorable knight on a quest',
    '😵‍💫 A wise and ancient forest spirit',
    '🧳 A lost traveler from another realm',
  ],
  "trait": [
    "🏃‍♀️ Agility: Enables the character to navigate treacherous terrain or evade danger",
    "💪 Strength: Allows the character to overcome physical obstacles or engage in combat",
    "🧠 Intelligence: Helps the character solve puzzles and decipher complex riddles",
    "💄 Charm: Allows the character to persuade or manipulate NPCs",
    "👀 Perception: Helps the character notice hidden clues or detect hidden dangers",
    "🪄 Magic: Grants the character access to powerful spells and abilities",
  ],
  "location": [
    "🏙️ A mystical village populated by magical creatures",
    "🕍 An ancient temple hidden deep within the forest",
    "⛰️ A dark and treacherous swamp filled with dangerous creatures",
    "💦 A towering waterfall cascading into a hidden cavern",
    "📚 A forgotten library guarded by enchanted books",
    "🏡 A mystical garden blooming with rare and powerful herbs",
  ],
  "goal": [
    "🔍 Find a way to break a powerful curse",
    "🔮 Uncover the truth behind a mysterious prophecy",
    "🏆 Retrieve a stolen artifact of immense power",
    "⚖️ Restore balance to the enchanted forest",
    "🌐 Discover the source of a spreading corruption",
    "💖 Save a captured loved one from an evil sorcerer",
  ],
  "item": [
    "🗡️ A silver dagger with intricate engravings",
    "🔑 A rusty key with an unknown purpose",
    "🗺️ A worn-out map with cryptic symbols",
    "💍 A magical pendant that glows faintly",
    "💼 A small satchel of healing herbs and potions",
    "📩 A mysterious letter with a hidden message",
  ]
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

// Function to convert a string to title case
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Helper function to generate a modal 
function createModal(title, content) {
  const modalTemplate = `
    <div class="modal fade" id="exampleModal" tabindex="1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">
              ${title}
            </h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    </div>
  `;
  const modal = document.createElement("div");
  modal.innerHTML = modalTemplate.trim();
  document.body.appendChild(modal);
}

// Function to scroll to the last element of the chat
function scrollLast() {
  const target = document.getElementById("main-chat");
  const scrollHeight = target.scrollHeight;
  target.scrollTop = scrollHeight;
}

// Sets up the event listeners that will be used globally
function addAllEventListeners() {

  // Event listener for the clicking the "Submit message" button
  document.querySelector("#chat-submission-button").addEventListener("click", submitUserMessage);

  // Event listener for pressing Enter key in the input field
  document.querySelector("#chat-input").addEventListener("keypress", function (e) {
    // check that it was the enter key that was pressed
    if (e.key === 'Enter') {
      submitUserMessage(e);
    }
  }
  );
}

// Function to add a user message to the chat
function addUserMessage(message) {

  // Create the outer bubble and set bootstrap classes
  const userMessageBubble = document.createElement("div");
  userMessageBubble.setAttribute("class", "w-100 d-flex justify-content-end");

  // Create the inner text and set bootstrap classes
  const userMessageText = document.createElement("div");
  userMessageText.setAttribute("class", "w-75 alert alert-success");
  userMessageText.setAttribute("role", "alert");
  userMessageText.textContent = message;

  // Add the text to the bubble and append the bubble to the chat
  userMessageBubble.appendChild(userMessageText);
  document.getElementById("main-chat").appendChild(userMessageBubble);

  // Scroll to the bottom of the chat
  scrollLast();
}

// Function to add an AI message to the chat
function addAIMessage(message) {

  // Create the outer bubble and set bootstrap classes
  const aiMessageBubble = document.createElement("div");
  aiMessageBubble.setAttribute("class", "w-100 d-flex justify-content-start");

  // Create the inner text and set bootstrap classes
  const aiMessageText = document.createElement("div");
  aiMessageText.setAttribute("class", "w-75 alert alert-info");
  aiMessageText.setAttribute("role", "alert");
  aiMessageText.textContent = message;

  // Scroll to the bottom of the chat
  scrollLast();

  // Add the text to the bubble and append the bubble to the chat
  aiMessageBubble.appendChild(aiMessageText);
  document.getElementById("main-chat").appendChild(aiMessageBubble);
}

// Function to add a message selection modal in bootstrap
function addPreparedMessageSelector(options, callback) {

  const options_elem = document.createElement("div");
  options_elem.classList.add("w-100", "d-flex", "justify-content-start", "prepared-options");
  const options_elem_list = document.createElement("div");
  options_elem_list.classList.add("w-75", "list-group");
  options_elem.appendChild(options_elem_list);

  // callback for when a button is clicked
  buttonClickCallback = function (event) {
    event.preventDefault();
    const selectedOption = this.textContent;
    options_elem.remove();
    callback(selectedOption);
  }

  // create the buttons for each option
  for (var i = 0; i < options.length; i++) {

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("list-group-item", "list-group-item-action");
    button.textContent = options[i];
    options_elem_list.appendChild(button);

    button.addEventListener("click", buttonClickCallback);
  }

  document.getElementById("main-chat").appendChild(options_elem);
  scrollLast();
}

// Function to handle the user message submission 
function submitUserMessage(message) {

  // if `message` argument is an event, get the value from the input field
  const userMessage = message instanceof Event ? document.getElementById("chat-input").value : message;

  // if the user message is empty, do nothing
  if (userMessage === "") {
    return;
  }

  // remove any prepared message options
  const preparedOptions = document.querySelector(".prepared-options");
  if (preparedOptions) {
    preparedOptions.remove();
  }

  // Add the user message to the chat
  addUserMessage(userMessage);

  // Senc the user message to the AI
  sendUserMessageToAI(userMessage);

  // Clear the chat input field 
  document.getElementById("chat-input").value = "";

};

function sendUserMessageToAI(userMessage) {
  // Send the user message to the AI
  fetch(API_ENDPOINT + "/game/update", {
    method: "POST",
    body: JSON.stringify({
      player_move: userMessage,
      previous_messages: document.gameUpdate.previous_messages,
      char_selection: document.gameUpdate.char_selection
    }),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Methods': '*',
      'Origin': 'http://jwalk.io'
    },
  })
    .then(response => response.json())
    .then(gameUpdate => {
      // Get the response from the AI
      // Add the AI message to the chat
      addAIMessage(gameUpdate.player_message);
      addPreparedMessageSelector(gameUpdate.action_options, submitUserMessage);
      document.gameUpdate = gameUpdate;
      handleGameUpdate();
    });
}

// Populates one column of categories in the modal
function generateCategoryLine(category, items) {

  const categoryLine = document.createElement("div");
  categoryLine.classList.add("w-100", "d-flex", "justify-content-start");

  const categoryTitle = document.createElement("div");
  categoryTitle.classList.add("w-25");
  categoryTitle.textContent = toTitleCase(category) + ":";

  categoryTitle.append(categoryLine);

  const selectGroup = document.createElement("div");
  selectGroup.classList.add("form-group", "w-75", "mb-2");

  const selectElem = document.createElement("select");
  selectElem.classList.add("form-control");
  selectElem.setAttribute("id", category);

  for (let i = 0; i < items.length; i++) {
    const option = document.createElement("option");
    option.setAttribute("value", items[i]);
    option.textContent = items[i];
    selectElem.appendChild(option);
  }

  const listParams = document.getElementById("list-parameters");

  selectGroup.appendChild(selectElem);
  categoryLine.appendChild(selectGroup);
  listParams.appendChild(selectGroup);
}

// Populates the modal with globally defined categories and their options
function populateCategoryDropdowns() {

  Object.entries(CATEGORIES).forEach(([category, items]) => {
    generateCategoryLine(category, items);
  });

  // Object.entries(Style_CATEGORIES).forEach(([category, items]) => {
  //   generateCategoryLine(category, items);
  // });

}

// commits the selected parameters, disables the dropdowns, and removes the confirm button
function saveAndResetChosenParameters() {
  const selects = listParams.querySelectorAll("#list-parameters select");
  document.chosenParameters = [];

  for (let i = 0; i < selects.length; i++) {
    const selectId = selects[i].getAttribute("id");
    const selectedOption = selects[i].value;

    if (selectedOption === null) {
      createModal(
        "Error",
        `Category "${selectId}" has no selected option.`
      );
      return;
    }
    document.chosenParameters.push(selectedOption);
  }

  // Disable all elements
  for (let i = 0; i < selects.length; i++) {
    selects[i].disabled = true;
  }

  // Remove the confirm button
  document.getElementById("confirm-params-button").remove();
}

// send the initial character selection to the AI starting the game
function sendCharacterSelectionToAI() {

  const charSelection = {
    background: document.chosenParameters[0],
    trait: document.chosenParameters[1],
    location: document.chosenParameters[2],
    goal: document.chosenParameters[3],
    item: document.chosenParameters[4],
  };

  document.gameUpdatePromise = fetch(API_ENDPOINT + "/game/start", {
    method: 'POST',
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Methods': '*',
      'Origin': 'http://jwalk.io'
    },
    body: JSON.stringify(charSelection)
  }).then(response => response.json());

}

// Local function to handle the category submission
async function handleConfirmParameters(event) {

  event.preventDefault();
  saveAndResetChosenParameters();
  sendCharacterSelectionToAI();
  document.gameUpdate = await document.gameUpdatePromise;

  addAIMessage(document.gameUpdate.player_message)

  handleGameUpdate();

  // Generate message selection modal
  addPreparedMessageSelector(document.gameUpdate.action_options, submitUserMessage);
}

// Update UI based on game update
function handleGameUpdate() {
  updateHealthBar(document.gameUpdate.player_stats[0]);
  updateEnergyBar(document.gameUpdate.player_stats[1]);
  updateMoneyBar(document.gameUpdate.player_stats[2]);
}

// Generate categories and handlers
function generateCategoriesAndHandlers() {

  populateCategoryDropdowns();

  listParams = document.getElementById("list-parameters");

  const validationButton = document.createElement("form");
  validationButton.classList.add("w-100", "form-inline", "d-flex", "justify-content-center");
  validationButton.id = "confirm-params-button";

  const button = document.createElement("button");
  button.classList.add("btn", "btn-primary");
  button.setAttribute("type", "submit");
  button.textContent = "Confirm parameters";

  validationButton.appendChild(button);
  validationButton.addEventListener("submit", handleConfirmParameters);
  listParams.append(validationButton);

}

// just updates the health bar on the page
const updateHealthBar = (health) => {
  const healthBar = document.querySelector("#healthbar");
  healthBar.style.width = `${health}%`;
};

// just updates the energy bar on the page
const updateEnergyBar = (energy) => {
  const energyBar = document.querySelector("#energybar");
  energyBar.style.width = `${energy}%`;
};

// just updates the money bar on the page
const updateMoneyBar = (money) => {
  const moneyBar = document.querySelector("#moneybar");
  moneyBar.style.width = `${money}%`;
};

///////////////////////////////////////////

addAllEventListeners();
generateCategoriesAndHandlers();