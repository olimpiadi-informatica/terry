import React, { Component } from 'react';
import {translateComponent} from "./utils";
import ResultView from './ResultView'

class ValidationView extends Component {
  render() {
    const ops = {
      renderCase: (c, id) => this.renderCase(c, id),
      renderCaseSummary: (c, id) => this.renderCaseSummary(c, id),
    }
    return <ResultView {...this.props} {...ops}/>
  }

  getColor(c) {
    return c.status === "parsed" ? "info" :
        c.status === "missing" ? "secondary" : "danger";
  }

  renderCaseSummary(c, id) {
    return <a href={"#case-" + id} className={"badge badge-" + this.getColor(c)}>{id}</a>
  }

  renderCase(c, id) {
    const { t } = this.props;
    return (
        <li id={"case-" + id} key={id} className={"list-group-item list-group-item-" + this.getColor(c)}>
          <span>Case #<samp>{id}</samp>: <b>{t("submission.validation."+c.status)}</b><br/><em>{c.message}</em></span>
        </li>
    )
  }
}

export default translateComponent(ValidationView);
