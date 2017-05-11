import React, { Component } from 'react';

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

export default AppView;
