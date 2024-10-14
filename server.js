const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const path = require("path");
const schedule = require("node-schedule");

const app = express();
app.use(bodyParser.json());

const publicVapidKey =
  "BPflFTzpdetDmRtgXEyvRXoc7tDU1R9eQ1LzD1gKZVcgUzNg8MH40qHYEr7jO47mWAvIiJSAeWMop5IWgZkcN60";
const privateVapidKey = "Z7pyE1s78fIAFVnwPf1ImXztvByGBDBANGpm3KQcT4s";

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  publicVapidKey,
  privateVapidKey
);

app.use(express.static(path.join(__dirname, "client")));

// Map to store unique subscriptions
const subscriptions = new Map();

// Serve index.html on root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.post("/subscribe", (req, res) => {
  const { subscription, name } = req.body;

  // Log the subscription request details
  console.log("Received subscription request:", subscription);

  // Use the endpoint URL as the unique key
  const subscriptionKey = subscription.endpoint;

  // Check if the subscription already exists
  if (!subscriptions.has(subscriptionKey)) {
    subscriptions.set(subscriptionKey, { subscription, name });
    res
      .status(201)
      .json({ message: `Subscription added successfully. Welcome, ${name}!` });

    // Send a welcome notification
    const payload = JSON.stringify({
      title: `Welcome, ${name}!`,
      body: `You have successfully subscribed to hydration reminders.`,
      icon: "images/favicon.ico", // Path to your icon
      image: "images/encodedcoder.png", // Path to your image
    });

    webpush
      .sendNotification(subscription, payload)
      .catch((error) => console.error(error));
  } else {
    res.status(200).json({ message: "Subscription already exists." });
  }
});

app.post("/unsubscribe", (req, res) => {
  const { subscription } = req.body;

  // Log the unsubscription request details
  console.log("Received unsubscription request:", subscription);

  // Use the endpoint URL as the unique key
  const subscriptionKey = subscription.endpoint;

  // Check if the subscription exists
  if (subscriptions.has(subscriptionKey)) {
    subscriptions.delete(subscriptionKey);
    res.status(200).json({ message: "Unsubscription successful." });
  } else {
    res.status(404).json({ message: "Subscription not found." });
  }
});

// Function to send notifications
const sendNotifications = () => {
  subscriptions.forEach(({ subscription, name }) => {
    const payload = JSON.stringify({
      title: "Hydration Reminder",
      body: `${name}, Please drink water.`,
      icon: "images/favicon.ico", // Path to your icon
      image: "images/encodedcoder.png", // Path to your image
    });

    webpush
      .sendNotification(subscription, payload)
      .catch((error) => console.error(error));
  });
};

// Schedule notifications at fixed hours (e.g., every 2 hours starting from 00:00)
const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
hours.forEach((hour) => {
  schedule.scheduleJob({ hour, minute: 0 }, sendNotifications);
});

// Schedule notifications every 2 minutes for testing purposes
// schedule.scheduleJob("*/2 * * * *", sendNotifications);

// Schedule notifications every 10 seconds for testing purposes
// schedule.scheduleJob("*/10 * * * * *", sendNotifications);

const port = 5000;
app.listen(port, () =>
  console.log(`Server started on http://localhost:${port}`)
);
