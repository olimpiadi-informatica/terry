import React, { Component } from 'react';

class SubmissionView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.submission = props.submission;
    this.onClose = props.onClose;
  }

  onChangeSource() {
    this.submission.setSource(this.refs.form.source.files[0]);
  }

  onChangeOutput() {
    this.submission.setOutput(this.refs.form.output.files[0]);
  }

  submit() {
    this.submission.submit();
  }

  close() {
    this.onClose();
  }

  renderDialog() {
    if(!this.submission.isSubmitted()) {
      return (
        <form ref="form" onSubmit={(e) => {e.preventDefault(); this.submit();}}>
          <input type="file" name="source" onChange={() => this.onChangeSource()}></input>
          <input type="file" name="output" onChange={() => this.onChangeOutput()}></input>
          <input type="submit" value="Submit"></input>
        </form>
      );
    } else {
      return <button onClick={() => this.close()}>Okay.</button>
    }
  }

  render() {
    return (
      <div>
        <h2>Submission for input <samp>{this.submission.input.id}</samp></h2>
        { this.renderDialog() }
      </div>
    );
  }
}

export default SubmissionView;
