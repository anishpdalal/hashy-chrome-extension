import React, { useState, useEffect } from 'react';
import { goBack } from 'react-chrome-extension-router';
import secrets from 'secrets';

async function getSources() {
  const response = await fetch(`${secrets.apiHost}/v0/sources/me`, { credentials: 'include' });
  const responseJson = await response.json();
  return responseJson.map((x) => x.name);
}

const DOC_TYPE_MAPPING = {
  "zendesk_integration": { label: "Generate Zendesk Report", url: `${secrets.apiHost}/v0/sources/zendesk/analytics` },
  "hubspot_integration": { label: "Generate HubSpot Report", url: `${secrets.apiHost}/v0/sources/hubspot/analytics` },
};

const Analytics = () => {
  const [sources, setSources] = useState([]);
  useEffect(() => {
    getSources()
      .then(response => {
        setSources(response);
      })
  }, []);

  const handleSubmit = event => {
    event.preventDefault();
    fetch(DOC_TYPE_MAPPING[event.currentTarget.id].url, {
      credentials: "include",
      method: "GET"
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(
          new Blob([blob]),
        );
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute("download", "report.csv");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      });
  };

  return (
    <div className="App">
      <button onClick={() => goBack()}>Back</button>
      <h1>Analytics</h1>
      {sources &&
        sources.map((source, index) => {
          return (
            <div>
              <form id={source} onSubmit={handleSubmit}>
                <button type="submit">{DOC_TYPE_MAPPING[source].label}</button>
              </form>
              <br />
            </div>
          );
        })
      }
    </div>
  );
};

export default Analytics;