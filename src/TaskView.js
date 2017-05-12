import React, { Component } from 'react';
import SubmissionView from './SubmissionView';

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

  getCurrentInput() {
    return this.model.getCurrentInput(this.taskName);
  }

  generateInput() {
    return this.model.generateInput(this.taskName);
  }

  createSubmission() {
    const input = this.getCurrentInput();
    this.currentSubmission = this.model.createSubmission(input);
    this.forceUpdate();
  }

  renderCommands() {
    const userTask = this.getUserTask();

    if(userTask.current_input) {
      return (
        <div>
          <button onClick={() => this.downloadInput()}>Download input</button>
          <button onClick={() => this.createSubmission()}>Submit solution</button>
        </div>
      )
    } else {
      return (
        <div>
          <button onClick={() => this.generateInput()}>Generate input</button>
        </div>
      );
    }
  }

  onSubmissionClose() {
    delete this.currentSubmission;
    this.forceUpdate();
  }

  renderSubmissionDialog() {
    if(this.currentSubmission === undefined) return null;

    return <SubmissionView model={this.model} submission={this.currentSubmission} onClose={() => this.onSubmissionClose()} />;
  }

  render() {
    const userTask = this.getUserTask();
    return (
      <div>
        <h1>{this.getTask().title}</h1>
        <p>Previous attempts: {userTask.previous_attempts}</p>
        { this.renderCommands() }
        { this.renderSubmissionDialog() }
      </div>
    );
  }
}

export default TaskView;
