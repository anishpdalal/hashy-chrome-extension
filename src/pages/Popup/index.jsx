import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-chrome-extension-router';
import Popup from './Popup';
import './index.css';

render(
  <Router><Popup /></Router>,
  window.document.querySelector('#app-container')
);

if (module.hot) module.hot.accept();
