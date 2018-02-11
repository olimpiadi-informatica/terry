import { DateTime } from 'luxon';
import React, { Component } from 'react';
import {translateComponent} from "../utils";
import CountdownView from './CountdownView';
import NavbarItemView from './NavbarItemView';
import TotalScoreView from './TotalScoreView';

class SidebarView extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }

  render() {
    const { t } = this.props;

    return (
      <nav className="bg-faded sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>{t("navbar.total score")}</h3>
            <TotalScoreView model={this.model} />
          </li>
          <li className="divider-vertical" />

          <li className="nav-item title">
            <h3>{t("navbar.remaining time")}</h3>
            <div style={{'font-size': 'larger', 'text-align': 'right', 'margin-right': '1em'}}>
              <CountdownView delta={this.model.timeDelta} end={
                DateTime.fromMillis(this.model.user.end_time * 1000)
              }/>
            </div>
          </li>

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
