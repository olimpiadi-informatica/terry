import React, { Component } from 'react';
import {translateComponent} from "../utils";

class ResultView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.result = props.result;
    this.validation = props.validation;
    this.feedback = props.feedback;
    if (!this.validation && !this.feedback)
      throw new Error("You need to specify if this is a validation or a feedback!");
  }

  renderAlert(a) {
    return (
      <div className={ "alert alert-" + a.severity } role="alert">
        <samp>{a.code}</samp> {a.severity}: {a.message}
      </div>
    )
  }

  renderValidationCase(c, id) {
    const color = c.status === "parsed" ? "warning" :
        c.status === "missing" ? "danger" : "dark";
    return (
        <li key={id} className={"list-group-item list-group-item-"+color}>
          <span>Case #<samp>{id}</samp>: <b>{c.status}</b><br/><em>{c.message}</em></span>
        </li>
    )
  }

  renderFeedbackCase(c, id) {
    const { t } = this.props;
    const color = c.correct ? "success" : "danger";
    return (
        <li key={id} className={"list-group-item list-group-item-"+color}>
          <span>Case #<samp>{id}</samp>: <b>{c.correct ? t("submission.correct") : t("submission.wrong")}</b><br/><em>{c.message}</em></span>
        </li>
    )
  }

  render() {
    return (
      <div>
        <ul className="list-unstyled">{
            this.result.alerts.map((a, i) => <li key={i}>{ this.renderAlert(a) }</li>)
        }</ul>
        <ul className="list-group">{
            this.result.cases.map((c, i) => this.validation ? this.renderValidationCase(c, i+1) : this.renderFeedbackCase(c, i+1))
        }</ul>
      </div>
    );
  }
}

export default translateComponent(ResultView);