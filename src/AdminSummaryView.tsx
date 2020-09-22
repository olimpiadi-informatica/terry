import * as React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faDownload } from "@fortawesome/free-solid-svg-icons";
import { CountdownView } from "./datetime.views";
import { DateTime } from "luxon";
import { DateView } from "./datetime.views";
import client from "./TerryClient";
import PromiseView from "./PromiseView";
import { notifyError } from "./utils";
import { toast } from "react-toastify";
import { AdminSession } from "./admin.models";
import ObservablePromise from "./ObservablePromise";
import { Trans, t, Plural } from "@lingui/macro";
import { i18n } from "./i18n";

type User = {
  extra_time: number;
};

type Props = {
  session: AdminSession;
  users: { data: { items: User[] } };
  status: {
    data: { start_time: string; end_time: string };
    extraTimeMinutes: () => number;
  };
  pack: { data: { deletable: boolean } };
};

export default class AdminSummaryView extends React.Component<Props> {
  timer?: NodeJS.Timer;
  logsPromise?: ObservablePromise;

  componentWillMount() {
    this.logsPromise = this.props.session.loadLogs({
      start_date: "2000-01-01T00:00:00.000",
      end_date: "2030-01-01T00:00:00.000",
      level: "WARNING",
    });
  }

  componentDidMount() {
    this.props.session.pushObserver(this);

    const tickrate = 1000;
    this.timer = setInterval(() => this.forceUpdate(), tickrate);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }

