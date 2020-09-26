import React from "react";
import { DateTime } from "luxon";
import { Trans } from "@lingui/macro";
import { NavLink } from "react-router-dom";
import { CountdownComponent } from "../datetime.views";
import { NavbarItemView } from "./NavbarItemView";
import { ScoreView } from "./ScoreView";
import "./SidebarView.css";
import {
  useContest, TaskData, StartedContest, useServerTime,
} from "./ContestContext";

export function SidebarView() {
  const contestL = useContest();
  const serverTime = useServerTime();
  const contest = contestL.isReady() ? contestL.value() : null;

  const renderStarted = (startedContest: StartedContest) => (
    <>
      <li className="nav-item title">
        <h5 className="text-uppercase">
          <Trans>Your score</Trans>
        </h5>
        <ScoreView
          style={{ textAlign: "right", marginRight: "1rem" }}
          score={startedContest.total_score}
          max={startedContest.contest.max_total_score}
          size={2}
        />
      </li>

      <li className="divider-vertical" />

      <li className="nav-item title">
        <h5 className="text-uppercase">
          <Trans>Remaining time</Trans>
        </h5>
        <p className="terry-remaining-time">
          <CountdownComponent
            clock={() => serverTime()}
            end={DateTime.fromISO(startedContest.end_time)}
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

      {startedContest.contest.tasks.map((task: TaskData) => (
        <NavbarItemView key={task.name} taskName={task.name} />
      ))}

      <li className="divider-vertical" />
    </>
  );

  return (
    <nav className="bg-light sidebar">
      <ul className="nav nav-pills flex-column">
        {contest && contest.contest.has_started && renderStarted(contest as StartedContest)}

        <li className="nav-item title mt-3">
          <h5 className="text-uppercase">
            <Trans>Resources</Trans>
          </h5>
        </li>

        <li className="nav-item">
          <NavLink to="/useful-info" className="nav-link tasklist-item" activeClassName="active">
            <Trans>Useful information</Trans>
          </NavLink>
          <NavLink to="/documentation" className="nav-link tasklist-item" activeClassName="active">
            <Trans>Documentation</Trans>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
