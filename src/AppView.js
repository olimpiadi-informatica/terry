import React, { Component } from 'react';

import LoginView from './LoginView'
import ContestView from './ContestView';
import Model from './Model';

class AppView extends Component {
  constructor(props) {
    super(props);

    this.model = new Model({"view": this});
    this.model.loadContest();
  }

  render() {
    if (this.model.isContestLoaded()) {
      if(this.model.isLoggedIn()) {
        return <ContestView model={this.model}/>;
      } else {
        return <LoginView model={this.model}/>;
      }
    } else {
      return (
        <div>Loading...</div>
      );
    }
  }
}

export default AppView;
