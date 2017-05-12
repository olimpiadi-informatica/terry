import React, { Component } from 'react';

class SubmissionView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.submission = props.submission;
  }

  render() {
    return (
      <div>
        <h2>Submission for input <samp>{this.submission.input.id}</samp></h2>
        <p>...</p>
      </div>
    );
  }
}

export default SubmissionView;
