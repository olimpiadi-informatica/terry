import React, { Component } from 'react';
import SubmissionView from './SubmissionView';
import {translateComponent} from "./utils";

class CreateSubmissionView extends Component {
  constructor(props) {
    super(props);

    if(this.getTaskState().canSubmit(this.props.inputId)) {
      this.submission = this.getTaskState().createSubmission(this.props.inputId);
    }
  }

  getTaskState() {
    return this.props.userState.getTaskState(this.props.taskName);
  }

  render() {
    const { t } = this.props;
    if(this.submission === undefined) return <p>{t("submission.cannot submit")}</p>;
    return <SubmissionView {...this.props} submission={this.submission} />;
  }
}

export default translateComponent(CreateSubmissionView);