import React, { Component } from 'react';
import {Link, Route} from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt'
import TaskView from './TaskView';
import ReactMarkdown from 'react-markdown';
import { DateTime, Duration } from 'luxon';
import { Trans } from 'react-i18next';
import { translateComponent } from "./utils";
import SidebarView from './SidebarView';
import IndexView from './IndexView';

class ContestView extends Component {
  render_index() {
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

  render() {
    const { t } = this.props;
    return <React.Fragment>
      <nav className="terry-navbar">
        <Link to="/" className="navbar-brand">{this.props.userState.data.contest.name}</Link>
        <span className="terry-user-name">{this.props.userState.data.name} {this.props.userState.data.surname}</span>
        <button role="button" className="terry-logout-button btn btn-sm btn-light" onClick={(e) => { e.preventDefault(); this.props.model.logout()}}>
          <FontAwesomeIcon icon={faSignOutAlt}/> {t("navbar.logout")}
        </button>
      </nav>

      <div className="terry-body">
        <SidebarView {...this.props} />

        <main>
          <Route path={'/:taskName'} render={ ({match}) =>
            <TaskView key={match.params.taskName} {...this.props} taskName={match.params.taskName} />
          }/>
          <Route exact path={'/'} render={ ({match}) =>
            <IndexView {...this.props}/>
          }/>
        </main>
      </div>
    </React.Fragment>;
  }
}

export default translateComponent(ContestView);
