import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';
import './i18n.css';

import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './views/AppView';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import i18n from './i18n';
import AdminView from "./views/admin/AdminView";

/******** DEVELOPMENT SPECIFIC **********/
if (window.location.origin.endsWith(":3000")) location.replace("http://localhost:5050");
/******** DEVELOPMENT SPECIFIC **********/

// when the language changes set the attribute so that bootstrap components can be translated via css
i18n.on("languageChanged", lang => document.getElementsByTagName("html")[0].setAttribute("lang", lang.substr(0,2)));

// handle errors in promises
window.addEventListener('unhandledrejection', event => {
    window.alert('An error occurred. Please reload the page. (' + (event.reason||'<no reason>') + ')');
});

ReactDOM.render(
  <Router>
    <Switch>
      <Route path={'/admin'} component={AdminView} />
      <Route component={AppView} />
    </Switch>
  </Router>,
  document.getElementById('root')
);
