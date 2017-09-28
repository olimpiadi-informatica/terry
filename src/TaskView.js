import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import CreateSubmissionView from './CreateSubmissionView';
import SubmissionListView from './SubmissionListView';
import SubmissionReportView from './SubmissionReportView';
import ReactMarkdown from 'react-markdown';
import client from './TerryClient';
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
    this.getSubmissionList().load();
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

  transformUri(url) {
    const taskBaseUri = this.task.data.statement_path.match(/.*\//)[0];
    return client.statementsBaseURI + taskBaseUri + url;
  }

  renderTaskStatement() {
    if(this.task.isLoadingStatement()) return <p>Loading statement...</p>;
    if(!this.task.isLoadedStatement()) return <p>Failed to load task statement. Try reloading the page.</p>;

    return <ReactMarkdown source={this.task.getStatement()}
                          transformImageUri={this.transformUri.bind(this)}
                          transformLinkUri={this.transformUri.bind(this)}/>
  }

  renderSubmissionListButton() {
    const list = this.getSubmissionList();
    let last_submission;
    if (list.isLoading()) last_submission = <em>Loading...</em>;
    else if(!list.isLoaded()) last_submission = <em>Loading submission list failed, reload the page.</em>;
    else {
      const items = list.data.items;
      if (items.length === 0)
        last_submission = <em>None</em>;
      else {
        const submission = items[items.length-1];
        last_submission = <DateView date={new Date(submission.date)}/>
      }
    }
    return (
      <div>
        <strong>Last submission</strong>: {last_submission}
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

        <Route path="/:taskName/submit/:inputId" render={
          ({match}) => <CreateSubmissionView model={this.model} inputId={match.params.inputId} taskName={this.task.name}/>
        }>
        </Route>
        <Route path="/:taskName/submissions" render={
          ({match}) => <SubmissionListView model={this.model} taskName={this.task.name}/>
        }/>
        <Route path="/:taskName/submission/:submissionId" render={
          ({match}) => <SubmissionReportView model={this.model} submissionId={match.params.submissionId} taskName={this.task.name}/>
        }/>

        { this.renderSubmissionListButton() }

        <hr/>

        { this.renderTaskStatement() }
      </div>
    );
  }
}

export default TaskView;
