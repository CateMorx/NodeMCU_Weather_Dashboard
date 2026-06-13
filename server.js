const express = require('express');
const path = require('path');
const admin = require('firebase-admin');

const serviceAccount = require('./embeddedsystems-11833-firebase-adminsdk-fbsvc-4cefa6eed8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://embeddedsystems-11833-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const db = admin.database();
console.log("Firebase DB URL:", process.env.FIREBASE_DATABASE_URL);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Thresholds
const RAIN_HUMIDITY_THRESHOLD = 75;   // Rain notification when humidity reaches 75%
const HEAT_INDEX_THRESHOLD = 45;      // Heat alert when heat index reaches 45°C
const NOTIFICATION_COOLDOWN_MS = 60000;

let lastRainNotificationTime = 0;
let lastHeatNotificationTime = 0;

app.post('/data', async (req, res) => {
  try {
    const data = req.body;

    const temperature = Number(data.temperature);
    const humidity = Number(data.humidity);

    if (isNaN(temperature) || isNaN(humidity)) {
      return res.status(400).send('Invalid sensor data');
    }

    const heatIndex = calculateHeatIndexCelsius(temperature, humidity);

    const rainAlert = humidity >= RAIN_HUMIDITY_THRESHOLD;
    const heatAlert = heatIndex >= HEAT_INDEX_THRESHOLD;

    const sensorData = {
      temperature: Number(temperature.toFixed(2)),
      humidity: Number(humidity.toFixed(2)),
      heatIndex: Number(heatIndex.toFixed(2)),
      rainAlert: rainAlert,
      heatAlert: heatAlert,
      device: data.device || 'NodeMCU-DHT11',
      timestamp: Date.now()
    };

    await db.ref('sensorData').push(sensorData);

    console.log('Sensor data saved:', sensorData);

    if (rainAlert) {
      await sendAlertNotification(
        'rain',
        'Rain Alert',
        `Humidity reached ${humidity.toFixed(1)}%. Possible rain condition detected.`,
        {
          alertType: 'rain',
          humidity: String(humidity.toFixed(1)),
          temperature: String(temperature.toFixed(1)),
          heatIndex: String(heatIndex.toFixed(1))
        }
      );
    }

    if (heatAlert) {
      await sendAlertNotification(
        'heat',
        'Heat Alert',
        `Heat index reached ${heatIndex.toFixed(1)}°C. Take heat safety precautions.`,
        {
          alertType: 'heat',
          humidity: String(humidity.toFixed(1)),
          temperature: String(temperature.toFixed(1)),
          heatIndex: String(heatIndex.toFixed(1))
        }
      );
    }

    res.status(200).send('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data');
  }
});

app.post('/save-token', async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token received'
      });
    }

    const existingToken = await db.ref('fcmTokens')
      .orderByChild('token')
      .equalTo(token)
      .once('value');

    if (!existingToken.exists()) {
      await db.ref('fcmTokens').push({
        token: token,
        createdAt: Date.now()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token saved'
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving token'
    });
  }
});

function calculateHeatIndexCelsius(tempC, humidity) {
  const tempF = (tempC * 9 / 5) + 32;

  const heatIndexF =
    -42.379 +
    (2.04901523 * tempF) +
    (10.14333127 * humidity) -
    (0.22475541 * tempF * humidity) -
    (0.00683783 * tempF * tempF) -
    (0.05481717 * humidity * humidity) +
    (0.00122874 * tempF * tempF * humidity) +
    (0.00085282 * tempF * humidity * humidity) -
    (0.00000199 * tempF * tempF * humidity * humidity);

  const heatIndexC = (heatIndexF - 32) * 5 / 9;

  return heatIndexC;
}

async function sendAlertNotification(alertType, title, body, dataPayload) {
  const now = Date.now();

  if (alertType === 'rain') {
    if (now - lastRainNotificationTime < NOTIFICATION_COOLDOWN_MS) {
      console.log('Rain notification skipped due to cooldown.');
      return;
    }
  }

  if (alertType === 'heat') {
    if (now - lastHeatNotificationTime < NOTIFICATION_COOLDOWN_MS) {
      console.log('Heat notification skipped due to cooldown.');
      return;
    }
  }

  const snapshot = await db.ref('fcmTokens').once('value');

  if (!snapshot.exists()) {
    console.log('No FCM tokens available.');
    return;
  }

  const tokens = [];

  snapshot.forEach((childSnapshot) => {
    const tokenData = childSnapshot.val();

    if (tokenData && tokenData.token) {
      tokens.push(tokenData.token);
    }
  });

  if (tokens.length === 0) {
    console.log('No valid FCM tokens found.');
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    data: dataPayload,
    tokens: tokens.slice(0, 500)
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  if (alertType === 'rain') {
    lastRainNotificationTime = now;
  }

  if (alertType === 'heat') {
    lastHeatNotificationTime = now;
  }

  console.log(`${title} notifications sent: ${response.successCount}`);
  console.log(`${title} notifications failed: ${response.failureCount}`);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});