import * as React from "react";
import { DateTime } from "luxon";
import { translateComponent } from "./utils";
import { NavLink } from "react-router-dom";
import { CountdownView } from "./datetime.views";
import NavbarItemView from "./NavbarItemView";
import ScoreView from "./ScoreView";
import "./SidebarView.css";
import { WithTranslation } from "react-i18next";
import { Model } from "./user.models";

type Props = {
  userState: any;
  model: Model;
} & WithTranslation;

class SidebarView extends React.Component<Props> {
  render() {
    const { t } = this.props;

    return (
      <nav className="bg-light sidebar">
        <ul className="nav nav-pills flex-column">
          {this.props.userState && this.props.userState.data.contest.has_started && (
            <React.Fragment>
              <li className="nav-item title">
                <h5 className="text-uppercase">{t("navbar.total score")}</h5>
                <ScoreView
                  style={{ textAlign: "right", marginRight: "1rem" }}
                  score={this.props.userState.data.total_score}
                  max={this.props.userState.data.contest.max_total_score}
                  size={2}
                />
              </li>

              <li className="divider-vertical" />

              <li className="nav-item title">
                <h5 className="text-uppercase">{t("remaining time")}</h5>
                <p className="terry-remaining-time">
                  <CountdownView
                    {...this.props}
                    clock={() => this.props.model.serverTime()}
                    end={DateTime.fromISO(this.props.userState.data.end_time)}
                    afterEnd={() => <span>{t("contest finished")}</span>}
                  />
                </p>
              </li>
              <li className="divider-vertical" />

              <li className="nav-item title">
                <h5 className="text-uppercase">{t("navbar.task list")}</h5>
              </li>
              <li className="divider-vertical" />

              {this.props.userState.data.contest.tasks.map((task: any, i: number) => (
                <NavbarItemView key={i} taskName={task.name} {...this.props} />
              ))}

              <li className="divider-vertical" />
            </React.Fragment>
          )}

          <li className="nav-item title mt-3">
            <h5 className="text-uppercase">{t("navbar.resources")}</h5>
          </li>

          <li className="nav-item">
            <NavLink to={"/useful-info"} className="nav-link tasklist-item" activeClassName="active">
              Informazioni utili
            </NavLink>
            <NavLink to={"/documentation"} className="nav-link tasklist-item" activeClassName="active">
              Documentazione
            </NavLink>
          </li>
        </ul>
      </nav>
    );
  }
}

export default translateComponent(SidebarView);
