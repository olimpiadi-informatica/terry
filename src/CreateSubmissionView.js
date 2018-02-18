import React, { Component } from 'react';
import SubmissionView from './SubmissionView';
import {translateComponent} from "./utils";

class CreateSubmissionView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;
    this.inputId = props.inputId;

    if(this.getTaskState().canSubmit(this.inputId)) {
      this.submission = this.getTaskState().createSubmission(this.inputId);
    }
  }

  getTaskState() {
    return this.props.userState.getTaskState(this.taskName);
  }

  render() {
    const { t } = this.props;
    if(this.submission === undefined) return <p>{t("submission.cannot submit")}</p>;
    return <SubmissionView {...this.props} submission={this.submission} />;
  }
}

export default translateComponent(CreateSubmissionView);