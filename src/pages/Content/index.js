chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "title") {
      if (window.location.href.includes("/agent/tickets")) {
        const title = document.title
        const message = title.split("Ticket: ")[1].split(" – ")[0];
        sendResponse({ message: message });
      } else {
        sendResponse({ message: null });
      }
    }
  }
);