    this.props.session.popObserver(this);
  }

  serverTime() {
    return DateTime.local().minus(this.props.session.timeDelta);
  }

  renderNotStarted() {
    return (
      <React.Fragment>
        <p>
          <Trans>The contest has not started yet!</Trans>
        </p>
        <form
          ref="form"
          onSubmit={(e) => {
            e.preventDefault();
            this.props.session.startContest().then(() => {
              toast.success(i18n._(t`Contest was successfully started`));
            });
          }}
        >
          <button type="submit" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlay} /> {i18n._(t`Start`)}
          </button>
        </form>
      </React.Fragment>
    );
  }

  renderRunning() {
    return (
      <ul className="mb-0">
        <li>{this.renderStartTime()}</li>
        <li>{this.renderCountdown()}</li>
      </ul>
    );
  }

  renderRunningExtraTime() {
    return (
      <ul className="mb-0">
        <li>{this.renderStartTime()}</li>
        <li>{this.renderEndTime()}</li>
        <li>{this.renderExtraTimeCountdown()}</li>
      </ul>
    );
  }

  renderFinished() {
    return (
      <React.Fragment>
        <ul>
          <li>{this.renderStartTime()}</li>
          <li>{this.renderEndTime()}</li>
          {this.renderExtraTimeEndTime()}
        </ul>

        <Link to={"/admin/download_results"} className="btn btn-primary">
          <FontAwesomeIcon icon={faDownload} /> <Trans>Download contest results</Trans>
        </Link>
      </React.Fragment>
    );
  }

  countUsersWithExtraTime() {
    return this.props.users.data.items.filter((user) => user.extra_time !== 0).length;
  }

  getStartTime() {
    return DateTime.fromISO(this.props.status.data.start_time);
  }

  getEndTime() {
    return DateTime.fromISO(this.props.status.data.end_time);
  }

  getUsersExtraTime() {
    return Math.max.apply(
      null,
      this.props.users.data.items.map((user) => user.extra_time)
    );
  }

  getExtraTimeEndTime() {
    return this.getEndTime().plus({ seconds: this.getUsersExtraTime() });
  }

  isDeletable() {
    return this.props.pack.data.deletable;
  }

  renderStartTime() {
    return (
      <React.Fragment>
        <Trans>Contest started at</Trans>{" "}
        {this.getStartTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
      </React.Fragment>
    );
  }

  renderCountdownExtra() {
    if (this.countUsersWithExtraTime() === 0) return;

    return (
      <React.Fragment>
        {" "}
        (
        <span>
          <Plural
            value={this.getUsersExtraTime() / 60}
            one="plus # extra minute for some user"
            other="plus # extra minutes for some user"
          />
        </span>
        )
      </React.Fragment>
    );
  }

  renderCountdown() {
    return (
      <React.Fragment>
        <Trans>Remaining time</Trans>{" "}
        <CountdownView clock={() => this.props.session.serverTime()} end={this.getEndTime()} />
        {this.renderCountdownExtra()}
      </React.Fragment>
    );
  }

  renderEndTime() {
    return (
      <React.Fragment>
        <Trans>Contest ended at</Trans>{" "}
        {this.getEndTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
      </React.Fragment>
    );
  }

  renderExtraTimeEndTime() {
    if (this.countUsersWithExtraTime() === 0) return null;

    return (
      <li>
        <Trans>Contest ended for everyone at</Trans>{" "}
        {this.getExtraTimeEndTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
      </li>
    );
  }

  renderExtraTimeCountdown() {
    const endTime = this.getExtraTimeEndTime();

    return (
      <React.Fragment>
        <Trans>Remaining time for some participant</Trans>{" "}
        <CountdownView clock={() => this.props.session.serverTime()} end={endTime} />
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className="container">
        <div className="card mb-3">
          <div className="card-body">
            <h3>
              <Trans>Contest status</Trans>
            </h3>
            {!this.props.status.data.start_time
              ? this.renderNotStarted()
              : this.serverTime() < this.getEndTime()
              ? this.renderRunning()
              : this.serverTime() < this.getExtraTimeEndTime()
              ? this.renderRunningExtraTime()
              : this.renderFinished()}
          </div>
        </div>
        <div className="card mb-3">
          <div className="card-body">
            <h3>
              <Trans>System status</Trans>
            </h3>
            <ul className="mb-0">
              <li>
                {this.logsPromise && (
                  <PromiseView
                    promise={this.logsPromise}
                    renderFulfilled={(logs) =>
                      logs.items.length === 0 ? (
                        <React.Fragment>
                          <Trans>No issue detected</Trans> (
                          <Link to="/admin/logs">
                            <Trans>show log</Trans>
                          </Link>
                          )
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <Trans>Issue last detected</Trans>{" "}
                          <DateView
                            {...this.props}
                            clock={() => this.props.session.serverTime()}
                            date={DateTime.fromISO(logs.items[0].date)}
                          />{" "}
                          (
                          <Link to="/admin/logs">
                            <Trans>show log</Trans>
                          </Link>
                          )
                        </React.Fragment>
                      )
                    }
                    renderPending={() => i18n._(t`Loading...`)}
                    renderRejected={() => i18n._(t`Error`)}
                  />
                )}
              </li>
            </ul>
          </div>
        </div>
        <div className="card mb-3">
          <div className="card-body">
            <h3>
              <Trans>Extra time</Trans>
            </h3>
            <ul className="mb-0">
              <li>
                {this.props.status.extraTimeMinutes() === 0 ? (
                  <React.Fragment>
                    <Trans>No extra time set</Trans> (
                    <Link to="/admin/extra_time">
                      <Trans>set extra time</Trans>
                    </Link>
                    )
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Plural
                      value={this.props.status.extraTimeMinutes()}
                      one="Contest duration was extended by # minute"
                      other="Contest duration was extended by # minutes"
                    />{" "}
                    (
                    <Link to="/admin/extra_time">
                      <Trans>set extra time</Trans>
                    </Link>
                    )
                  </React.Fragment>
                )}
              </li>
              <li>
                <React.Fragment>
                  <Plural
                    value={this.countUsersWithExtraTime()}
                    _0="No user has extra time"
                    one="# user has extra time"
                    other="# users have extra time"
                  />{" "}
                  (
                  <Link to="/admin/users">
                    <Trans>show users</Trans>
                  </Link>
                  )
                </React.Fragment>
              </li>
            </ul>
          </div>
        </div>
        <div className="card mb-3 striped-background">
          <div className="card-body">
            <h3>
              <Trans>Danger zone</Trans>
            </h3>
            <button disabled={!this.isDeletable()} className="btn btn-danger" onClick={() => this.resetContest()}>
              <Trans>RESET</Trans>
            </button>
          </div>
        </div>
      </div>
    );
  }

  resetContest() {
    if (!window.confirm(i18n._(t`Are you sure?`))) return;

    client
      .adminApi(this.props.session.adminToken(), "/drop_contest", {})
      .then(() => {
        // logout (just to delete the admin token)
        this.props.session.logout();
        // reload
        window.location.reload();
      })
      .catch((response: any) => {
        notifyError(response);
      });
  }
}
