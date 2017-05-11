import React, { Component } from 'react';
import axios from 'axios';
import TaskView from './TaskView';

class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.currentTaskName = this.model.contest.tasks[0].name;
  }

  render() {
    return (
      <div>
        <nav className="leftcol">
          <ul>
          { this.model.contest.tasks.map((item, i) => <li key={ i }>{ item.name }</li>) }
          </ul>
        </nav>
        <TaskView model={this.model} taskName={this.currentTaskName} />
      </div>
    );
  }
}

export default ContestView;
