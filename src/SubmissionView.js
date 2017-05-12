import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';

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

  resetSource() {
    this.submission.resetSource();
    this.forceUpdate();
  }

  onChangeOutput() {
    this.submission.setOutput(this.refs.form.output.files[0]);
  }

  resetOutput() {
    this.submission.resetOutput();
    this.forceUpdate();
  }

  submit() {
    this.submission.submit();
  }

  close() {
    this.onClose();
  }

  renderSourceSelector() {
    if(!this.submission.hasSource()) {
      return (<label className="custom-file">
          <input key="absent" name="source" type="file" id="source-file" className="custom-file-input" onChange={() => this.onChangeSource()} />
          <span className="custom-file-control" id="source-file-span"></span>
        </label>);
    } else {
      const source = this.submission.getSource();
      return (
        <div key="present" className="bs-callout bs-callout-info">
          <h4 className="bs-callout-info-title">Source file info</h4>
          <FileView file={source.file}></FileView>
          <input key="present" type="button" className="btn btn-secondary" value="Change source" onClick={() => { this.resetSource(); return false; }}></input>
        </div>
      )
    }
  }

  renderOutputStatus(output) {
    if(!output.isCreated()) return <p>Creating...</p>;
    if(!output.isUploaded()) return <p>Uploading...</p>;
    if(!output.isValidated()) return <p>Validating...</p>;

    return <ResultView model={this.model} result={output.metadata.validation_result}></ResultView>;
  }

  renderOutputSelector() {
    if(!this.submission.hasOutput()) {
      return (<label className="custom-file">
          <input key="absent" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.onChangeOutput()} />
          <span className="custom-file-control" id="output-file-span"></span>
        </label>);
    } else {
      const output = this.submission.getOutput();
      return (
        <div key="present">
          <FileView file={output.file}></FileView>
          <input type="button" value="Change output" onClick={() => { this.resetOutput(); return false; }}></input>
          { this.renderOutputStatus(output) }
        </div>
      )
    }
  }

  renderDialog() {
    if(!this.submission.isSubmitted()) {
      return (
        <form className="submissionForm" ref="form" onSubmit={(e) => {e.preventDefault(); this.submit();}}>

          <div className="form-group">{ this.renderSourceSelector() }</div>
          <div className="form-group">{ this.renderOutputSelector() }</div>
          <div className="form-group">

            <input type="submit" className="btn btn-success top-button" role="button" value="Submit" disabled={!this.submission.canSubmit()}></input>
            <input type="reset" className="btn btn-danger top-button" role="button" onClick={() => {this.close(); return false;}} value="Cancel"></input>
          </div>
        </form>
      );
    } else {
      return <div>
        <ResultView model={this.model} result={this.submission.submission.result}></ResultView>
        <button onClick={() => this.close()}>Okay.</button>
      </div>
    }
  }

  render() {
    return (
      <div className="submissionView">
        <h2>Submission for input <samp>{this.submission.input.id}</samp></h2>
        { this.renderDialog() }
      </div>
    );
  }
}

export default SubmissionView;
