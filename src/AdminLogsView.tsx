import * as React from "react";
import { Object } from "core-js";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ModalView from "./ModalView";
import "./AdminLogsView.css";
import PromiseView from "./PromiseView";
import { AbsoluteDateView } from "./datetime.views";
import { DateTime } from "luxon";
import { AdminSession } from "./admin.models";
import ObservablePromise from "./ObservablePromise";
import { Trans, t } from "@lingui/macro";
import { i18n } from "./i18n";

const LOG_LEVELS: any = {
  DEBUG: {
    color: "secondary",
  },
  INFO: {
    color: "info",
  },
  WARNING: {
    color: "warning",
  },
  ERROR: {
    color: "danger",
  },
};

type LogItem = {
  level: string;
  category: string;
  message: string;
  date: string;
};

type Props = {
  session: AdminSession;
};

type State = {
  level: string;
  category: string;
  filter: string;
};

export default class AdminLogsView extends React.Component<Props, State> {
  logsPromise: any;
  refreshLogsPromise?: ObservablePromise;
  interval?: NodeJS.Timer;

  constructor(props: Props) {
    super(props);
    this.state = {
      level: "INFO",
      category: "",
      filter: "",
    };
  }

  componentWillMount() {
    this.loadLogs();
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refreshLogs(), 5000);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
      delete this.interval;
    }
  }

  loadLogs() {
    this.refreshLogsPromise = undefined;
    this.logsPromise = this.doLoadLogs();
    this.forceUpdate();
  }

  doLoadLogs() {
    const options: any = {
      start_date: "2000-01-01T00:00:00.000",
      end_date: "2030-01-01T00:00:00.000",
      level: this.state.level,
    };
    if (this.state.category) {
      options.category = this.state.category;
    }
    return this.props.session.loadLogs(options);
  }

  refreshLogs() {
    const promise = (this.refreshLogsPromise = this.doLoadLogs());
    this.refreshLogsPromise.delegate.then(() => {
      if (this.refreshLogsPromise !== promise) return;
      this.logsPromise = promise;
      this.forceUpdate();
    });
  }

  componentDidUpdate(_props: Props, state: State) {
    if (state.level !== this.state.level || state.category !== this.state.category) this.loadLogs();
  }

  changeLevel(level: string) {
    this.setState({ level });
  }

  changeCategory(category: string) {
    this.setState({ category });
  }

  changeFilter(filter: string) {
    this.setState({ filter });
  }

  filter(log: LogItem) {
    const filter = this.state.filter.toLowerCase();
    if (!filter) return true;
    return log.message.toLowerCase().indexOf(filter) !== -1;
  }

  render() {
    return (
      <ModalView contentLabel={i18n._(t`Logs`)} returnUrl={"/admin"}>
        <div className="modal-header">
          <h5 className="modal-title">
            <Trans>Logs</Trans>
          </h5>
          <Link to={"/admin"} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body no-padding">
          <div className="form-group p-2 mb-0">
            <div className="btn-group mb-1" role="group" aria-label="Choose log level">
              {Object.entries(LOG_LEVELS).map(([level, obj]) => (
                <button
                  key={level}
                  className={["btn", this.state.level === level ? "active" : "", "btn-" + obj.color].join(" ")}
                  onClick={() => this.changeLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            <input
              placeholder={i18n._(t`Category filter`)}
              className="form-control mb-1"
              value={this.state.category}
              onChange={(e) => this.changeCategory(e.target.value)}
            />
            <input
              placeholder={i18n._(t`Message filter`)}
              className="form-control"
              value={this.state.filter}
              onChange={(e) => this.changeFilter(e.target.value)}
            />
          </div>
          <div className="terry-log-table no-padding">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <Trans>Date</Trans>
                  </th>
                  <th>
                    <Trans>Category</Trans>
                  </th>
                  <th>
                    <Trans>Level</Trans>
                  </th>
                  <th>
                    <Trans>Message</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                <PromiseView
                  promise={this.logsPromise}
                  renderFulfilled={(logs: { items: LogItem[] }) => {
                    const items = logs.items.filter((l) => this.filter(l));
                    if (items.length === 0)
                      return (
                        <tr>
                          <td colSpan={4}>
                            <Trans>No messages yet</Trans>
                          </td>
                        </tr>
                      );
                    return items.map((log, i) => (
                      <tr key={i} className={"table-" + LOG_LEVELS[log.level].color}>
                        <td>
                          <AbsoluteDateView
                            clock={() => this.props.session.serverTime()}
                            date={DateTime.fromISO(log.date)}
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-link"
                            onClick={() => {
                              this.changeCategory(log.category);
                            }}
                          >
                            {log.category}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-link"
                            onClick={() => {
                              this.changeLevel(log.level);
                            }}
                          >
                            {log.level}
                          </button>
                        </td>
                        <td>
                          <pre>{log.message}</pre>
                        </td>
                      </tr>
                    ));
                  }}
                  renderPending={() => (
                    <tr>
                      <td colSpan={4}>{<Trans>Loading...</Trans>}</td>
                    </tr>
                  )}
                  renderRejected={() => (
                    <tr>
                      <td colSpan={4}>
                        <Trans>Error</Trans>
                      </td>
                    </tr>
                  )}
                />
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <Link to={"/admin"} role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes} /> <Trans>Close</Trans>
          </Link>
        </div>
      </ModalView>
    );
  }
}
