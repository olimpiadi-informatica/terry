import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import { Trans, t } from "@lingui/macro";
import { Modal } from "src/components/Modal";
import "./AdminLogsView.css";
import { AbsoluteDate } from "src/components/AbsoluteDate";
import { LogLevel, LogsOptions, LogEntry } from "src/types/admin";
import { Error } from "src/components/Error";
import { useServerTime } from "./AdminContext";
import { useLogs, defaultLogsOptions } from "./hooks/useLogs";

const LOG_LEVELS: { [level in LogLevel]: { color: string } } = {
  DEBUG: {
    color: "secondary",
  },
  INFO: {
    color: "info",
  },
  WARNING: {
    color: "warning",
  },
  ERROR: {
    color: "danger",
  },
};

export function AdminLogsView() {
  const [level, setLevel] = useState(LogLevel.INFO);
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [options, setOptions] = useState<LogsOptions>({ ...defaultLogsOptions, level, category });

  const [logs, reloadLogs] = useLogs(options);
  const serverTime = useServerTime();

  // auto reload the logs
  useEffect(() => {
    const LOG_REFRESH_INTERVAL = 5000;
    const interval = setInterval(() => {
      reloadLogs();
    }, LOG_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [reloadLogs]);

  // react to option changes asking the context to reload the logs only when the options really changed
  useEffect(() => {
    const newOptions: LogsOptions = { ...options, level, category };
    if (newOptions.level !== options.level || newOptions.category !== options.category) {
      setOptions(newOptions);
      reloadLogs(newOptions);
    }
  }, [level, category, options, reloadLogs]);

  const filterLog = (log: LogEntry) => {
    if (!filter) return true;
    return log.message.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
  };

  const renderLogs = () => {
    if (logs.isLoading()) {
      return (
        <tr>
          <td colSpan={4}>
            <Trans>Loading...</Trans>
          </td>
        </tr>
      );
    }
    if (logs.isReady()) {
      const items = logs.value().items.filter((l) => filterLog(l));
      if (items.length === 0) {
        return (
          <tr>
            <td colSpan={4}>
              <Trans>No messages yet</Trans>
            </td>
          </tr>
        );
      }
      return items.map((log, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <tr key={i} className={`table-${LOG_LEVELS[log.level].color}`}>
          <td>
            <AbsoluteDate clock={() => serverTime()} date={DateTime.fromISO(log.date, { zone: "utc" })} />
          </td>
          <td>
            <button className="btn btn-link" type="button" onClick={() => setCategory(log.category)}>
              {log.category}
            </button>
          </td>
          <td>
            <button className="btn btn-link" type="button" onClick={() => setLevel(log.level)}>
              {log.level}
            </button>
          </td>
          <td>
            <pre className="log-message">{log.message}</pre>
          </td>
        </tr>
      ));
    }
    return (
      <tr>
        <td colSpan={4}>
          <Error boxed={false} cause={logs.error()} />
        </td>
      </tr>
    );
  };

  return (
    <Modal contentLabel={t`Logs`} returnUrl="/admin">
      <div className="modal-header">
        <h5 className="modal-title">
          <Trans>Logs</Trans>
        </h5>
        <Link to="/admin" role="button" className="close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </Link>
      </div>
      <div className="modal-body no-padding">
        <div className="form-group p-2 mb-0">
          <div className="btn-group mb-1" role="group" aria-label="Choose log level">
            {Object.entries(LOG_LEVELS).map(([lvl, obj]) => (
              <button
                key={lvl}
                type="button"
                className={["btn", level === lvl ? "active" : "", `btn-${obj.color}`].join(" ")}
                onClick={() => setLevel(lvl as LogLevel)}
              >
                {lvl}
              </button>
            ))}
          </div>
          <input
            placeholder={t`Category filter`}
            className="form-control mb-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            placeholder={t`Message filter`}
            className="form-control"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="terry-log-table no-padding">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <Trans>Date</Trans>
                </th>
                <th>
                  <Trans>Category</Trans>
                </th>
                <th>
                  <Trans>Level</Trans>
                </th>
                <th>
                  <Trans>Message</Trans>
                </th>
              </tr>
            </thead>
            <tbody>{renderLogs()}</tbody>
          </table>
        </div>
      </div>
      <div className="modal-footer">
        <Link to="/admin" role="button" className="btn btn-primary">
          <FontAwesomeIcon icon={faTimes} />
          {" "}
          <Trans>Close</Trans>
        </Link>
      </div>
    </Modal>
  );
}
