import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './views/AppView';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import './i18n';
import AdminView from "./views/admin/AdminView";

/******** DEVELOPMENT SPECIFIC **********/
if (window.location.origin.endsWith(":3000")) location.replace("http://localhost:5050");
/******** DEVELOPMENT SPECIFIC **********/

ReactDOM.render(
  <Router>
    <Switch>
      <Route path={'/admin'} component={AdminView} />
      <Route component={AppView} />
    </Switch>
  </Router>,
  document.getElementById('root')
);
