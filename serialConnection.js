let writer = null;
let reader = null;
let port = null;
let distanceData = []; // Array to store distance data
let timeLabels = []; // Array to store timestamps for the x-axis

// Initialize Chart.js graph
const ctx = document.getElementById("distance-chart").getContext("2d");
const distanceChart = new Chart(ctx, {
  type: "line", // Use a line chart to visualize the data
  data: {
    labels: timeLabels, // X-axis labels (timestamps)
    datasets: [
      {
        label: "Distance (cm)",
        data: distanceData, // Y-axis data (distance values)
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)", // Line color
        tension: 0.1,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        title: {
          display: false,
          text: "Distance (cm)",
        },
        min: 0, // Set minimum value for the Y-axis
        max: 30, // Adjust maximum value based on expected range
      },
    },
  },
});

/**
 * Opens a connection to the serial port.
 * @returns {Promise<void>} A promise that resolves when the connection is successfully opened.
 */

// connectButton.addEventListener('click', async () => {
async function openConnection() {
  try {
    console.log("Requesting serial port...");

    // Request the user to select a serial port
    const port = await navigator.serial.requestPort();
    console.log("Serial port selected:", port);

    // Open the serial port with a specified baud rate
    await port.open({ baudRate: 9600 });
    console.log("Serial port opened.");

    // Create a text decoder for reading data from the port
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    // Create a text encoder for writing data to the port
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();

    console.log("Waiting for data...");

    // Set global variables for writer and reader to use them elsewhere
    globalThis.port = port; // Make the port accessible globally
    globalThis.writer = writer;
    globalThis.reader = reader;

    readerLoop(); // Start reading data from the port

    return true; // Indicate successful connection
  } catch (error) {
    console.error("Error opening connection:", error);
    throw new Error(
      "Failed to open connection. Please check your device or browser."
    );
  }
}

// document.getElementById("connect-button").addEventListener("click", () => {
//   openConnection();
// }); // Ensure the button exists with id 'connect'

let lastTime = 0;

function updateDistanceData(distance) {
  // Check for "Distance" value
  console.log("Distance before if:", distance);
  if (distance) {
    // Get the current time for x-axis labeling
    const currentTime = new Date(); // Get the current date and time
    console.log("Current Time:", currentTime);

    if (lastTime) {
      // Calculate the time difference in seconds
      const timeDifference = (currentTime - lastTime) / 1000; // Difference in seconds

      console.log("Time Difference (seconds):", timeDifference);

      if (timeDifference < 2) {
        console.log("Time difference is less than 2 seconds.");
        return; // Return early if the time difference is less than 2 seconds
      }
    }
    lastTime = currentTime; // Update the last time value

    console.log("Distance before push:", distance);
    console.log("DistanceData:", distanceData);
    console.log("TimeLabels:", timeLabels);
    // Update the graph data
    distanceData.push(distance);
    timeLabels.push(`${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`);

    // Limit the data array to only keep the last 10 values to avoid overflow
    if (distanceData.length > 10) {
      distanceData.shift();
      timeLabels.shift();
    }

    // Update the chart with new data
    distanceChart.update();
  }
}

const dialValue3 = document.getElementById("dial-value3");
const rangeSelector = document.getElementById("range--selector");

// Function to update the knob position based on value
// function updateKnobPosition(value) {
//   // Normalize the value between 1 and 1024, scale it to 0-360 degrees
//   const angle = (value / 1024) * 360;
//   rangeSelector.style.transform = `rotate(${angle}deg)`;
//   dialValue3.textContent = value;
// }

function updateTemperature(value) {
  // Update the temperature value in the UI
  const temperatureValueElement = document.getElementById("ui--detail-value1");
  temperatureValueElement.textContent = value + "°C";
}

let setTemperatureValue = 0;

function updateKnobPosition(value) {
  // Normalize the value to a range of 0-360 degrees
  const degree = (value / 1024) * 180;
  setTemperatureValue = Math.floor(5 + (value / 1024 * 35));
  const temperatureValueElement = document.getElementById("ui--detail-value2");
  // console.log("Temperature Value:", setTemperatureValue);
  temperatureValueElement.textContent = setTemperatureValue + "°C";
  console.log("Degree:", degree);
  // Select the knob element
  const knobElement = document.getElementById("outer-ring");

  // Apply the rotation transformation
  knobElement.style.transform = `rotate(${degree}deg)`; // Rotate the knob

  // Update the displayed value in the dial
  const dialValueElement = document.getElementById("dial-value3");
  dialValueElement.textContent = value;
}

function processReceivedData(value) {
  const trimmedValue = value.trim();

  // Distance parsing
  const distanceMatch = trimmedValue.match(/Distance: (\d+)/);
  if (distanceMatch) {
    const distanceValue = parseInt(distanceMatch[1], 10);
    updateDistanceData(distanceValue);
  }

  // Potentiometer parsing
  const potentiometerMatch = trimmedValue.match(/Rezistance: (\d+)/);
  if (potentiometerMatch) {
    const potentiometerValue = parseInt(potentiometerMatch[1], 10);
    updateKnobPosition(potentiometerValue);
  }

  // Temperature parsing
  const temperatureMatch = trimmedValue.match(/Temperature: (\d+)/);
  if (temperatureMatch) {
    const temperatureValue = parseInt(temperatureMatch[1], 10);
    updateTemperature(temperatureValue);
  }
}

/**
 * Reads data from the serial port and updates the status element or graph.
 * @param {ReadableStreamDefaultReader} reader The reader to read from.
 */
async function readerLoop() {
  let buffer = ""; // Buffer to accumulate data until a newline character is detected

  while (true) {
    try {
      const { value, done } = await globalThis.reader.read();
      if (done) {
        console.log("Reader closed.");
        globalThis.reader.releaseLock();
        break;
      }

      // Append the received value to the buffer
      buffer += value;

      // Process each complete sentence (split by \n)
      let sentences = buffer.split("\n");
      buffer = sentences.pop(); // Keep the last incomplete part in the buffer

      for (let sentence of sentences) {
        console.log("Complete sentence received:", sentence);
        processReceivedData(sentence.trim()); // Process each complete sentence
      }
    } catch (error) {
      console.error("Error reading data:", error);
      break;
    }
  }
}

/**
 * Sends a command to the Arduino to turn the LED on or off.
 * @param {string} command The command to send ('LED_ON' or 'LED_OFF').
 * @returns {Promise<void>} A promise that resolves when the command is sent.
 */
async function sendCommand(command) {
  if (globalThis.writer) {
    await globalThis.writer.write(`${command}\n`);
    console.log(`${command} command sent.`);
  } else {
    console.error("Serial writer not initialized.");
  }
}

/**
 * Closes the connection to the serial port.
 * @returns {Promise<void>} A promise that resolves when the connection is closed.
 */
async function closeConnection() {
  if (reader) {
    await reader.cancel();
  }
  if (writer) {
    await writer.close();
  }
  if (port) {
    await port.close();
    console.log("Connection closed.");
  }
}

export { openConnection, sendCommand, closeConnection };
