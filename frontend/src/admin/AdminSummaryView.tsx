import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { Trans, t, Plural } from "@lingui/macro";
import { RelativeDate } from "src/components/RelativeDate";
import { client } from "src/TerryClient";
import { Error } from "src/components/Error";
import { Loading } from "src/components/Loading";
import { useStatus, useActions, useServerTime } from "./AdminContext";
import { useLogs } from "./hooks/useLogs";
import { useUsers } from "./hooks/useUsers";
import { usePack } from "./hooks/usePack";
import { AdminContestStatus } from "./AdminContestStatus";

export function AdminSummaryView() {
  const status = useStatus().value();
  const pack = usePack().value();
  const [logs, reloadLogs] = useLogs();
  const [users, reloadUsers] = useUsers();
  const serverTime = useServerTime();
  const { resetContest } = useActions();

  if (!pack.uploaded) {
    throw new window.Error("AdminSummaryView requires the pack to be uploaded");
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

  const countUsersWithExtraTime = () => {
    if (!users.isReady()) return 0;
    return users.value().items.filter((user) => user.extra_time !== 0).length;
  };

  const isDeletable = () => pack.deletable;

  const doResetContest = () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t`Are you sure?`)) return;

    resetContest();
  };

  return (
    <div className="container">
      <AdminContestStatus users={users} />
      <div className="card mb-3">
        <div className="card-body">
          <h3>
            <Trans>System status</Trans>
          </h3>
          {logs.isLoading() && <Loading />}
          {logs.isError() && <Error cause={logs.error()} />}
          {logs.isReady()
          && (
            <ul className="mb-0">
              <li>
                {logs.value().items.length === 0 ? (
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
                    <RelativeDate
                      clock={() => serverTime()}
                      date={DateTime.fromISO(logs.value().items[0].date, { zone: "utc" })}
                    />
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
          )}
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
      {
        client.communications && (
          <div className="card mb-3">
            <div className="card-body">
              <h3>
                <Trans>Communication system</Trans>
              </h3>
              <p><Trans>The communication system is enabled for this contest.</Trans></p>
              <Link to="/admin/communication" className="btn btn-primary">
                <Trans>Visit</Trans>
              </Link>
            </div>
          </div>
        )
      }
      <div className="card mb-3 striped-background">
        <div className="card-body">
          <h3>
            <Trans>Danger zone</Trans>
          </h3>
          <button disabled={!isDeletable()} type="button" className="btn btn-danger" onClick={() => doResetContest()}>
            <Trans>RESET</Trans>
          </button>
        </div>
      </div>
    </div>
  );
}
