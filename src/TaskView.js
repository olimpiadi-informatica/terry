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
    this.contest = props.model.getContest();
    this.task = this.contest.getTask(props.taskName);

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

  getSubmissionList() {
    return this.model.getTaskState(this.task.name).getSubmissionList();
  }

  componentWillMount() {
    this.task.loadStatement();
  }

  componentDidMount() {
    this.model.pushObserver(this);
    this.getSubmissionList().pushObserver(this);
    this.getTaskState().pushObserver(this);
    this.task.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
    this.getSubmissionList().popObserver(this);
    this.getTaskState().popObserver(this);
    this.task.popObserver(this);
  }

  getTaskState() {
    return this.model.getTaskState(this.task.name);
  }

  renderCommands() {
    if(this.getTaskState().hasCurrentInput()) {
      const currentInput = this.getTaskState().getCurrentInput();
      return (
        <div>
          <button role="button" className="btn btn-primary top-button" onClick={() => this.downloadInput()}>
            <span aria-hidden="true" className="fa fa-download"></span> Download input
          </button>
          {' '}
          <Link to={"/" + this.task.name + "/submit/" + currentInput.id} role="button" className="btn btn-success top-button">
            <span aria-hidden="true" className="fa fa-upload"></span> Upload solution
          </Link>
        </div>
      )
    } else {
      if(this.getTaskState().isGeneratingInput()) return <div>Generating...</div>

      return (
        <div>
          <button role="button" className="btn btn-success top-button" onClick={() => this.getTaskState().generateInput()}>
            <span aria-hidden="true" className="fa fa-plus"></span> Generate input
          </button>
        </div>
      );
    }
  }

  renderTaskStatement() {
    if(this.task.isLoadingStatement()) return <p>Loading statement...</p>;
    if(!this.task.isLoadedStatement()) return <p>Failed to load task statement. Try realoading page.</p>;

    return <ReactMarkdown source={this.task.getStatement()}/>
  }

  renderSubmissionDialog(inputId) {
    return (
      <div className="static-modal">
        <SubmissionView model={this.model} inputId={inputId} taskName={this.task.name}></SubmissionView>
      </div>
    );
  }

  renderSubmissionList(submission) {
    const list = this.getSubmissionList();
    if(list.isLoaded() && !list.isEmpty()) {
      return <SubmissionListView model={this.model} taskName={this.task.name} submission={submission}></SubmissionListView>;
    }
  }

  render() {
    return (
      <div>
        <h1>{this.task.data.title}</h1>
        { this.renderCommands() }

        <Route path="/:taskName/submit/:inputId" render={({match}) => this.renderSubmissionDialog(match.params.inputId)}></Route>
        { this.renderSubmissionList() }

        <hr/>

        { this.renderTaskStatement() }
      </div>
    );
  }
}

export default TaskView;
