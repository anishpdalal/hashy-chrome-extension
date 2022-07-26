import React from 'react';
import { goBack } from 'react-chrome-extension-router';
import secrets from 'secrets';

const Zendesk = () => {
  const [link, setLink] = React.useState("");

  async function getZendeskLink(link) {
    const response = await fetch(`${secrets.apiHost}/v0/auth/zendesk`,
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
    getZendeskLink(event.target[0].value)
      .then(response => {
        setLink(response.authorization_url);
      })
  };

  const handleZendeskSubmission = event => {
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
      <h1>Zendesk</h1>
      <form onSubmit={handleSubmit}>
        <p>Enter your Zendesk URL</p>
        <input
          id="zendesk"
          type="text"
          style={{ width: "65%", marginBottom: "10px" }}
          placeholder="eg. <subdomain>.zendesk.com" />
        <button style={{ marginBottom: "10px" }} type="submit">Generate Zendesk Integration Link</button>
      </form>
      {link &&
        <a href={link} onClick={handleZendeskSubmission}>Zendesk Link</a>
      }
    </div>
  );
}

export default Zendesk;