import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import SubmissionView from './SubmissionView';
import SubmissionListView from './SubmissionListView';
import ReactMarkdown from 'react-markdown';
import client from './TerryClient';
import Button from 'react-bootstrap/lib/Button';
import Task from './Task';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.task = new Task(props.taskName);

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

  componentWillMount() {
    this.task.loadStatement();
  }

  componentDidMount() {
    this.model.pushObserver(this);
    this.task.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
    this.task.popObserver(this);
  }

  getTask() {
    return this.model.tasksByName[this.task.name];
  }

  getCurrentInput() {
    return this.model.getCurrentInput(this.task.name);
  }

  generateInput() {
    this.model.generateInput(this.task.name);
  }

  createSubmission() {
    const input = this.getCurrentInput();
    this.currentSubmission = this.model.createSubmission(input);
    this.forceUpdate();
  }

  renderCommands() {
    if(this.model.hasCurrentInput(this.task.name)) {
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
      if(this.model.isGeneratingInput(this.task.name)) return <div>Generating...</div>

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
    if(this.task.isLoadingStatement()) return <p>Loading statement...</p>;
    if(!this.task.isLoadedStatement()) return <p>Failed to load task statement. Try realoading page.</p>;

    return <ReactMarkdown source={this.task.getStatement()}/>
  }

  render() {
    return (
      <div>
        <h1>{this.getTask().title}</h1>
        { this.renderCommands() }
        { this.renderSubmissionDialog() }
        <SubmissionListView model={this.model} taskName={this.task.name}></SubmissionListView>

        <hr/>

        { this.renderTaskStatement() }
      </div>
    );
  }
}

export default TaskView;
