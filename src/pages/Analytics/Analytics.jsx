import React, { useState, useEffect } from 'react';
import { goBack } from 'react-chrome-extension-router';
import secrets from 'secrets';

async function getZendeskSource() {
  const response = await fetch(`${secrets.apiHost}/v0/sources/zendesk`, { credentials: 'include' });
  const responseJson = await response.json();
  return responseJson
}

const Analytics = () => {
  const [sourceId, setSourceId] = React.useState("");
  useEffect(() => {
    getZendeskSource()
      .then(response => {
        setSourceId(response.id);
      })
  }, []);

  const handleSubmit = event => {
    event.preventDefault();
    fetch(`${secrets.apiHost}/v0/sources/zendesk/analytics`, {
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
      {sourceId &&
        <form onSubmit={handleSubmit}>
          <button type="submit">Generate Zendesk Report</button>
        </form>
      }
    </div>
  );
};

export default Analytics;