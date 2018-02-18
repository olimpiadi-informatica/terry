
import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus'
import faDownload from '@fortawesome/fontawesome-free-solid/faDownload'
import faUpload from '@fortawesome/fontawesome-free-solid/faUpload'
import CreateSubmissionView from './CreateSubmissionView';
import SubmissionListView from './SubmissionListView';
import SubmissionReportView from './SubmissionReportView';
import client from './TerryClient';
import DateView from './DateView';
import { DateTime } from 'luxon';
import {translateComponent} from "./utils";

import ReactMarkdown from 'react-markdown';
import 'katex-all/dist/katex.min.css';
import katex from 'katex-all/dist/katex.min.js';
import renderMathInElement from 'katex-all/dist/contrib/auto-render.min.js';
import PromiseView from './PromiseView';

window.katex = katex

class TaskView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.contest = props.model.getContest();
    this.task = this.model.getTask(props.taskName);
  }

  componentWillMount() {
    this.task.loadStatement();
  }

  componentDidMount() {
    this.model.pushObserver(this);
    this.getTaskState().pushObserver(this);
    this.task.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
    this.getTaskState().popObserver(this);
    this.task.popObserver(this);
  }

  componentDidUpdate() {
    if(this.task.isLoadedStatement()) {
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
        <React.Fragment>
          <a role="button" className="btn btn-primary" href={client.filesBaseURI + currentInput.path} download>
          <FontAwesomeIcon icon={faDownload}/> {t("task.download input")}
          </a>
          {' '}
          <Link to={"/" + this.task.name + "/submit/" + currentInput.id} role="button" className="btn btn-success">
            <FontAwesomeIcon icon={faUpload}/> {t("task.upload solution")}
          </Link>
        </React.Fragment>
      )
    } else {
      if (this.getTaskState().isGeneratingInput()) {
        return (
          <span disabled={true} className="btn btn-success">
            <FontAwesomeIcon icon={faPlus}/> {t("task.requesting")}
          </span>
        );
      } else {
        return (
          <button role="button" className="btn btn-success" onClick={() => this.getTaskState().generateInput()}>
            <FontAwesomeIcon icon={faPlus}/> {t("task.request input")}
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

  returnLastSubmissionInfo(list) {
    const { t } = this.props;
    const items = list.items;
    if (items.length === 0) {
      return null;
    } else {
      const submission = items[items.length-1];
      return <div className="terry-submission-list-button">
        <strong>{t("task.last submission")}</strong> <DateView delta={this.model.timeDelta} date={ DateTime.fromISO(submission.date)}/>
        {' '}
        (<Link to={"/" + this.task.name + "/submissions"}>{t("task.view all")}</Link>)
      </div>
    }
}

  renderSubmissionListButton() {
    const { t } = this.props;
    return <PromiseView
      promise={this.getTaskState().submissionListPromise}
      renderPending={() => null}
      renderFulfilled={(list) => this.returnLastSubmissionInfo(list)}
      renderRejected={(error) => <em>{t("submission.list.load failed")}</em>}
    />
  }

  render() {
    return (
      <React.Fragment>
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
      </React.Fragment>
    );
  }
}

export default translateComponent(TaskView);
