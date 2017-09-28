import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './views/AppView';
import { BrowserRouter as Router } from 'react-router-dom';

/******** DEVELOPMENT SPECIFIC **********/
if (window.location.origin.endsWith(":3000")) location.replace("http://localhost:5050");
/******** DEVELOPMENT SPECIFIC **********/

ReactDOM.render(
  <Router>
    <AppView />
  </Router>,
  document.getElementById('root')
);
