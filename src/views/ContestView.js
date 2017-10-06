import React, { Component } from 'react';
import {Link, Route} from 'react-router-dom';
import TaskView from './TaskView';
import Countdown from './CountdownView';
import TaskNavbarItem from './NavbarItemView';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';
import { Collapse, Navbar, NavbarToggler } from 'reactstrap';
import { Trans } from 'react-i18next';
import {formatTimeSpan, translateComponent} from "../utils";

class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true
    };
  }

  componentWillMount() {
    this.model.enterContest();
  }

  getSideBar() {
    const { t } = this.props;
    return (
      <nav className="col-sm-3 col-md-2 col-xs-12 bg-faded sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>{t("navbar.task list")}</h3>
          </li>

          <li className="divider-vertical" />

          { this.model.getContest().data.tasks.map((task,i) => <TaskNavbarItem key={i} taskName={task.name} model={this.model} />)}
        </ul>
      </nav>
    );
  }

  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  getNavBar() {
    const { t } = this.props;
    const user = this.model.user;
    return <Navbar color="primary" inverse toggleable>
      <NavbarToggler onClick={this.toggleNavbar} right/>
      <Link to="/" className="navbar-brand">{this.model.contest.data.name}</Link>
      <Collapse navbar className="navbar-toggleable-sm" isOpen={!this.state.collapsed}>
        <ul className="navbar-nav mr-auto">
          <li className="nav-item active">
           <Link to="/" className="nav-link">
             <span aria-hidden="true" className="fa fa-home" /> {t("navbar.home")}
           </Link>
          </li>
        </ul>
        <ul className="nav navbar-nav navbar-right">
          <li className="nav-item">
            <span className="nav-link">{user.name} {user.surname}</span>
          </li>
          <li>
            <span className="nav-link"><Countdown remaining={user.remaining_time}/></span>
          </li>
          <li className="nav-item">
            <a className="btn btn-danger" href="#" role="button" onClick={(e) => { e.preventDefault(); this.model.logout()}}>
              <span aria-hidden="true" className="fa fa-sign-out" /> {t("navbar.logout")}
            </a>
          </li>
        </ul>
      </Collapse>
    </Navbar>
  }

  render_index() {
    const { t } = this.props;
    // start and end are rounded to minutes
    const start = moment(this.model.contest.data.start_time).seconds(0);
    const end = moment().add(this.model.user.remaining_time, 'seconds').seconds(0);
    const seconds = end.unix() - start.unix();
    const length = formatTimeSpan(seconds, t);

    return <div>
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
    </div>
  }

  render() {
    return (
      <div>
        { this.getNavBar() }

        <div className="container-fluid">
          <div className="row">
            { this.getSideBar() }

            <main className="col-sm-9 col-md-10">
              <Route path={'/:taskName'} render={ ({match}) =>
                  <TaskView key={match.params.taskName} model={this.model} taskName={match.params.taskName} />
              }/>
              <Route exact path={'/'} render={({match}) => this.render_index()}/>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default translateComponent(ContestView);