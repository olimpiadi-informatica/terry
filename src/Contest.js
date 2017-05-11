import React, { Component } from 'react';
import axios from 'axios';

class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  render() {
    return (
      <div className="leftcol">
        <ul>
        { this.model.contest.tasks.map((item, i) => <li key={ i }>{ item.name }</li>) }
        </ul>
      </div>
    );
  }
}

export default ContestView;
