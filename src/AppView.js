import React, { Component } from 'react';

import ContestView from './ContestView';
import LoginView from './LoginView';
import Model from './Model';

export default class AppView extends Component {
  constructor(props) {
    super(props);

    this.model = new Model();
  }

  componentWillMount() {
    this.model.onAppStart();
  }

  componentDidMount() {
    this.model.pushObserver(this);
    this.model.getContest().pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
    this.model.getContest().popObserver(this);
  }

  render() {
    if (!this.model.getContest().isLoaded()) return <div>Loading contest...</div>;
    if (!this.model.isLoggedIn()) return <LoginView model={this.model}/>;
    if (!this.model.isUserLoaded()) return <div>Loading user...</div>;

    return (
      <div>
        <ContestView model={this.model}/>
      </div>
    );
  }
}
