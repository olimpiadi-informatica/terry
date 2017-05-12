import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import SubmissionView from './SubmissionView';
import SubmissionListView from './SubmissionListView';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    console.log("TaskView constructor");

    this.loadTaskStatement();
  }

  loadTaskStatement() {
    return axios.get('/' + this.taskName + '.md')
      .then((response) => {
        this.taskStatement = response.data;
        this.forceUpdate();
      });
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
          <a className="btn btn-primary top-button" role="button" onClick={() => this.donwloadInput()}>
            Download input
          </a>
          <a className="btn btn-success top-button" role="button" onClick={() => this.createSubmission()}>
            Submit solution
          </a>
        </div>
      )
    } else {
      return (
        <div>
          <a className="btn btn-primary top-button" role="button" onClick={() => this.generateInput()}>
            Generate input
          </a>
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

  renderTaskStatement() {
    if (this.taskStatement === undefined)
      return <div>Loading...</div>;
    else
      return <ReactMarkdown source={this.taskStatement}/>
  }

  render() {
    const userTask = this.getUserTask();

    return (
      <div>
        <h1>{this.getTask().title}</h1>
        <p>Previous attempts: {userTask.previous_attempts}</p>
        { this.renderCommands() }
        { this.renderSubmissionDialog() }
        <SubmissionListView model={this.model} taskName={this.taskName}></SubmissionListView>

        <hr/>

        { this.renderTaskStatement() }
      </div>
    );
  }
}

export default TaskView;
