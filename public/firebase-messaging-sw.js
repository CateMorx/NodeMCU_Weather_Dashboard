importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAuaiByTvUGmBlFUlFenvnUofrumgK4mUI",
  authDomain: "embeddedsystems-11833.firebaseapp.com",
  databaseURL: "https://embeddedsystems-11833-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "embeddedsystems-11833",
  storageBucket: "embeddedsystems-11833.firebasestorage.app",
  messagingSenderId: "151254075418",
  appId: "1:151254075418:web:ce135ac7984366814b29a3",
  measurementId: "G-BS4EWRHYY8"
});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification.title || 'Sensor Alert';
  const notificationOptions = {
    body: payload.notification.body || 'Sensor threshold reached.'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});