import React, { Component } from 'react';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    this.task = this.model.tasksByName[this.taskName];
    console.log("TaskView constructor")
  }

  render() {
    return (
      <h1>{this.model.tasksByName[this.taskName].title}</h1>
    );
  }
}

export default TaskView;
