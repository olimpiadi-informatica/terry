import React, { Component } from 'react';
import {Link, Route} from 'react-router-dom';
import TaskView from './TaskView';
import Countdown from './CountdownView';
import NavbarItemView from './NavbarItemView';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';
import { Trans } from 'react-i18next';
import {formatTimeSpan, translateComponent} from "../utils";
import TotalScoreView from './TotalScoreView'

class SidebarView extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }

  render() {
    const { t } = this.props;
    return (
      <nav className="bg-faded sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>{t("navbar.total score")}</h3>
            <TotalScoreView model={this.model} />
          </li>
          <li className="divider-vertical" />

          <li className="nav-item title">
            {t("navbar.remaining time")} <Countdown remaining={this.model.user.remaining_time}/>
          </li>

          <li className="nav-item title">
            <h3>{t("navbar.task list")}</h3>
          </li>
          <li className="divider-vertical" />

          { this.model.getContest().data.tasks.map((task,i) => <NavbarItemView key={i} taskName={task.name} model={this.model} />)}
        </ul>
      </nav>
    );
  }
}

SidebarView = translateComponent(SidebarView);

class NavbarView extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }

  render() {
    const { t } = this.props;
    const user = this.model.user;
    return <nav className="terry-navbar">
      <Link to="/" className="navbar-brand">{this.model.contest.data.name}</Link>
      <span className="terry-user-name">{user.name} {user.surname}</span>
      <button className="terry-logout-button btn btn-sm btn-secondary" onClick={(e) => { e.preventDefault(); this.model.logout()}}>
        <span aria-hidden="true" className="fa fa-sign-out" /> {t("navbar.logout")}
      </button>
    </nav>
  }
}

NavbarView = translateComponent(NavbarView);

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
    // start and end are rounded to minutes
    const start = moment(this.model.contest.data.start_time).seconds(0);
    const end = moment().add(this.model.user.remaining_time, 'seconds').seconds(0);
    const seconds = end.unix() - start.unix();
    const length = formatTimeSpan(seconds, t);

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
      <p>{t("homepage.guide.part4", {length: length})}</p>
    </React.Fragment>
  }

  render() {
    return <React.Fragment>
      <NavbarView model={this.model} />

      <div className="terry-body">
        <SidebarView model={this.model} />

        <main>
          <Route path={'/:taskName'} render={ ({match}) =>
              <TaskView key={match.params.taskName} model={this.model} taskName={match.params.taskName} />
          }/>
          <Route exact path={'/'} render={({match}) => this.render_index()}/>
        </main>
      </div>
    </React.Fragment>;
  }
}

export default translateComponent(ContestView);
