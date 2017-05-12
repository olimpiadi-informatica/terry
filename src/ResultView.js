import React, { Component } from 'react';

class ResultView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.result = props.result;
  }

  renderWarning(warning) {
    return (
      <div className={ "alert alert-"+warning.severity } role="alert">
        <samp>{warning.code}</samp> {warning.severity}: {warning.message}
      </div>
    )
  }

  renderCase(testCase) {
    return (
      <p>Case <samp>{testCase.id}</samp> <b>{testCase.status}</b> {testCase.message}</p>
    )
  }

  render() {
    return (
      <div>
        <ul className="list-unstyled">{
            this.result.warnings.map((w, i) => <li key={i}>{ this.renderWarning(w) }</li>)
        }</ul>
        <ul className="list-group">{
            this.result.cases.map((c, i) => <li key={i} className="list-group-item">{ this.renderCase(c) }</li>)
        }</ul>
      </div>
    );
  }
}

export default ResultView;
