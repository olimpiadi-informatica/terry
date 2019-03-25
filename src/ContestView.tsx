import * as React from 'react';
import { Link, Route, RouteComponentProps } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faCheck } from '@fortawesome/fontawesome-free-solid';
import * as ReactMarkdown from 'react-markdown';
import { Trans, InjectedTranslateProps, InjectedI18nProps } from 'react-i18next';
import TaskView from './TaskView';
import SidebarView from './SidebarView';
import { Model } from './user.models';
import client from './TerryClient';

type Props = {
  userState: any
  model: Model
} & InjectedTranslateProps & InjectedI18nProps & RouteComponentProps<any>

const DETECT_INTERNET_TEST_ENDPOINT = process.env.REACT_APP_DETECT_INTERNET_TEST_ENDPOINT || null;

export default class ContestView extends React.Component<Props> {
  private detectInternetInterval: NodeJS.Timer | null = null;

  async detectInternet(endpoint: string) {
    console.log(`Testing internet connection (${DETECT_INTERNET_TEST_ENDPOINT})...`);
    try {
      await fetch(endpoint, {
        mode: "no-cors",
      });
    } catch(e) {
      console.log(`No internet connection (${e})`);
      return;
    }
    console.log(`Internet connection detected. Reporting.`);

    const data = new FormData();

    data.append("token", this.props.model.userToken());

    await client.api.post("/internet_detected", data)
  }

  componentDidMount() {
    if(DETECT_INTERNET_TEST_ENDPOINT !== null) {
      this.detectInternet(DETECT_INTERNET_TEST_ENDPOINT);
      this.detectInternetInterval = setInterval(() => this.detectInternet(DETECT_INTERNET_TEST_ENDPOINT), 10 * 60 * 1000)
    }
  }

  componentWillUnmount() {
    if(this.detectInternetInterval !== null) {
      clearInterval(this.detectInternetInterval);
      this.detectInternetInterval = null;
    }
  }

  render() {
    const { t } = this.props;
    return <React.Fragment>
      <nav className="terry-navbar">
        <Link to="/" className="navbar-brand">{this.props.userState.data.contest.name}</Link>
        <span className="terry-user-name">{this.props.userState.data.name} {this.props.userState.data.surname}</span>
        <button className="terry-logout-button btn btn-sm btn-light" onClick={(e) => { e.preventDefault(); this.props.model.logout() }}>
          <FontAwesomeIcon icon={faSignOutAlt} /> {t("navbar.logout")}
        </button>
      </nav>

      <div className="terry-body">
        {
          this.props.userState.data.contest.has_started ? <React.Fragment>
            <SidebarView {...this.props} />
            <main>
              {/* <Route exact path={'/useful-info'} render={() =>
                <React.Fragment>
                  <h1>Informazioni utili</h1>
                  <hr />
                  <ReactMarkdown source={'/extra_files/useful-info.md'} />
                </React.Fragment>
              } /> */}
              <Route exact path={'/documentation'} render={() =>
                <React.Fragment>
                  <h1>Documentazione</h1>
                  <hr />
                  <p>Scegli la documentazione che vuoi consultare:</p>
                  <ul>
                    <li><a target="_blank" href="/extra_files/documentation/cpp/en/index.html">Documentazione C/C++</a></li>
                    <li><a target="_blank" href="/extra_files/documentation/pas/fpctoc.html">Documentazione Pascal</a></li>
                  </ul>
                </React.Fragment>
              } />
              <Route path={'/task/:taskName'} render={({ match }) =>
                <TaskView {...this.props} key={match.params.taskName} taskName={match.params.taskName} />
              } />
              <Route exact path={'/'} render={() =>
                <React.Fragment>
                  <h1>{this.props.userState.data.contest.name}</h1>
                  <ReactMarkdown source={this.props.userState.data.contest.description} />
                  <hr />
                  <h2>{t("homepage.guide.title")}</h2>
                  <p>{t("homepage.guide.part1")}</p>
                  <Trans i18nKey="homepage.guide.part2">
                    You can submit <em>as many times as you want</em>, but you will have a different input every time. When you make a submission remember to send the correct source file and the output corresponding to the last generated input. When you have uploaded your files <em>remember to submit</em> them by clicking the green button!
                  </Trans>
                  <p>{t("homepage.guide.part3")}</p>
                </React.Fragment>
              } />
            </main>
          </React.Fragment> : <div className="jumbotron">
              <h1 className="text-center display-1 text-success" ><FontAwesomeIcon icon={faCheck} /></h1>
              <p className={"text-center"}>{t("login.not started")}</p>
            </div>
        }

      </div>
    </React.Fragment>;
  }
}
