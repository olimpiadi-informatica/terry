import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './AppView';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

/******** DEVELOPMENT SPECIFIC **********/
if (window.location.origin.endsWith("3000")) location.replace("http://localhost:5050");
/******** DEVELOPMENT SPECIFIC **********/

ReactDOM.render(
  <Router>
    <AppView />
  </Router>,
  document.getElementById('root')
);
