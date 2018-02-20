import 'bootstrap/dist/css/bootstrap.css';
import './style.css';
import './i18n.css';

import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './AppView';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import i18n from './i18n';
import PackView from "./PackView";

/******** DEVELOPMENT SPECIFIC **********/
if (window.location.origin.endsWith(":3000")) window.location.replace("http://localhost:5050");
/******** DEVELOPMENT SPECIFIC **********/

// when the language changes set the attribute so that bootstrap components can be translated via css
i18n.on("languageChanged", lang => document.getElementsByTagName("html")[0].setAttribute("lang", lang.substr(0,2)));

// handle errors in promises
window.addEventListener('unhandledrejection', event => {
  // FIXME: dirty trick to avoid alerts in development
  if(!window.location.origin.endsWith(":5050"))
    window.alert('An error occurred. Please reload the page. (' + (event.reason||'<no reason>') + ')');
});

ReactDOM.render(
  <Router>
    <Switch>
      <Route path={'/admin'} component={PackView} />
      <Route component={AppView} />
    </Switch>
  </Router>,
  document.getElementById("terry-container")
);
