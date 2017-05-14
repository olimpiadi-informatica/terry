import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ModalView from './ModalView';

export default class SubmissionReportView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;
    this.submissionId = props.submissionId;
  }

  render() {
    return (
      <ModalView>
        TODO :P
      </ModalView>
    );
  }
}
