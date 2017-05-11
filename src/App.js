import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import axios from 'axios';

import ContestView from './Contest.js';

class Model {
    constructor(props) {
      this.view = props.view;
    }

    loadContest() {
      delete this.contest;

      axios.get('http://localhost:3001/contest')
        .then((response) => {
          this.contest = response.data;
          this.view.forceUpdate();
        });
    }

    isContestLoaded() {
      return this.contest !== undefined;
    }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.model = new Model({"view": this});
    this.model.loadContest();
  }

  render() {
    if (this.model.isContestLoaded()) {
      return (
        <ContestView model={this.model}/>
      );
    } else {
      return (
        <div>Loading...</div>
      );
    }
  }
}

export default App;
