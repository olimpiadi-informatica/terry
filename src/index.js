import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './AppView';
import './index.css';
import { HashRouter, Route, Link } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

ReactDOM.render(
  <HashRouter>
    <AppView />
  </HashRouter>,
  document.getElementById('root')
);
