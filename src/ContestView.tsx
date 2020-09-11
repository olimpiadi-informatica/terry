import * as React from 'react';
import { Link, Route, RouteComponentProps } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import ReactMarkdown from 'react-markdown';
import { Trans, WithTranslation } from 'react-i18next';
import TaskView from './TaskView';
import SidebarView from './SidebarView';
import { Model } from './user.models';
import client from './TerryClient';
import LoginView from './LoginView';

type Props = {
  userState: any
  model: Model
} & WithTranslation & RouteComponentProps<any>

const DETECT_INTERNET_TEST_ENDPOINT = process.env.REACT_APP_DETECT_INTERNET_TEST_ENDPOINT || null;
const DETECT_INTERNET_TEST_CONTENT = process.env.REACT_APP_DETECT_INTERNET_TEST_CONTENT || null;

export default class ContestView extends React.Component<Props> {
  private detectInternetInterval: NodeJS.Timer | null = null;

  async detectInternet(endpoint: string) {
    console.log(`Testing internet connection (${DETECT_INTERNET_TEST_ENDPOINT})...`);
    try {
      const res = await fetch(endpoint, {
        mode: "no-cors",
      });
      const content = await res.text();
      if (content !== DETECT_INTERNET_TEST_CONTENT) {
        console.log(`Invalid content ${content}`);
      }
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

  getBody() {
    const { t } = this.props;

    return (
      <React.Fragment>
        <SidebarView {...this.props} />
        <main>
          <Route exact path={'/useful-info'} render={() =>
            <React.Fragment>
              <h1>Informazioni utili</h1>
              <hr />
              <p>Scegli la guida che vuoi consultare:</p>
              <ul>
                <li>
                  <a target="_blank" href="/extra_files/tutorials/codeblocks/">
                    Come usare Codeblocks per programmare in C/C++
                  </a>
                </li>
                <li>
                  <a target="_blank" href="/extra_files/tutorials/lazarus/">
                    Come usare Lazarus per programmare in Pascal
                  </a>
                </li>
                <li>
                  <a target="_blank" href="/extra_files/tutorials/faq/">
                    Risposte ad alcune domande frequenti
                  </a>
                </li>
              </ul>
            </React.Fragment>
          } />
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
          {this.props.userState && this.props.userState.data.contest.has_started && <Route path={'/task/:taskName'} render={({ match }) =>
            <TaskView {...this.props} key={match.params.taskName} taskName={match.params.taskName} />
          } />}
          <Route exact path={'/'} render={() =>
            <React.Fragment>
              {this.props.userState ? <h1>{this.props.userState.data.contest.name}</h1> : null}
              <ReactMarkdown source={this.props.userState && this.props.userState.data.contest.description} />
              {this.props.userState ? <hr /> : null}
              {this.props.userState && this.props.userState.data.contest.has_started ? <React.Fragment>
                <h2>{t("homepage.guide.title")}</h2>
                <p>{t("homepage.guide.part1")}</p>
                <Trans i18nKey="homepage.guide.part2">
                  You can submit <em>as many times as you want</em>, but you will have a different input every time. When you make a submission remember to send the correct source file and the output corresponding to the last generated input. When you have uploaded your files <em>remember to submit</em> them by clicking the green button!
                </Trans>
                <p>{t("homepage.guide.part3")}</p>
              </React.Fragment> : (this.props.userState ? <React.Fragment>
                <div className="jumbotron">
                  <h1 className="text-center display-1" ><FontAwesomeIcon icon={faClock} /></h1>
                  <p className={"text-center"}>{t("login.not started")}</p>
                </div>
              </React.Fragment> : <LoginView {...this.props} model={this.props.model}/>)}
            </React.Fragment>
          } />
        </main>
      </React.Fragment>
    )
  }

  render() {
    const { t } = this.props;

    return <React.Fragment>
      <nav className="terry-navbar">
        <Link to="/" className="navbar-brand">{this.props.userState ? this.props.userState.data.contest.name : "Home"}</Link>
        <span className="terry-user-name">{this.props.userState && this.props.userState.data.name} {this.props.userState && this.props.userState.data.surname}</span>
        {this.props.userState && <button className="terry-logout-button btn btn-sm btn-light" onClick={(e) => { e.preventDefault(); this.props.model.logout() }}>
          <FontAwesomeIcon icon={faSignOutAlt} /> {t("navbar.logout")}
        </button>}
      </nav>

      <div className="terry-body">
        {this.getBody()}
      </div>
    </React.Fragment>;
  }
}
