
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
import { DateView } from './datetime.views';
import { DateTime } from 'luxon';
import {translateComponent} from "./utils";

import PromiseView from './PromiseView';
import TaskStatementView from './TaskStatementView';

class TaskView extends Component {
  getTask() {
    return this.props.userState.getTask(this.props.taskName);
  }

  getTaskState() {
    return this.props.userState.getTaskState(this.props.taskName);
  }

  componentDidMount() {
    this.props.model.pushObserver(this);
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    this.getTaskState().pushObserver(this);
    this.getTask().pushObserver(this);
  }

  componentWillUpdate() {
    this.getTaskState().popObserver(this);
    this.getTask().popObserver(this);
  }

  componentWillUnmount() {
    this.componentWillUpdate();
    this.props.model.popObserver(this);
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
          <Link to={"/" + this.getTask().name + "/submit/" + currentInput.id} role="button" className="btn btn-success">
            <FontAwesomeIcon icon={faUpload}/> {t("task.upload solution")}
          </Link>
        </React.Fragment>
      )
    } else {
      if (this.getTaskState().isGeneratingInput()) {
        return <PromiseView promise={this.getTaskState().inputGenerationPromise}
          renderPending={() => 
            <button disabled={true} className="btn btn-success">
              <FontAwesomeIcon icon={faPlus}/> {t("task.requesting")}
            </button>
          }
          renderRejected={() =>
            <button disabled={true} className="btn btn-success">
              <FontAwesomeIcon icon={faPlus}/> {t("error")}
            </button>
          }
          renderFulfilled={() => null}
        />;
      } else {
        return (
          <button role="button" className="btn btn-success" onClick={() => this.getTaskState().generateInput()}>
            <FontAwesomeIcon icon={faPlus}/> {t("task.request input")}
          </button>
        );
      }
    }
  }

  renderTaskStatement() {
    const { t } = this.props;
    return <PromiseView promise={this.getTask().statementPromise}
      renderFulfilled={(statement) => <TaskStatementView task={this.getTask()} source={statement} />}
      renderPending={() => <p>{t("loading")}</p>}
      renderRejected={() => <p>{t("task.statement fail")}</p>}
    />;
  }

  returnLastSubmissionInfo(list) {
    const { t } = this.props;
    const items = list.items;
    if (items.length === 0) {
      return null;
    } else {
      const submission = items[items.length-1];
      return <div className="terry-submission-list-button">
        <strong>{t("task.last submission")}</strong> <DateView {...this.props} clock={() => this.props.model.serverTime()} date={ DateTime.fromISO(submission.date)}/>
        {' '}
        (<Link to={"/" + this.getTask().name + "/submissions"}>{t("task.view all")}</Link>)
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
        <h1>{this.getTask().data.title}</h1>
        { this.renderCommands() }

        <Route path="/:taskName/submit/:inputId" render={
          ({match}) => <CreateSubmissionView {...this.props} inputId={match.params.inputId} taskName={match.params.taskName}/>
        }>
        </Route>
        <Route path="/:taskName/submissions" render={
          ({match}) => <SubmissionListView {...this.props} taskName={match.params.taskName}/>
        }/>
        <Route path="/:taskName/submission/:submissionId" render={
          ({match}) => <SubmissionReportView {...this.props} submissionId={match.params.submissionId} taskName={match.params.taskName}/>
        }/>

        { this.renderSubmissionListButton() }

        <hr/>

        { this.renderTaskStatement() }
      </React.Fragment>
    );
  }
}

export default translateComponent(TaskView);
