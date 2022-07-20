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

const Popup = () => {

  const docTypeOptions = [
    { label: "All", value: "all" },
    { label: "Help Center Article", value: "zendesk_hc_article_body" },
    { label: "Ticket", value: "zendesk_ticket" },
    { label: "Ticket Comment", value: "zendesk_ticket_comment" },
  ];

  const [googleAuthLink, setGoogleAuthLink] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [queryId, setQueryId] = useState(null);
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("all");
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
    chrome.tabs && chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      chrome.tabs.sendMessage(
        tabs[0].id || 0,
        { message: 'title' },
        (response) => {
          if (response.message !== null) {
            setTicketId(response.ticketId);
            setTitle(response.message);
          }
        });
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

  return (
    <div className="App">
      <h1>Hashy</h1>
      {(googleAuthLink && !loggedIn) &&
        <a href={googleAuthLink}
          target="_blank">
          Login with Google
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
