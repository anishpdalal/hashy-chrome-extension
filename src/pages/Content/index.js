chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "title") {
      if (window.location.href.includes("/agent/tickets")) {
        const message = document.querySelectorAll('[data-garden-id="forms.input"]')[0].value;
        const components = window.location.href.split("/");
        const ticketId = components[components.length - 1];
        sendResponse({ message: message, ticketId: ticketId });
      } else {
        sendResponse({ message: null, ticketId: null });
      }
    }
  }
);