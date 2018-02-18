import React, { Component } from 'react';
import {translateComponent} from './utils';

class ResultView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.result = props.result;

    this.renderCase = props.renderCase;
    this.renderCaseSummary = props.renderCaseSummary;
  }

  renderAlert(a) {
    return (
      <div className={ "alert alert-" + a.severity } role="alert">
        <samp>{a.code}</samp> <strong>{a.severity.toUpperCase()}</strong>: {a.message}
      </div>
    )
  }

  render() {
    return (
      <React.Fragment>
        <ul className="list-unstyled">
          { this.result.alerts.map((a, i) => <li key={i}>{ this.renderAlert(a) }</li>) }
        </ul>
        <dl className="terry-file-view">
          <dt>Dettagli:</dt>
          <dd>
            <ul className="list-inline mb-0">
              { this.result.cases.map((c, i) => <li className="list-inline-item" key={i}>{ this.renderCaseSummary(c, i+1) }</li>) }
            </ul>
          </dd>
        </dl>
        <div className="result-detail">
          <ul className="list-group">
            { this.result.cases.map((c, i) => this.renderCase(c, i+1)) }
          </ul>
        </div>
      </React.Fragment>
    );
  }
}

export default translateComponent(ResultView);
