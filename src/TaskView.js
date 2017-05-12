import React, { Component } from 'react';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    console.log("TaskView constructor")
  }

  getTask() {
    return this.model.tasksByName[this.taskName];
  }

  getUserTask() {
    return this.model.user.tasks[this.taskName];
  }

  renderCommands() {
    const userTask = this.getUserTask();

    if(userTask.current_input) {
      return (
        <div>
          <button onClick={this.downloadInput}>Download input</button>
          <button onClick={this.createSubmission}>Submit solution</button>
        </div>
      )
    } else {
      return (
        <div>
          <button onClick={this.generateInput}>Generate input</button>
        </div>
      );
    }
  }

  render() {
    const userTask = this.getUserTask();
    return (
      <div>
        <h1>{this.getTask().title}</h1>
        <p>Previous attempts: {userTask.previous_attempts}</p>
        { this.renderCommands() }
      </div>
    );
  }
}

export default TaskView;
