import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {translateComponent, formatDate} from "../../utils";
import Logs from "../../models/admin/Logs";
import LoadingView from "../LoadingView";
import ModalView from '../ModalView';
import "./LogsView.css";

class LogsTable extends Component {
  constructor(props) {
    super(props);
    this.logs = props.logs;
    this.changeLevel = props.changeLevel;
    this.changeCategory = props.changeCategory;
  }

  componentDidMount() {
    this.logs.pushObserver(this);
  }

  componentWillUnmount() {
    this.logs.popObserver(this);
  }

  filter(log) {
    const filter = this.props.filter.toLowerCase();
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

    if (this.logs.isLoading())
      return <tr><td colspan="4">{t("loading")}</td></tr>;

    const items = this.logs.data.items.filter((l) => this.filter(l));

    if (items.length === 0)
      return <tr><td colspan="4">{t("no messages yet")}</td></tr>;

    return items.map((l, i) => this.formatLog(l, i));
  }

  render() {
    const { t } = this.props;

    return <div className="terry-log-table no-padding">
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
  }
}

LogsTable = translateComponent(LogsTable, "admin");

class LogsView extends Component {
  constructor(props) {
    super(props);

    this.session = props.session;
    this.session.updateLogs = this.updateLogs.bind(this);
    this.logs = new Logs(this.session);
    this.state = {
      level: "INFO",
      category: "",
      filter: ""
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
  }

  componentWillMount() {
    this.updateLogs();
    this.setInterval();
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  updateLogs() {
    const options = {
      start_date: "2000-01-01T00:00:00.000",
      end_date: "2030-01-01T00:00:00.000",
      level: this.state.level
    };
    if (this.state.category)
      options.category = this.state.category;
    this.logs.load(options);
  }

  setInterval() {
    this.interval = setInterval(this.updateLogs.bind(this), 5000);
  }
  clearInterval() {
    clearInterval(this.interval);
  }

  componentDidUpdate(props, state) {
    if (state.level !== this.state.level || state.category !== this.state.category)
      this.updateLogs();
  }

  changeLevel(level) {
    this.setState({level: level});
    this.clearInterval();
    this.setInterval();
  }

  changeCategory(cat) {
    this.setState({category: cat});
    this.clearInterval();
    this.setInterval();
  }

  changeFilter(filter) {
    this.setState({filter: filter});
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
          <LogsTable logs={this.logs} filter={this.state.filter}
                    changeCategory={this.changeCategory.bind(this)} changeLevel={this.changeLevel.bind(this)} />
        </div>
        <div className="modal-footer">
          <Link to={"/admin"} role="button" className="btn btn-primary">
            <span aria-hidden="true" className="fa fa-times"></span> {t("close")}
          </Link>
        </div>
      </ModalView>
    );
  }
}

export default translateComponent(LogsView, "admin");
