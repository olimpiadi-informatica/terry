import React, { Component } from 'react';
import TaskView from './TaskView';

class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.currentTaskName = this.model.contest.tasks[0].name;
  }

  setCurrentTask(name) {
    this.currentTaskName = name;
    this.forceUpdate();
  }

  taskNavItem(item, i) {
    return (
      <li key={ i }>
        <button onClick={this.setCurrentTask.bind(this, item.name)}>{ item.name }</button>
      </li>
    );
  }

  render() {
    return (
      <div>
        <nav className="leftcol">
          <ul>
          { this.model.contest.tasks.map(this.taskNavItem.bind(this)) }
          </ul>
        </nav>
        <TaskView model={this.model} key={this.currentTaskName} taskName={this.currentTaskName} />
      </div>
    );
  }
}

export default ContestView;
