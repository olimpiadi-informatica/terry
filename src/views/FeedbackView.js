import React, { Component } from 'react';
import {translateComponent} from "../utils";
import ResultView from './ResultView'

class FeedbackView extends Component {
  render() {
    return <ResultView {...this.props} renderCase={(c, id) => this.renderCase(c, id)}/>
  }

  renderCase(c, id) {
    const { t } = this.props;
    const color = c.correct ? "success" : "danger";
    return (
        <li key={id} className={"list-group-item list-group-item-"+color}>
          <span>Case #<samp>{id}</samp>: <b>{c.correct ? t("submission.correct") : t("submission.wrong")}</b><br/><em>{c.message}</em></span>
        </li>
    )
  }
}

export default translateComponent(FeedbackView);
