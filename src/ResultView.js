import React, { Component } from 'react';

class ResultView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.result = props.result;
  }

  renderWarning(warning) {
    return (
      <p><samp>{warning.code}</samp> {warning.severity}: {warning.message}</p>
    )
  }

  renderCase(testCase) {
    return (
      <p>Case <samp>{testCase.id}</samp> <samp>{testCase.status}</samp> {testCase.message}</p>
    )
  }

  render() {
    return (
      <div>
        <ul>{
            this.result.warnings.map((w, i) => <li key={i}>{ this.renderWarning(w) }</li>)
        }</ul>
        <ul>{
            this.result.cases.map((c, i) => <li key={i}>{ this.renderCase(c) }</li>)
        }</ul>
      </div>
    );
  }
}

export default ResultView;
