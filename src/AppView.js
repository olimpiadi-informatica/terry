import React, { Component } from 'react';

import ContestView from './ContestView';
import LoginView from './LoginView';
import Model from './Model';

class AppView extends Component {
  constructor(props) {
    super(props);

    this.model = new Model({"view": this});

    this.model.loadContest();
    this.model.maybeLoadUser();
  }

  render() {
    if (!this.model.isContestLoaded()) return <div>Loading contest...</div>;
    if (!this.model.isLoggedIn()) return <LoginView model={this.model}/>;
    if (!this.model.isUserLoaded()) return <div>Loading user...</div>;

    return (
      <div>
        <ContestView model={this.model}/>
        <button onClick={() => this.model.logout()}>Log out</button>
      </div>
    );
  }

}

export default AppView;
