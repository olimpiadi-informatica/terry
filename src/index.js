import React from 'react';
import ReactDOM from 'react-dom';
import AppView from './AppView';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

ReactDOM.render(
  <Router>
    <AppView />
  </Router>,
  document.getElementById('root')
);
