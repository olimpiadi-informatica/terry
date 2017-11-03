import React, { Component } from 'react';
import {translateComponent} from "../utils";

class ResultView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.result = props.result;

    console.log(props);
    this.renderCase = props.renderCase;
  }

  renderAlert(a) {
    return (
      <div className={ "alert alert-" + a.severity } role="alert">
        <samp>{a.code}</samp> {a.severity}: {a.message}
      </div>
    )
  }

  render() {
    return (
      <div>
        <ul className="list-unstyled">{
            this.result.alerts.map((a, i) => <li key={i}>{ this.renderAlert(a) }</li>)
        }</ul>
        <ul className="list-group">{
            this.result.cases.map((c, i) => this.renderCase(c, i+1))
        }</ul>
      </div>
    );
  }
}

export default translateComponent(ResultView);
