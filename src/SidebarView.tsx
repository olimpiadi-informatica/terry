import * as React from 'react';
import { DateTime } from 'luxon';
import { translateComponent } from "./utils";
import { CountdownView } from './datetime.views';
import NavbarItemView from './NavbarItemView';
import ScoreView from './ScoreView';
import "./SidebarView.css";
import { InjectedTranslateProps } from 'react-i18next';
import { Model } from './user.models';

type Props = {
  userState: any
  model: Model
} & InjectedTranslateProps

class SidebarView extends React.Component<Props> {
  render() {
    const { t } = this.props;

    return (
      <nav className="bg-light sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>{t("navbar.total score")}</h3>
            <ScoreView
              style={{ 'textAlign': 'right', 'marginRight': '1rem' }}
              score={this.props.userState.data.total_score}
              max={this.props.userState.data.contest.max_total_score}
              size={2} />
          </li>

          <li className="divider-vertical" />

          <li className="nav-item title">
            <h3>{t("remaining time")}</h3>
            <p className="terry-remaining-time">
              <CountdownView {...this.props} clock={() => this.props.model.serverTime()} end={
                DateTime.fromISO(this.props.userState.data.end_time)
              } afterEnd={
                () => <span>{t("contest finished")}</span>
              } />
            </p>
          </li>

          <li className="divider-vertical" />

          <li className="nav-item title">
            <h3>{t("navbar.task list")}</h3>
          </li>
          <li className="divider-vertical" />

          {this.props.userState.data.contest.tasks.map((task: any, i: number) => <NavbarItemView key={i} taskName={task.name} {...this.props} />)}
        </ul>
      </nav>
    );
  }
}

export default translateComponent(SidebarView);
