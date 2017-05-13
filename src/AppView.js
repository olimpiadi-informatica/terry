import React, { Component } from 'react';

import ContestView from './ContestView';
import LoginView from './LoginView';
import Model from './Model';

class AppView extends Component {
  constructor(props) {
    super(props);

    this.model = new Model();

    this.model.loadContest();
    this.model.maybeLoadUser();
  }

  componentDidMount() {
    this.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
  }

  render() {
    if (!this.model.isContestLoaded()) return <div>Loading contest...</div>;
    if (!this.model.isLoggedIn()) return <LoginView model={this.model}/>;
    if (!this.model.isUserLoaded()) return <div>Loading user...</div>;

    return (
      <div>
        <ContestView model={this.model}/>
      </div>
    );
  }

}

export default AppView;
