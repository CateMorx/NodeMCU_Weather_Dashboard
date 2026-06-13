# NodeMCU Weather Dashboard

-An IoT-based environmental monitoring system that tracks real-time temperature, humidity, and computed heat index. The system utilizes a NodeMCU ESP8266 and a DHT11 sensor to collect data, which is securely transmitted to a Node.js backend and stored in Firebase.
-Users can view live temperature, humidity, and heat index data on a responsive web dashboard.
-The dashboard displays automated visual alerts when the humidity reaches 75% or the heat index hits 45°C.
-Integrated Firebase Cloud Messaging (FCM) pushes automated browser notifications whenever threshold conditions are met.
-A Node.js backend utilizes the Firebase Admin SDK to securely handle database writes and keep sensitive API keys off the microcontroller.

## Technologies Used
**Hardware:**
- NodeMCU ESP8266 (or ESP32)
- DHT11 Temperature and Humidity Sensor

**Software & Backend:**
- C++ / Arduino IDE
- Node.js & Express
- Firebase Realtime Database
- Firebase Cloud Messaging (FCM)
-HTML/CSS/JS

## System Architecture
1. The **DHT11 sensor** reads environmental data and passes it to the **NodeMCU**.
2. The NodeMCU connects to the local Wi-Fi and sends the data payload via an **HTTP POST request** to the backend server.
3. The **Node.js server** receives the payload and uses the **Firebase Admin SDK** to securely push the data to the Realtime Database.
4. The **Web Dashboard** listens to the Firebase database for state changes and updates the UI dynamically.

## Setup & Installation

### 1. Hardware Setup
* Connect the DHT11 data pin to `D5` on the NodeMCU.
* Connect VCC to 3V3 and GND to GND.

### 2. Backend Setup
1. Clone this repository.
2. Run `npm install` to download all dependencies.
3. Ensure your Firebase Database URL is configured in the server file.
4. Download your Firebase Admin SDK private key (`.json` format) from your Firebase Project Settings and place it in the root directory. *(Note: Ensure this file is added to your `.gitignore` for security).*
5. Start the server: `node server.js`

### 3. NodeMCU Setup
1. Open the `.ino` file in the Arduino IDE.
2. Update the `ssid`, `password`, and `serverUrl` variables to match your local network configuration.
3. Flash the code to your ESP8266.


