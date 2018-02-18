import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import {translateComponent, formatDate} from "./utils";
import LoadingView from "./LoadingView";
import ModalView from './ModalView';
import "./LogsView.css";
import PromiseView from './PromiseView';

class LogsView extends Component {
  constructor(props) {
    super(props);

    this.session = props.session;
    this.state = {
      level: "INFO",
      category: "",
      filter: "",
    };

    this.LOG_LEVELS = {
      DEBUG: {
        color: 'secondary',
      },
      INFO: {
        color: 'info',
      },
      WARNING: {
        color: 'warning',
      },
      ERROR: {
        color: 'danger',
      },
    };

    this.loadLogs();
  }

  componentDidMount() {
    this.interval = setInterval(() => this.loadLogs(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadLogs() {
    const options = {
      start_date: "2000-01-01T00:00:00.000",
      end_date: "2030-01-01T00:00:00.000",
      level: this.state.level
    };
    if (this.state.category) {
      options.category = this.state.category;
    }
    this.logsPromise = this.session.loadLogs(options);
    this.forceUpdate();
  }

  componentDidUpdate(props, state) {
    if (state.level !== this.state.level || state.category !== this.state.category)
      this.loadLogs();
  }

  changeLevel(level) {
    this.setState({level: level});
  }

  changeCategory(cat) {
    this.setState({category: cat});
  }

  changeFilter(filter) {
    this.setState({filter: filter});
  }

  filter(log) {
    const filter = this.state.filter.toLowerCase();
    if (!filter) return true;
    return log.message.toLowerCase().indexOf(filter) !== -1;
  }

  formatLog(log, i) {
    const { t } = this.props;
    const levelToClass = (level) =>
        level === "DEBUG" ? "secondary" :
        level === "INFO" ? "info" :
        level === "WARNING" ? "warning" :
        level === "ERROR" ? "danger" : "light";

    return <tr key={i} className={"table-"+levelToClass(log.level)}>
      <td>{new Date(log.date).toLocaleString()}</td>
      <td>
        <a href="/admin" onClick={(e) => { e.preventDefault(); this.changeCategory(log.category)}}>
        {log.category}
        </a>
      </td>
      <td>
        <a href="/admin" onClick={(e) => { e.preventDefault(); this.changeLevel(log.level)}}>
        {t("logs.levels."+log.level)}
        </a>
      </td>
      <td><pre>{log.message}</pre></td>
    </tr>;
  }

  renderTableBody() {
    const { t } = this.props;

    return <PromiseView promise={this.logsPromise}
      renderFulfilled={(logs) => {
        const items = logs.items.filter((l) => this.filter(l));
        if (items.length === 0) return <tr><td colSpan="4">{t("no messages yet")}</td></tr>;
        return items.map((l, i) => this.formatLog(l, i));
      }}
    />;
  }

  render() {
    const { t } = this.props;

    return (
      <ModalView contentLabel={t("logs.title")} returnUrl={"/admin"}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t("logs.title")}
          </h5>
          <Link to={"/admin"} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <div className="btn-group" role="group" aria-label="Choose log level">
              {Object.entries(this.LOG_LEVELS).map(([level, obj]) => (
                <button
                className={[
                  'btn',
                  ((this.state.level === level) ? 'active' : ''),
                  'btn-' + obj.color
                ].join(' ')}
                role="button"
                onClick={(e) => this.changeLevel(level)}
                >
                  {t("logs.levels." + level)}
                </button>
              ))}
            </div>
            <input
              placeholder={t("logs.category filter")} className="form-control" value={this.state.category}
              onChange={(e) => this.changeCategory(e.target.value)}
            />
            <input placeholder={t("logs.message filter")} className="form-control" value={this.state.filter}
                  onChange={(e) => this.changeFilter(e.target.value)}/>
          </div>
          <div className="terry-log-table no-padding">
            <table className="table">
              <thead>
              <tr>
                <th>{t("logs.date")}</th>
                <th>{t("logs.category")}</th>
                <th>{t("logs.level")}</th>
                <th>{t("logs.message")}</th>
              </tr>
              </thead>
              <tbody>
                {this.renderTableBody()}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <Link to={"/admin"} role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes}/> {t("close")}
          </Link>
        </div>
      </ModalView>
    );
  }
}

export default translateComponent(LogsView, "admin");
