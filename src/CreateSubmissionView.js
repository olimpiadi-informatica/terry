import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import SubmissionView from './SubmissionView';

export default class CreateSubmissionView extends Component {
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
    return this.model.getTaskState(this.taskName);
  }

  render() {
    if(this.submission === undefined) return <p>Cannot submit for this input.</p>
    return <SubmissionView model={this.model} submission={this.submission}></SubmissionView>;
  }
}
