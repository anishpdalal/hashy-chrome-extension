import React from 'react';
import { goBack, Link } from 'react-chrome-extension-router';

const Zendesk = () => {
  const [link, setLink] = React.useState("");

  async function getZendeskLink(link) {
    const response = await fetch(`${process.env.API_HOST}/v0/auth/zendesk`,
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
        <a href={link} target="_blank">Zendesk link</a>
      }
    </div>
  );
}

const Integration = () => {
  return (
    <div className="App">
      <button onClick={() => goBack()}>Back</button>
      <h1>Integrations</h1>
      <Link component={Zendesk}>Zendesk</Link>
    </div>
  );
};

export default Integration;