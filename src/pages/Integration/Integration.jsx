import React from 'react';
import { goBack, Link } from 'react-chrome-extension-router';
import Hubspot from './Hubspot';
import Zendesk from './Zendesk';


const Integration = () => {
  return (
    <div className="App">
      <button onClick={() => goBack()}>Back</button>
      <h1>Integrations</h1>
      <Link component={Zendesk}>Zendesk</Link>
      <br />
      <br />
      <Link component={Hubspot}>HubSpot</Link>
    </div>
  );
};

export default Integration;