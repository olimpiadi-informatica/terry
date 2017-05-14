import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import CreateSubmissionView from './CreateSubmissionView';
import SubmissionListView from './SubmissionListView';
import ReactMarkdown from 'react-markdown';
import client from './TerryClient';
import Task from './Task';
import DateView from './DateView';

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.contest = props.model.getContest();
    this.task = this.contest.getTask(props.taskName);
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
          <a role="button" className="btn btn-primary" href={client.filesBaseURI + currentInput.path} download>
            <span aria-hidden="true" className="fa fa-download"></span> Download input
          </a>
          {' '}
          <Link to={"/" + this.task.name + "/submit/" + currentInput.id} role="button" className="btn btn-success">
            <span aria-hidden="true" className="fa fa-upload"></span> Upload solution
          </Link>
        </div>
      )
    } else {
      if (this.getTaskState().isGeneratingInput()) {
        return (
          <button disabled={true} role="button" className="btn btn-success">
            <span aria-hidden="true" className="fa fa-plus"></span> Requesting...
          </button>
        );
      } else {
        return (
          <button role="button" className="btn btn-success" onClick={() => this.getTaskState().generateInput()}>
          <span aria-hidden="true" className="fa fa-plus"></span> Request input
          </button>
        );
      }
    }
  }

  renderTaskStatement() {
    if(this.task.isLoadingStatement()) return <p>Loading statement...</p>;
    if(!this.task.isLoadedStatement()) return <p>Failed to load task statement. Try reloading the page.</p>;

    return <ReactMarkdown source={this.task.getStatement()}/>
  }

  renderSubmissionDialog(inputId) {
    return (
      <div className="static-modal">
        <CreateSubmissionView model={this.model} inputId={inputId} taskName={this.task.name}></CreateSubmissionView>
      </div>
    );
  }

  renderSubmissionListDialog() {
    return <SubmissionListView model={this.model} taskName={this.task.name}></SubmissionListView>;
  }

  renderSubmissionListButton() {
    console.log(this.task)
    return (
      <div>
        <strong>Last submission</strong>: <DateView date={new Date()}/>
        {' '}
        (<Link to={"/" + this.task.name + "/submissions"}>view all submissions</Link>)
      </div>
    );
  }

  render() {
    return (
      <div>
        <h1>{this.task.data.title}</h1>
        { this.renderCommands() }

        <Route path="/:taskName/submit/:inputId" render={({match}) => this.renderSubmissionDialog(match.params.inputId)}></Route>
        <Route path="/:taskName/submissions" render={({match}) => this.renderSubmissionListDialog()}></Route>
        <Route path="/:taskName/submission/:submissionId" render={({match}) => this.renderSubmissionReportDialog(match.params.submissionId)}></Route>

        { this.renderSubmissionListButton() }

        <hr/>

        { this.renderTaskStatement() }
      </div>
    );
  }
}

export default TaskView;
