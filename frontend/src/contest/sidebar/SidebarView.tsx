import React, { useCallback } from "react";
import { DateTime } from "luxon";
import { Trans } from "@lingui/macro";
import { NavLink } from "react-router-dom";
import { Countdown } from "src/components/Countdown";
import { TaskData, Status } from "src/types/contest";
import {
  useServerTime,
  useStatus,
  useIsAdmin,
  useToken,
} from "src/contest/ContestContext";
import { ScoreView } from "src/contest/ScoreView";
import classNames from "classnames";
import { NavbarItemView } from "./NavbarItemView";
import "./SidebarView.css";

export function SidebarView() {
  const status = useStatus();
  const isAdmin = useIsAdmin();
  const serverTime = useServerTime();
  const contest = status.isReady() ? status.value().contest : null;
  const token = useToken();

  const afterEnd = useCallback(
    () => (
      <span>
        <Trans>The contest is finished</Trans>
      </span>
    ),
    [],
  );

  const afterStart = useCallback(
    (statusInfo: Status) => (
      <Countdown
        clock={() => serverTime()}
        end={DateTime.fromISO(statusInfo.contest.time.end, {
          zone: "utc",
        })}
        afterEnd={afterEnd}
      />
    ),
    [afterEnd],
  );

  const renderStarted = useCallback(
    (statusInfo: Status) => {
      const startTime = DateTime.fromISO(statusInfo.contest.time.start, {
        zone: "utc",
      });
      return (
        <>
          <li className="nav-item title">
            <h5 className="text-uppercase">
              <Trans>Your score</Trans>
            </h5>
            <ScoreView
              style={{ textAlign: "right", marginRight: "1rem" }}
              score={statusInfo.user?.total_score || 0}
              max={statusInfo.contest.max_total_score || 0}
              size={2}
            />
          </li>

          <li className="divider-vertical" />

          <li className="nav-item title">
            <h5 className="text-uppercase">
              <Trans>Remaining time</Trans>
            </h5>
            <p className="terry-remaining-time">
              {serverTime() < startTime && "-"}
              <Countdown
                clock={() => serverTime()}
                end={startTime}
                afterEnd={() => afterStart(statusInfo)}
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

          {statusInfo.contest.tasks?.map((task: TaskData) => (
            <NavbarItemView key={task.name} taskName={task.name} />
          ))}

          <li className="divider-vertical" />
        </>
      );
    },
    [serverTime, afterEnd],
  );

  return (
    <nav className="bg-light sidebar">
      <ul className="nav nav-pills flex-column">
        {contest?.has_started === true && renderStarted(status.value())}

        {!status.isLoading() && !token && (
          <li className="nav-item">
            <NavLink
              to="/login"
              className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
            >
              <Trans>Login</Trans>
            </NavLink>
          </li>
        )}

        <li className="nav-item title mt-3">
          <h5 className="text-uppercase">
            <Trans>Communication</Trans>
          </h5>
        </li>
        <li className="nav-item">
          <NavLink
            to="/communication"
            className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
          >
            <Trans>Questions and Announcements</Trans>
          </NavLink>
        </li>

        {contest?.extra_material && contest?.extra_material.length > 0 && (
          <>
            <li className="nav-item title mt-3">
              <h5 className="text-uppercase">
                <Trans>Extra material</Trans>
              </h5>
            </li>
            {contest?.extra_material.map((section) => (
              <li className="nav-item" key={section.url}>
                <NavLink
                  to={`/extra-material/${section.url}`}
                  className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
                >
                  {section.name}
                </NavLink>
              </li>
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <li className="nav-item title mt-3">
              <h5 className="text-uppercase">
                <Trans>Admin</Trans>
              </h5>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/status"
                className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
              >
                <Trans>Contest Status</Trans>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/questions"
                className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
              >
                <Trans>Manage Questions</Trans>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/announcements"
                className={({ isActive }) => classNames("nav-link tasklist-item", isActive && "active")}
              >
                <Trans>Add Announcement</Trans>
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
