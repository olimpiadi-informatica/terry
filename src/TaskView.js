import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import SubmissionView from './SubmissionView';
import SubmissionListView from './SubmissionListView';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import Modal from 'react-modal';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

    console.log("TaskView constructor");

    this.loadTaskStatement();

    this.modalStyle = {
        overlay : {
          position          : 'fixed',
          top               : 0,
          left              : 0,
          right             : 0,
          bottom            : 0,
          backgroundColor   : 'rgba(42, 42, 42, 0.75)'
        },
        content : {
          position                   : 'absolute',
          top                        : '10%',
          left                       : '15%',
          right                      : '15%',
          bottom                     : '10%',
          border                     : '1px solid #ccc',
          background                 : '#fff',
          overflow                   : 'auto',
          WebkitOverflowScrolling    : 'touch',
          borderRadius               : '4px',
          outline                    : 'none',
          padding                    : '20px',
        }
      };

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
            <span aria-hidden="true" className="fa fa-download"></span> Download input
          </a>
          <a className="btn btn-success top-button" role="button" onClick={() => this.createSubmission()}>
          <span aria-hidden="true" className="fa fa-upload"></span> Upload solution
          </a>
        </div>
      )
    } else {
      return (
        <div>
          <a className="btn btn-success top-button" role="button" onClick={() => this.generateInput()}>
            <span aria-hidden="true" className="fa fa-plus"></span> Generate input
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
    return (
    <Modal
      isOpen={true}
      style={this.modalStyle}
      contentLabel="No Overlay Click Modal">
      <SubmissionView model={this.model} submission={this.currentSubmission} onClose={() => this.onSubmissionClose()} />
      </Modal>
    );
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
