import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import CreateSubmissionView from './CreateSubmissionView';
import SubmissionListView from './SubmissionListView';
import SubmissionReportView from './SubmissionReportView';
import client from '../TerryClient';
import DateView from './DateView';
import {translateComponent} from "../utils";

import ReactMarkdown from 'react-markdown';
import 'katex-all/dist/katex.min.css';
import katex from 'katex-all/dist/katex.min.js';
import renderMathInElement from 'katex-all/dist/contrib/auto-render.min.js';

window.katex = katex

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

  componentDidUpdate() {
    if(this.task.isLoadedStatement()) {
      console.log(this.refs);
      renderMathInElement(this.refs.statement_md, {
        delimiters: [
          {left: "$", right: "$", display: false},
          {left: "$$", right: "$$", display: true},
          {left: "\\[", right: "\\]", display: true},
        ]
      });
    }
  }

  getTaskState() {
    return this.model.getTaskState(this.task.name);
  }

  renderCommands() {
    const { t } = this.props;
    if(this.getTaskState().hasCurrentInput()) {
      const currentInput = this.getTaskState().getCurrentInput();
      return (
        <div>
          <a role="button" className="btn btn-primary" href={client.filesBaseURI + currentInput.path} download>
            <span aria-hidden="true" className="fa fa-download" /> {t("task.download input")}
          </a>
          {' '}
          <Link to={"/" + this.task.name + "/submit/" + currentInput.id} role="button" className="btn btn-success">
            <span aria-hidden="true" className="fa fa-upload" /> {t("task.upload solution")}
          </Link>
        </div>
      )
    } else {
      if (this.getTaskState().isGeneratingInput()) {
        return (
          <button disabled={true} role="button" className="btn btn-success">
            <span aria-hidden="true" className="fa fa-plus" /> {t("task.requesting")}
          </button>
        );
      } else {
        return (
          <button role="button" className="btn btn-success" onClick={() => this.getTaskState().generateInput()}>
          <span aria-hidden="true" className="fa fa-plus" /> {t("task.request input")}
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
    const { t } = this.props;
    if(this.task.isLoadingStatement()) return <p>{t("loading")}</p>;
    if(!this.task.isLoadedStatement()) return <p>{t("task.statement fail")}</p>;

    return <div ref="statement_md">
      <ReactMarkdown
        source={this.task.getStatement()}
        transformImageUri={this.transformUri.bind(this)}
        transformLinkUri={this.transformUri.bind(this)}
      />
    </div>
  }

  renderSubmissionListButton() {
    const { t } = this.props;
    const list = this.getSubmissionList();
    let last_submission;
    if (list.isLoading()) last_submission = <em>{t("loading")}</em>;
    else if(!list.isLoaded()) last_submission = <em>{t("submission.list.load failed")}</em>;
    else {
      const items = list.data.items;
      if (items.length === 0)
        return (<div></div>);
      else {
        const submission = items[items.length-1];
        last_submission = <DateView date={new Date(submission.date)}/>
      }
    }
    return (
      <div>
        <strong>{t("task.last submission")}</strong> {last_submission}
        {' '}
        (<Link to={"/" + this.task.name + "/submissions"}>{t("task.view all")}</Link>)
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

export default translateComponent(TaskView);
