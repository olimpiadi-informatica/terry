import * as React from "react";
import { DateTime } from "luxon";
import { NavLink } from "react-router-dom";
import { CountdownView } from "./datetime.views";
import NavbarItemView from "./NavbarItemView";
import ScoreView from "./ScoreView";
import "./SidebarView.css";
import { Model } from "./user.models";
import { Trans } from "@lingui/macro";

type Props = {
  userState: any;
  model: Model;
};

export default class SidebarView extends React.Component<Props> {
  render() {
    return (
      <nav className="bg-light sidebar">
        <ul className="nav nav-pills flex-column">
          {this.props.userState && this.props.userState.data.contest.has_started && (
            <React.Fragment>
              <li className="nav-item title">
                <h5 className="text-uppercase">
                  <Trans>Your score</Trans>
                </h5>
                <ScoreView
                  style={{ textAlign: "right", marginRight: "1rem" }}
                  score={this.props.userState.data.total_score}
                  max={this.props.userState.data.contest.max_total_score}
                  size={2}
                />
              </li>

              <li className="divider-vertical" />

              <li className="nav-item title">
                <h5 className="text-uppercase">
                  <Trans>Remaining time</Trans>
                </h5>
                <p className="terry-remaining-time">
                  <CountdownView
                    {...this.props}
                    clock={() => this.props.model.serverTime()}
                    end={DateTime.fromISO(this.props.userState.data.end_time)}
                    afterEnd={() => (
                      <span>
                        <Trans>The contest is finished</Trans>
                      </span>
                    )}
                  />
                </p>
              </li>
              <li className="divider-vertical" />

              <li className="nav-item title">
                <h5 className="text-uppercase">
                  <Trans>Tasks</Trans>
                </h5>
              </li>
              <li className="divider-vertical" />

              {this.props.userState.data.contest.tasks.map((task: any, i: number) => (
                <NavbarItemView key={i} taskName={task.name} {...this.props} />
              ))}

              <li className="divider-vertical" />
            </React.Fragment>
          )}

          <li className="nav-item title mt-3">
            <h5 className="text-uppercase">
              <Trans>Resources</Trans>
            </h5>
          </li>

          <li className="nav-item">
            <NavLink to={"/useful-info"} className="nav-link tasklist-item" activeClassName="active">
              <Trans>Useful information</Trans>
            </NavLink>
            <NavLink to={"/documentation"} className="nav-link tasklist-item" activeClassName="active">
              <Trans>Documentation</Trans>
            </NavLink>
          </li>
        </ul>
      </nav>
    );
  }
}
