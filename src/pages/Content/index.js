chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "title") {
      if (window.location.href.includes("/agent/tickets")) {
        const message = document.querySelectorAll('[data-garden-id="forms.input"]')[0].value;
        sendResponse({ message: message });
      } else {
        sendResponse({ message: null });
      }
    }
  }
);