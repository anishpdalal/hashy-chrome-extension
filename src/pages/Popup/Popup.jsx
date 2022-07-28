import React, { useState, useEffect } from 'react';
import sanitizeHtml from 'sanitize-html';
import { Link } from 'react-chrome-extension-router';
import Integration from '../Integration/Integration';
import Analytics from '../Analytics/Analytics';
import secrets from 'secrets';
import './Popup.css';

async function getGoogleAuthLink() {
  const response = await fetch(`${secrets.apiHost}/v0/auth/cookie/google/authorize`);
  const responseJson = await response.json();
  return responseJson.authorization_url;
}

async function isUserLoggedIn() {
  const response = await fetch(`${secrets.apiHost}/v0/users/me`, { credentials: 'include' })
  if (response.status !== 200) {
    return false;
  }
  const responseJson = await response.json();
  return responseJson.is_active;
}

const DOC_TYPE_MAPPING = {
  "zendesk_integration": [
    { label: "Zendesk Help Center Article", value: "zendesk_hc_article_body" },
    { label: "Zendesk Ticket", value: "zendesk_ticket" },
    { label: "Zendesk Ticket Comment", value: "zendesk_ticket_comment" },
  ],
  "hubspot_integration": [
    { label: "HubSpot Help Center Article", value: "hubspot_hc_article_body" },
  ]
};

async function getDocTypeOptions() {
  const response = await fetch(`${secrets.apiHost}/v0/sources`, { credentials: 'include' })
  if (response.status !== 200) {
    return [{ label: "All", value: "all" }];
  }
  const responseJson = await response.json();
  let options = [{ label: "All", value: "all" }];
  responseJson.forEach(x => options.push(...DOC_TYPE_MAPPING[x.name]));
  return options;
}

async function getSearchResults(query, doc_type = null, ticketId = null) {
  let queryStr;
  if (doc_type && doc_type !== "all") {
    queryStr = `query=${query}&doc_type=${doc_type}`
  } else {
    queryStr = `query=${query}`
  }
  if (ticketId) {
    queryStr = `${queryStr}&log_id=${ticketId}`
  }
  const response = await fetch(`${secrets.apiHost}/v0/search?${queryStr}`, { credentials: 'include' })
  const responseJson = await response.json();
  return responseJson;
}

async function getZendeskTicketSubject(ticketId) {
  const response = await fetch(`${secrets.apiHost}/v0/sources/zendesk/tickets/${ticketId}`, { credentials: 'include' })
  const responseJson = await response.json();
  return responseJson
}

async function getHubSpotTicketSubject(ticketId) {
  const response = await fetch(`${secrets.apiHost}/v0/sources/hubspot/tickets/${ticketId}`, { credentials: 'include' })
  const responseJson = await response.json();
  return responseJson
}

const Popup = () => {

  const [googleAuthLink, setGoogleAuthLink] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [queryId, setQueryId] = useState(null);
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("all");
  const [docTypeOptions, setDocTypeOptions] = useState([{ label: "All", value: "all" }]);
  const [title, setTitle] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  useEffect(() => {
    if (title) {
      setLoading(true);
      getSearchResults(title, docType, ticketId)
        .then(response => {
          setLoading(false);
          setResults(response.results);
          setAnswer(response.answer);
          setQueryId(response.query_id);
        })
    }
  }, [title]);


  const handleSubmit = event => {
    event.preventDefault();
    setLoading(true);
    getSearchResults(query, docType, ticketId)
      .then(response => {
        setLoading(false);
        setResults(response.results);
        setAnswer(response.answer);
        setQueryId(response.query_id);
      })
  };

  useEffect(() => {
    getGoogleAuthLink()
      .then(url => {
        setGoogleAuthLink(url);
      });
    isUserLoggedIn()
      .then(status => {
        setLoggedIn(status);
      })
    getDocTypeOptions()
      .then(options => {
        setDocTypeOptions(options);
      })
    chrome.tabs && chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      const url = tabs[0].url;
      let ticket_id;
      if (url.includes("zendesk.com/agent/tickets")) {
        ticket_id = url.split("/")[url.split("/").length - 1];
        getZendeskTicketSubject(ticket_id)
          .then(response => {
            setTicketId(ticket_id);
            setTitle(response.ticket_subject);
          })
      } else if (/hubspot\.com\/contacts\/\d+\/ticket\/\d+/.test(url)) {
        ticket_id = url.split("/")[url.split("/").length - 1];
        getHubSpotTicketSubject(ticket_id)
          .then(response => {
            setTicketId(ticket_id);
            setTitle(response.ticket_subject);
          })
      } else { };
    });

  }, []);

  const handleAnchorClick = event => {
    event.preventDefault();
    chrome.tabs.create({ url: event.currentTarget.href, active: false });
    fetch(`${secrets.apiHost}/v0/log`,
      {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query_id: queryId, event_type: "SEARCH_RESULT_CLICK", message: event.currentTarget.href })
      }
    );
  };

  const handleLoginClick = event => {
    event.preventDefault();
    var w = 400;
    var h = 600;
    var left = (screen.width / 2) - (w / 2);
    var top = (screen.height / 2) - (h / 2);
    chrome.windows.create({ 'url': event.currentTarget.href, 'type': 'popup', 'width': w, 'height': h, 'left': left, 'top': top }, function (window) { });
  };

  async function handleLogoutClick(event) {
    event.preventDefault();
    await fetch(event.currentTarget.href,
      {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    window.close();
  }

  return (
    <div className="App">
      <h1>Hashy</h1>
      {(googleAuthLink && !loggedIn) &&
        <a href={googleAuthLink}
          onClick={handleLoginClick}>
          Login with Google
        </a>
      }
      {loggedIn &&
        <a href={`${secrets.apiHost}/v0/auth/cookie/logout`}
          onClick={handleLogoutClick}>
          Logout
        </a>
      }
      {loggedIn &&
        <div className="integration">
          <Link component={Integration}>Integrations</Link>
        </div>
      }
      {loggedIn &&
        <div className="analytics">
          <Link component={Analytics}>Analytics</Link>
        </div>
      }
      {loggedIn &&
        <div style={{ marginTop: "10px" }}>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="search"
              placeholder="Search"
              style={{ width: '75%' }}
              onChange={event => setQuery(event.target.value)} />
            <button style={{ marginLeft: "5px" }} type="submit">Submit</button>
            <div style={{ marginTop: "10px" }}>
              <label>
                Filter Document Type:
                <select style={{ marginLeft: "5px" }} value={docType} onChange={(event) => setDocType(event.target.value)}>
                  {docTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </form>
        </div>
      }
      {(loggedIn && loading) &&
        <div className="loader"></div>
      }
      <div>
        {(loggedIn && answer) &&
          <div className="answer">
            <p><strong>Suggestion</strong>: {answer}</p>
          </div>
        }
        {(loggedIn && results) &&
          results.map((result, index) => {
            return (
              <div className="box" key={index}>
                <p><a onClick={handleAnchorClick} href={result.doc_url}>{result.doc_name}</a></p>
                <p><strong>Last Updated</strong>: {new Date(result.doc_last_updated).toLocaleString()}</p>
                <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.text) }} />
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default Popup;
