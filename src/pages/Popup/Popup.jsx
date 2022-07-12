import React, { useState, useEffect } from 'react';
import sanitizeHtml from 'sanitize-html';
import { Link } from 'react-chrome-extension-router';
import Integration from '../Integration/Integration';
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

async function getSearchResults(query) {
  const response = await fetch(`${secrets.apiHost}/v0/search?query=${query}`, { credentials: 'include' })
  const responseJson = await response.json();
  return responseJson;
}

const Popup = () => {

  const [googleAuthLink, setGoogleAuthLink] = useState("");
  const [loggedIn, setLoggedIn] = useState(false)
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (title) {
      setLoading(true);
      getSearchResults(title)
        .then(response => {
          setLoading(false);
          setResults(response.results);
          setAnswer(response.answer);
        })
    }
  }, [title]);

  const [query, setQuery] = useState("")
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false)

  const handleSubmit = event => {
    event.preventDefault();
    setLoading(true);
    getSearchResults(query)
      .then(response => {
        setLoading(false);
        setResults(response.results);
        setAnswer(response.answer);
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
            setTitle(response.message);
          }
        });
    });

  }, []);

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
        <div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="search"
              placeholder="Search"
              style={{ width: '75%' }}
              onChange={event => setQuery(event.target.value)} />
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
                <p><a href={result.doc_url} target="_blank">{result.doc_name}</a></p>
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
