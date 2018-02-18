import { DateTime } from 'luxon';
import React, { Component } from 'react';
import {translateComponent} from "./utils";
import CountdownView from './CountdownView';
import NavbarItemView from './NavbarItemView';
import ScoreView from './ScoreView';
import "./SidebarView.css";

class SidebarView extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }

  render() {
    const { t } = this.props;

    return (
      <nav className="bg-light sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>{t("navbar.total score")}</h3>
            <ScoreView style={{'text-align': 'right', 'margin-right': '1rem'}} score={this.model.user.total_score} max={this.model.contest.data.max_total_score} size={2} />
          </li>

          <li className="divider-vertical" />

          <li className="nav-item title">
            <h3>{t("remaining time")}</h3>
            <p className="terry-remaining-time">
              <CountdownView delta={this.model.timeDelta} end={
                DateTime.fromISO(this.model.user.end_time)
              }/>
            </p>
          </li>

          <li className="divider-vertical" />

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

export default translateComponent(SidebarView);
