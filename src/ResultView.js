import React, { Component } from 'react';

export default class ResultView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.result = props.result;
  }

  renderAlert(a) {
    return (
      <div className={ "alert alert-" + a.severity } role="alert">
        <samp>{a.code}</samp> {a.severity}: {a.message}
      </div>
    )
  }

  renderCase(c) {
    return (
      <span>Case <samp>{c.id}</samp> <b>{c.status}</b> {c.message}</span>
    )
  }

  render() {
    return (
      <div>
        <ul className="list-unstyled">{
            this.result.alerts.map((a, i) => <li key={i}>{ this.renderAlert(a) }</li>)
        }</ul>
        <ul className="list-group">{
            this.result.cases.map((c, i) => <li key={i} className="list-group-item">{ this.renderCase(c) }</li>)
        }</ul>
      </div>
    );
  }
}
