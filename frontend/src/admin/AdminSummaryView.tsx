import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faDownload } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import { toast } from "react-toastify";
import { Trans, t, Plural } from "@lingui/macro";
import { DateComponent, CountdownComponent } from "../datetime.views";

import { i18n } from "../i18n";
import {
  useStatus, usePack, useActions, useServerTime,
} from "./AdminContext";
import { useLogs } from "./logs.hook";
import { useUsers } from "./users.hook";

export default function AdminSummaryView() {
  const status = useStatus().value();
  const pack = usePack().value();
  const [logs, reloadLogs] = useLogs();
  const [users, reloadUsers] = useUsers();
  const serverTime = useServerTime();
  const { startContest, resetContest } = useActions();

  if (!pack.uploaded) {
    throw new Error("AdminSummaryView requires the pack to be uploaded");
  }

  // auto reload the logs
  useEffect(() => {
    const LOG_REFRESH_INTERVAL = 5000;
    const interval = setInterval(() => {
      reloadLogs();
      reloadUsers();
    }, LOG_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [reloadLogs, reloadUsers]);

  const renderNotStarted = () => (
    <>
      <p>
        <Trans>The contest has not started yet!</Trans>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startContest().then(() => toast.success(i18n._(t`Contest was successfully started`)));
        }}
      >
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faPlay} />
          {" "}
          {i18n._(t`Start`)}
        </button>
      </form>
    </>
  );

  const renderRunning = () => (
    <ul className="mb-0">
      <li>{renderStartTime()}</li>
      <li>{renderCountdown()}</li>
    </ul>
  );

  const renderRunningExtraTime = () => (
    <ul className="mb-0">
      <li>{renderStartTime()}</li>
      <li>{renderEndTime()}</li>
      <li>{renderExtraTimeCountdown()}</li>
    </ul>
  );

  const renderFinished = () => (
    <>
      <ul>
        <li>{renderStartTime()}</li>
        <li>{renderEndTime()}</li>
        {renderExtraTimeEndTime()}
      </ul>

      <Link to="/admin/download_results" className="btn btn-primary">
        <FontAwesomeIcon icon={faDownload} />
        {" "}
        <Trans>Download contest results</Trans>
      </Link>
    </>
  );

  const countUsersWithExtraTime = () => {
    if (!users.isReady()) return 0;
    return users.value().items.filter((user) => user.extra_time !== 0).length;
  };

  const getStartTime = () => {
    if (!status.start_time) throw new Error("Unknown start time");
    return DateTime.fromISO(status.start_time);
  };

  const getEndTime = () => {
    if (!status.end_time) throw new Error("Unknown end time");
    return DateTime.fromISO(status.end_time);
  };

  const getUsersExtraTime = () => {
    if (!users.isReady()) return 0;
    return Math.max.apply(
      null,
      users.value().items.map((user) => user.extra_time),
    );
  };

  const getExtraTimeEndTime = () => getEndTime().plus({ seconds: getUsersExtraTime() });

  const isDeletable = () => pack.deletable;

  const renderStartTime = () => (
    <>
      <Trans>Contest started at</Trans>
      {" "}
      {getStartTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
    </>
  );

  const renderCountdownExtra = () => {
    if (countUsersWithExtraTime() === 0) return;

    return (
      <>
        {" "}
        (
        <span>
          <Plural
            value={getUsersExtraTime() / 60}
            one="plus # extra minute for some user"
            other="plus # extra minutes for some user"
          />
        </span>
        )
      </>
    );
  };

  const renderCountdown = () => (
    <>
      <Trans>Remaining time</Trans>
      {" "}
      <CountdownComponent clock={() => serverTime()} end={getEndTime()} afterEnd={() => ""} />
      {renderCountdownExtra()}
    </>
  );

  const renderEndTime = () => (
    <>
      <Trans>Contest ended at</Trans>
      {" "}
      {getEndTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
    </>
  );

  const renderExtraTimeEndTime = () => {
    if (countUsersWithExtraTime() === 0) return null;

    return (
      <li>
        <Trans>Contest ended for everyone at</Trans>
        {" "}
        {getExtraTimeEndTime().setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
      </li>
    );
  };

  const renderExtraTimeCountdown = () => {
    const endTime = getExtraTimeEndTime();

    return (
      <>
        <Trans>Remaining time for some participant</Trans>
        {" "}
        <CountdownComponent clock={() => serverTime()} end={endTime} afterEnd={() => ""} />
      </>
    );
  };

  const doResetContest = () => {
    if (!window.confirm(i18n._(t`Are you sure?`))) return;

    resetContest();
  };

  return (
    <div className="container">
      <div className="card mb-3">
        <div className="card-body">
          <h3>
            <Trans>Contest status</Trans>
          </h3>
          {!status.start_time
            ? renderNotStarted()
            : serverTime() < getEndTime()
              ? renderRunning()
              : serverTime() < getExtraTimeEndTime()
                ? renderRunningExtraTime()
                : renderFinished()}
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h3>
            <Trans>System status</Trans>
          </h3>
          <ul className="mb-0">
            <li>
              {logs.isLoading() ? (
                i18n._(t`Loading...`)
              ) : logs.isError() ? (
                i18n._(t`Error`)
              ) : logs.value().items.length === 0 ? (
                <>
                  <Trans>No issue detected</Trans>
                  {" "}
                  (
                  <Link to="/admin/logs">
                    <Trans>show log</Trans>
                  </Link>
                  )
                </>
              ) : (
                <>
                  <Trans>Issue last detected</Trans>
                  {" "}
                  <DateComponent clock={() => serverTime()} date={DateTime.fromISO(logs.value().items[0].date)} />
                  {" "}
                  (
                  <Link to="/admin/logs">
                    <Trans>show log</Trans>
                  </Link>
                  )
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h3>
            <Trans>Extra time</Trans>
          </h3>
          <ul className="mb-0">
            <li>
              <Plural
                value={Math.round((status.extra_time || 0) / 60)}
                _0="No extra time set"
                one="Contest duration was extended by # minute"
                other="Contest duration was extended by # minutes"
              />
              {" "}
              (
              <Link to="/admin/extra_time">
                <Trans>set extra time</Trans>
              </Link>
              )
            </li>
            <li>
              <>
                <Plural
                  value={countUsersWithExtraTime()}
                  _0="No user has extra time"
                  one="# user has extra time"
                  other="# users have extra time"
                />
                {" "}
                (
                <Link to="/admin/users">
                  <Trans>show users</Trans>
                </Link>
                )
              </>
            </li>
          </ul>
        </div>
      </div>
      <div className="card mb-3 striped-background">
        <div className="card-body">
          <h3>
            <Trans>Danger zone</Trans>
          </h3>
          <button disabled={!isDeletable()} className="btn btn-danger" onClick={() => doResetContest()}>
            <Trans>RESET</Trans>
          </button>
        </div>
      </div>
    </div>
  );
}
