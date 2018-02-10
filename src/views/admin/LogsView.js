import React, { Component } from 'react';
import {translateComponent, formatDate} from "../../utils";
import Logs from "../../models/admin/Logs";
import LoadingView from "../LoadingView";
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
        level === "DEBUG" ? "light" :
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

  render() {
    const { t } = this.props;
    if (this.logs.isLoading()) return <LoadingView />;

    return <div className="terry-log-table">
      <table className="table table-bordered">
        <thead>
        <tr>
          <th>{t("logs.date")}</th>
          <th>{t("logs.category")}</th>
          <th>{t("logs.level")}</th>
          <th>{t("logs.message")}</th>
        </tr>
        </thead>
        <tbody>
          {this.logs.data.items.filter((l) => this.filter(l)).map((l, i) => this.formatLog(l, i))}
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
  }

  componentWillMount() {
    this.updateLogs();
    this.setInterval();
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  updateLogs() {
    // TODO lol, dunno how to do that xD
    const start = new Date(Date.now()-1000000000);
    const end = new Date();
    const options = {
      start_date: formatDate(start),
      end_date: formatDate(end),
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

    return <React.Fragment>
      <h1>{t("logs.title")}</h1>

      <input
        placeholder={t("logs.category filter")} className="form-control" value={this.state.category}
        onChange={(e) => this.changeCategory(e.target.value)}
      />
      <div className="form-group">
        <select id="level" className="form-control" onChange={(e) => this.changeLevel(e.target.value)}
                value={this.state.level}>
          <option value="DEBUG">{t("logs.levels.DEBUG")}</option>
          <option value="INFO">{t("logs.levels.INFO")}</option>
          <option value="WARNING">{t("logs.levels.WARNING")}</option>
          <option value="ERROR">{t("logs.levels.ERROR")}</option>
        </select>
      </div>
      <div className="form-group">
        <input placeholder={t("logs.message filter")} className="form-control" value={this.state.filter}
               onChange={(e) => this.changeFilter(e.target.value)}/>
      </div>
      <LogsTable logs={this.logs} filter={this.state.filter}
                 changeCategory={this.changeCategory.bind(this)} changeLevel={this.changeLevel.bind(this)} />
    </React.Fragment>;
  }
}

export default translateComponent(LogsView, "admin");
