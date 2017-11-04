import React, { Component } from 'react';
import {translateComponent} from "../utils";
import ResultView from './ResultView'

class FeedbackView extends Component {
  render() {
    const ops = {
      renderCase: (c, id) => this.renderCase(c, id),
      renderCaseSummary: (c, id) => this.renderCaseSummary(c, id),
    }
    return <ResultView {...this.props} {...ops}/>
  }

  getColor(c) {
    return c.correct ? "success" : "danger";
  }

  renderCaseSummary(c, id) {
    return <a href={"#case-" + id} className={"badge badge-" + this.getColor(c)}>{id}</a>
  }

  renderCase(c, id) {
    const { t } = this.props;
    return (
        <li id={"case-" + id} key={id} className={"list-group-item list-group-item-" + this.getColor(c)}>
          <span>Case #<samp>{id}</samp>: <b>{c.correct ? t("submission.correct") : t("submission.wrong")}</b><br/><em>{c.message}</em></span>
        </li>
    )
  }
}

export default translateComponent(FeedbackView);
