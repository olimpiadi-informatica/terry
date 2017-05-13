import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import SubmissionView from './SubmissionView';
import SubmissionListView from './SubmissionListView';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import Button from 'react-bootstrap/lib/Button';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;

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

  getCurrentInput() {
    return this.model.getCurrentInput(this.taskName);
  }

  generateInput() {
    this.model.generateInput(this.taskName);
    this.forceUpdate();
  }

  createSubmission() {
    const input = this.getCurrentInput();
    this.currentSubmission = this.model.createSubmission(input);
    this.forceUpdate();
  }

  renderCommands() {
    if(this.model.hasCurrentInput(this.taskName)) {
      return (
        <div>
          <button role="button" className="btn btn-primary top-button" onClick={() => this.downloadInput()}>
            <span aria-hidden="true" className="fa fa-download"></span> Download input
          </button>
          {' '}
          <button role="button" className="btn btn-success top-button" onClick={() => this.createSubmission()}>
            <span aria-hidden="true" className="fa fa-upload"></span> Upload solution
          </button>
        </div>
      )
    } else {
      if(this.model.isGeneratingInput(this.taskName)) return <div>Generating...</div>

      return (
        <div>
          <button role="button" className="btn btn-success top-button" onClick={() => this.generateInput()}>
            <span aria-hidden="true" className="fa fa-plus"></span> Generate input
          </button>
        </div>
      );
    }
  }

  onSubmissionClose() {
    delete this.currentSubmission;
    this.forceUpdate();
  }

  renderSubmissionDialog() {
    if (this.currentSubmission === undefined) return null;

    return (
      <div className="static-modal">
        <SubmissionView model={this.model} submission={this.currentSubmission} onClose={ () => this.onSubmissionClose() }/>
      </div>
    );
  }

  renderTaskStatement() {
    if (this.taskStatement === undefined)
      return (<div>Loading...</div>);
    else
      return <ReactMarkdown source={this.taskStatement}/>
  }

  render() {
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
