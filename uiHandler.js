import { openConnection, sendCommand, closeConnection } from './serialConnection.js';

let lastState = null;
let isConnected = false;

/**
 * Initializes the event listeners for the UI elements.
 */
function init() {
  // Connect/Disconnect button listener
  document.getElementById("connect-button").addEventListener("click", async () => {
    const connectButton = document.getElementById("connect-button");
    
    try {
      if (isConnected) {
        // Disconnect the device
        await closeConnection();
        isConnected = false;
        connectButton.textContent = "Connect to device";
        console.log("Disconnected successfully.");
      } else {
        // Attempt to connect
        connectButton.textContent = "Connecting...";
        console.log("Requesting device...");
        
        await openConnection(); // Open the serial connection
        isConnected = true;
        connectButton.textContent = "Disconnect";
        console.log("Connection established.");
      }
    } catch (error) {
      console.error("Error during connection routine:", error);
      alert(error.message || "An error occurred. Please try again.");
      
      // Reset the button state in case of failure
      connectButton.textContent = isConnected ? "Disconnect" : "Connect to device";
    }
  });
  

  // Living room lights switch change listener
  document.getElementById("led-bulb").addEventListener("click", async (e) => {
    const currentState = e.target.checked;
    if (currentState !== lastState) {
      lastState = currentState;
      const command = currentState ? "LED_ON" : "LED_OFF";
      await sendCommand(command); // Send the corresponding command to Arduino
      document.getElementById("living-room-lights-status").textContent = currentState ? "1 on, 2 off" : "3 off";
    }
  });

  // Add event listener for bulb toggle
  document.getElementById('led-bulb').addEventListener('click', toggleBulb);
}

init();

/**
 * Toggles the bulb on/off and sends a request to Arduino.
 */
let isBulbOn = false;

function toggleBulb() {
  isBulbOn = !isBulbOn;
  const bulbElement = document.getElementById('led-bulb');
  if (isBulbOn) {
    bulbElement.classList.add('on');
    sendLightRequest('on');
  } else {
    bulbElement.classList.remove('on');
    sendLightRequest('off');
  }
}

/**
 * Sends a light on/off request to Arduino via serial communication.
 * @param {string} state The state to send ('on' or 'off').
 */
function sendLightRequest(state) {
  console.log(`Sending light ${state} request to Arduino`);
  // Use the serial connection to send the command to Arduino
  sendCommand(state === 'on' ? 'LED_ON' : 'LED_OFF');
}

// Realtime battery percentage of system
initBattery();

function initBattery() {
  const Bpercentages = document.querySelectorAll(".Bpercentage");
  navigator.getBattery().then((battery) => {
    updateBattery = () => {
      let level = Math.floor(battery.level * 100);
      Bpercentages.forEach(element => {
        element.innerHTML = level + "%";
      });
    };
    updateBattery();
    battery.addEventListener("levelchange", () => {
      updateBattery();
    });
    battery.addEventListener("chargingchange", () => {
      updateBattery();
    });
  });
}

// Current time in system
let timeElements = document.querySelectorAll(".current-time");

setInterval(() => {
  let d = new Date();
  timeElements.forEach(element => {
    element.innerHTML = d.toLocaleTimeString();
  });
}, 1000);

// Cursor Animation
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

window.addEventListener("mousemove", function (e) {
  const posX = e.clientX;
  const posY = e.clientY;

  cursorDot.style.left = `${posX}px`;
  cursorDot.style.top = `${posY}px`;

  cursorOutline.animate({
    left: `${posX}px`,
    top: `${posY}px`
  }, { duration: 500, fill: "forwards" });
});

export { init };
