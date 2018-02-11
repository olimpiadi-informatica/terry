import React, { Component } from 'react';
import {Link, Route} from 'react-router-dom';
import TaskView from './TaskView';
import ReactMarkdown from 'react-markdown';
import { DateTime, Duration } from 'luxon';
import { Trans } from 'react-i18next';
import {formatTimeSpan, translateComponent} from "../utils";
import SidebarView from './SidebarView';
import IndexView from './IndexView';

class ContestView extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }

  componentWillMount() {
    this.model.enterContest();
  }

  render_index() {
    const { t } = this.props;

    return <React.Fragment>
      <h1>{this.model.contest.data.name}</h1>
      <ReactMarkdown source={this.model.contest.data.description}/>
      <hr />
      <h2>{t("homepage.guide.title")}</h2>
      <p>{t("homepage.guide.part1")}</p>
      <Trans i18nKey="homepage.guide.part2">
        You can submit <em>as many times as you want</em>, but you will have a different input every time. When you make a submission remember to send the correct source file and the output corresponding to the last generated input. When you have uploaded your files <em>remember to submit</em> them by clicking the green button!
      </Trans>
      <p>{t("homepage.guide.part3")}</p>
      <p>{t("homepage.guide.part4", {length: "TODO: contest duration"})}</p>
    </React.Fragment>
  }

  render() {
    const { t } = this.props;
    return <React.Fragment>
      <nav className="terry-navbar">
        <Link to="/" className="navbar-brand">{this.model.contest.data.name}</Link>
        <span className="terry-user-name">{this.model.user.name} {this.model.user.surname}</span>
        <span role="button" className="terry-logout-button btn btn-sm btn-secondary" onClick={(e) => { e.preventDefault(); this.model.logout()}}>
          <span aria-hidden="true" className="fa fa-sign-out" /> {t("navbar.logout")}
        </span>
      </nav>

      <div className="terry-body">
        <SidebarView model={this.model} />

        <main>
          <Route path={'/:taskName'} render={ ({match}) =>
            <TaskView key={match.params.taskName} model={this.model} taskName={match.params.taskName} />
          }/>
          <Route exact path={'/'} render={ ({match}) =>
            <IndexView model={this.model}/>
          }/>
        </main>
      </div>
    </React.Fragment>;
  }
}

export default translateComponent(ContestView);
