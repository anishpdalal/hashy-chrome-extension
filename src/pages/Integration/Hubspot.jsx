import React from 'react';
import { goBack } from 'react-chrome-extension-router';
import secrets from 'secrets';

const Hubspot = () => {
  const [link, setLink] = React.useState("");

  async function hubSpotLink(link) {
    const response = await fetch(`${secrets.apiHost}/v0/auth/hubspot`,
      {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ subdomain: link })
      }
    );
    const responseJson = await response.json();
    return responseJson;
  }


  const handleSubmit = event => {
    event.preventDefault();
    hubSpotLink(event.target[0].value)
      .then(response => {
        setLink(response.authorization_url);
      })
  };

  const handleHubSpotSubmission = event => {
    event.preventDefault();
    var w = 400;
    var h = 600;
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    chrome.windows.create({ 'url': event.currentTarget.href, 'type': 'popup', 'width': w, 'height': h, 'left': left, 'top': top }, function (window) { });
  }

  return (
    <div className="App">
      <button onClick={() => goBack()}>Back</button>
      <h1>HubSpot</h1>
      <form onSubmit={handleSubmit}>
        <p>Enter your HubSpot Support Page URL</p>
        <input
          id="hubspot"
          type="text"
          style={{ width: "65%", marginBottom: "10px" }}
          placeholder="eg. support.example.com" />
        <button style={{ marginBottom: "10px" }} type="submit">Generate HubSpot Integration Link</button>
      </form>
      {link &&
        <a href={link} onClick={handleHubSpotSubmission}>HubSpot Link</a>
      }
    </div>
  );
}

export default Hubspot;