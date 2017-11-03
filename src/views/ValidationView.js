import React, { Component } from 'react';
import {translateComponent} from "../utils";
import ResultView from './ResultView'

class ValidationView extends Component {
  render() {
    return <ResultView {...this.props} renderCase={(c, id) => this.renderCase(c, id)}/>
  }

  renderCase(c, id) {
    const { t } = this.props;
    const color = c.status === "parsed" ? "warning" :
        c.status === "missing" ? "danger" : "dark";
    return (
        <li key={id} className={"list-group-item list-group-item-"+color}>
          <span>Case #<samp>{id}</samp>: <b>{t("submission.validation."+c.status)}</b><br/><em>{c.message}</em></span>
        </li>
    )
  }
}

export default translateComponent(ValidationView);
