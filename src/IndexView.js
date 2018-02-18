import React, { Component } from 'react';
import {Link, Route} from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Trans } from 'react-i18next';
import {translateComponent} from "./utils";

class IndexView extends Component {
  render() {
    const { t } = this.props;
    return <React.Fragment>
      <h1>{this.props.userState.data.contest.name}</h1>
      <ReactMarkdown source={this.props.userState.data.contest.description}/>
      <hr />
      <h2>{t("homepage.guide.title")}</h2>
      <p>{t("homepage.guide.part1")}</p>
      <Trans i18nKey="homepage.guide.part2">
        You can submit <em>as many times as you want</em>, but you will have a different input every time. When you make a submission remember to send the correct source file and the output corresponding to the last generated input. When you have uploaded your files <em>remember to submit</em> them by clicking the green button!
      </Trans>
      <p>{t("homepage.guide.part3")}</p>
    </React.Fragment>
  }
}

export default translateComponent(IndexView);
