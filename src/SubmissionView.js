import React, { Component } from 'react';
import ResultView from './ResultView';
import FileView from './FileView';
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'

class SubmissionView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.submission = props.submission;
    this.onClose = props.onClose;
  }

  componentDidMount() {
    this.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.submission.popObserver(this);
  }

  onChangeSource() {
    this.submission.setSource(this.refs.form.source.files[0]);
  }

  resetSource() {
    this.submission.resetSource();
  }

  onChangeOutput() {
    this.submission.setOutput(this.refs.form.output.files[0]);
  }

  resetOutput() {
    this.submission.resetOutput();
  }

  submit() {
    this.submission.submit();
  }

  close() {
    this.onClose();
  }

  renderSourceStatus(output) {
    if(!output.isUploaded()) return (<div><br/><h5>Processing...</h5></div>);

    return (<div><br/><h5>Okay.</h5></div>)
  }

  renderSourceSelector() {
    if(!this.submission.hasSource()) {
      return (
        <label className="custom-file">
          <input key="absent" name="source" type="file" id="source-file" className="custom-file-input" onChange={() => this.onChangeSource()} />
          <span className="custom-file-control" id="source-file-span"></span>
        </label>
      );
    } else {
      const source = this.submission.getSource();
      return (
        <div key="present" className="card">
          <div className="card-header">
            <h5>Source file info</h5>
          </div>
          <div className="card-block">
            <FileView file={source.file}></FileView>
            <button key="present" type="button" className="btn btn-secondary" role="button" onClick={ () => this.resetSource() }>
              <span aria-hidden="true" className="fa fa-trash"></span> Change source
            </button>
            { this.renderSourceStatus(source) }
          </div>
        </div>
      );
    }
  }

  renderOutputStatus(output) {
    if(!output.isUploaded()) return (<div><br/><h5>Processing...</h5></div>);

    return (<div><br/><ResultView model={this.model} result={output.data.result}></ResultView></div>)
  }

  renderOutputSelector() {
    if(!this.submission.hasOutput()) {
      return (
        <label className="custom-file">
          <input key="absent" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.onChangeOutput()} />
          <span className="custom-file-control" id="output-file-span"></span>
        </label>);
    } else {
      const output = this.submission.getOutput();
      return (
        <div key="present" className="card card-outline-primary">
          <div className="card-header">
            <h5>Output file info</h5>
          </div>
          <div className="card-block">
            <FileView file={output.file}></FileView>
            <button key="present" className="btn btn-secondary" role="button" onClick={ () => this.resetOutput() }>
              <span aria-hidden="true" className="fa fa-trash"></span> Change output
            </button>
            { this.renderOutputStatus(output) }
          </div>
        </div>
      );
    }
  }

  renderDialog() {
    if(!this.submission.isSubmitted()) {
      if(this.submission.isSubmitting()) return <p>Submitting...</p>

      return (
        <form className="submissionForm" ref="form" onSubmit={(e) => { e.preventDefault(); this.submit(); }}>
          <Modal.Body>
              <div className="form-group">{ this.renderSourceSelector() }</div>
              <div className="form-group">{ this.renderOutputSelector() }</div>
          </Modal.Body>
          <Modal.Footer>
            <Button role="button" bsStyle="danger" onClick={ () => this.close() }>
              <span aria-hidden="true" className="fa fa-times"></span> Cancel
            </Button>
            <Button bsStyle="success" type="submit" disabled={!this.submission.canSubmit()}>
              <span aria-hidden="true" className="fa fa-paper-plane"></span> Submit
            </Button>
          </Modal.Footer>
        </form>
      );
    } else {
      return (
        <div>
          <ResultView model={this.model} result={this.submission.data.result}></ResultView>
          <div className="container">
            <button className="btn btn-success top-button" role="button" onClick={ () => this.close() }>
              <span aria-hidden="true" className="fa fa-check"></span> Okay
            </button>
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Submission for input <strong>{ this.submission.input.id }</strong></Modal.Title>
        </Modal.Header>

        { this.renderDialog() }
      </Modal.Dialog>
    );
  }
}

export default SubmissionView;
