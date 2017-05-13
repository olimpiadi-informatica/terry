import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import { Link } from 'react-router-dom';

class SubmissionView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.submission = props.submission;
  }

  getTaskState() {
    return this.model.getTaskState(this.taskName);
  }

  componentDidMount() {
    this.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.submission.popObserver(this);
  }

  renderSourceStatus(output) {
    if(!output.isUploaded()) return (<div><br/><h5>Processing...</h5></div>);

    return (<div><br/><h5>Okay.</h5></div>)
  }

  renderSourceSelector() {
    if(!this.submission.hasSource()) {
      return (
        <label className="custom-file">
          <input key="absent" ref="source" name="source" type="file" id="source-file" className="custom-file-input" onChange={(e) => this.submission.setSource(this.refs.source.files[0]) } />
          <span className="custom-file-control" id="source-file-span"></span>
        </label>
      );
    } else {
      const source = this.submission.getSource();
      return (
        <div key="present" className="card card-outline-primary">
          <h5 className="card-header">Source file info</h5>
          <div className="card-block">
            <FileView file={source.file}></FileView>
            <button key="present" type="button" className="btn btn-secondary" role="button" onClick={ () => this.submission.resetSource() }>
              <span aria-hidden="true" className="fa fa-trash"></span> Change source
            </button>
            { this.renderSourceStatus(source) }
          </div>
        </div>
      );
    }
  }

  renderOutputUploadForm() {
    return (
      <label className="custom-file">
        <input key="absent" ref="output" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.submission.setOutput(this.refs.output.files[0])} />
        <span className="custom-file-control" id="output-file-span"></span>
      </label>
    );
  }

  renderOutputValidation(output) {
    if(!output.isUploaded()) return (<div><br/><h5>Processing...</h5></div>);

    return (<div><br/><ResultView model={this.model} result={output.data.validation}></ResultView></div>)
  }

  renderOutputInfo() {
    const output = this.submission.getOutput();

    return (
      <div key="present" className="card card-outline-primary">
        <h5 className="card-header">Output file info</h5>
        <div className="card-block">
          <FileView file={output.file}></FileView>
          <button key="present" className="btn btn-secondary" role="button" onClick={ () => this.submission.resetOutput() }>
            <span aria-hidden="true" className="fa fa-trash"></span> Change output
          </button>
          { this.renderOutputValidation(output) }
        </div>
      </div>
    );
  }

  renderOutputSelector() {
    if(!this.submission.hasOutput()) {
      return this.renderOutputUploadForm();
    } else {
      return this.renderOutputInfo();
    }
  }

  renderSubmissionForm() {
    if(this.submission.isSubmitting()) return <p>Submitting...</p>

    return (
      <form className="submissionForm" ref="form" onSubmit={(e) => { e.preventDefault(); this.submission.submit(); }}>
        <Modal.Body>
            <div className="form-group">{ this.renderSourceSelector() }</div>
            <div className="form-group">{ this.renderOutputSelector() }</div>
        </Modal.Body>
        <Modal.Footer>
          <Link to={"/" + this.submission.input.task} role="button" className="btn btn-danger">
            <span aria-hidden="true" className="fa fa-times"></span> Cancel
          </Link>
          <Button role="button" bsStyle="success" type="submit" disabled={!this.submission.canSubmit()}>
            <span aria-hidden="true" className="fa fa-paper-plane"></span> Submit
          </Button>
        </Modal.Footer>
      </form>
    );
  }

  renderSubmissionFeedback() {
    return (
      <div>
        <ResultView model={this.model} result={this.submission.data.feedback}></ResultView>
        <div className="container">
          <Link to={"/" + this.submission.input.task} role="button" className="btn btn-success">
            <span aria-hidden="true" className="fa fa-check"></span> Okay
          </Link>
        </div>
      </div>
    );
  }

  renderDialog() {
    if(this.submission.isSubmitted()) {
      return this.renderSubmissionFeedback();
    } else {
      return this.renderSubmissionForm();
    }
  }

  render() {
    return (
      <Modal.Dialog bsSize="large">
        <Modal.Header>
          <Modal.Title>Submission for input <strong>{ this.submission.input.id }</strong></Modal.Title>
        </Modal.Header>

        { this.renderDialog() }
      </Modal.Dialog>
    );
  }
}

export default SubmissionView;
