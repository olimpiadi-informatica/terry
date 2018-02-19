import React, { Component } from 'react';
import {translateComponent} from './utils';

class ResultView extends Component {
  render() {
    return (
      <React.Fragment>
        <ul className="list-unstyled">
          { this.props.result.alerts.map((a, i) => <li key={i}>
          <div className={ "alert alert-" + a.severity } role="alert">
            <samp>{a.code}</samp> <strong>{a.severity.toUpperCase()}</strong>: {a.message}
          </div>
          </li>) }
        </ul>
        <dl className="terry-file-view">
          <dt>Dettagli:</dt>
          <dd>
            <ul className="list-inline mb-0">
              { this.props.result.cases.map((c, i) => <li className="list-inline-item" key={i}>{ this.props.renderCaseSummary(c, i+1) }</li>) }
            </ul>
          </dd>
        </dl>
        <div className="result-detail">
          <ul className="list-group">
            { this.props.result.cases.map((c, i) => this.props.renderCase(c, i+1)) }
          </ul>
        </div>
      </React.Fragment>
    );
  }
}

export default translateComponent(ResultView);
