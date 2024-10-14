document.addEventListener("DOMContentLoaded", () => {
  const welcomeMessageDiv = document.getElementById("welcome-message");
  const subscription = localStorage.getItem("subscription");
  const name = localStorage.getItem("name");

  if (subscription && name && Notification.permission === "granted") {
    welcomeMessageDiv.innerHTML = `Hi, ${name}! You are among our smart subscribers. <a href="#" id="unsubscribe">Unsubscribe</a>`;
    document
      .getElementById("unsubscribe")
      .addEventListener("click", unsubscribe);
  } else {
    welcomeMessageDiv.innerHTML = "Hi, please subscribe to get notifications.";
  }
});

document
  .getElementById("subscription-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const messageDiv = document.getElementById("message");

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      messageDiv.textContent =
        "Push notifications are not supported by your browser.";
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        messageDiv.textContent = "Please enable notifications to subscribe.";
        return;
      }

      const register = await navigator.serviceWorker.register("/worker.js", {
        scope: "/",
      });

      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BPflFTzpdetDmRtgXEyvRXoc7tDU1R9eQ1LzD1gKZVcgUzNg8MH40qHYEr7jO47mWAvIiJSAeWMop5IWgZkcN60"
        ),
      });

      const response = await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription, name }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      messageDiv.textContent = result.message;

      // Store subscription and name in local storage
      localStorage.setItem("subscription", JSON.stringify(subscription));
      localStorage.setItem("name", name);

      // Update welcome message
      document.getElementById(
        "welcome-message"
      ).innerHTML = `Hi, ${name}! You are among our smart subscribers. <a href="#" id="unsubscribe">Unsubscribe</a>`;
      document
        .getElementById("unsubscribe")
        .addEventListener("click", unsubscribe);
    } catch (err) {
      console.error("Error during subscription:", err);
      messageDiv.textContent =
        "An error occurred during subscription. Please try again.";
    }
  });

async function unsubscribe(event) {
  event.preventDefault();
  const subscription = JSON.parse(localStorage.getItem("subscription"));
  const name = localStorage.getItem("name");
  const messageDiv = document.getElementById("message");
  const welcomeMessageDiv = document.getElementById("welcome-message");

  try {
    const response = await fetch("/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ subscription }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    messageDiv.textContent = `${name}, you are removed from the subscription list.`;
    welcomeMessageDiv.innerHTML = "Hi, please subscribe to get notifications.";

    // Remove subscription and name from local storage
    localStorage.removeItem("subscription");
    localStorage.removeItem("name");
  } catch (err) {
    console.error("Error during unsubscription:", err);
    messageDiv.textContent =
      "An error occurred during unsubscription. Please try again.";
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
