import Loadable from "./Loadable";
import client from "../TerryClient";
import { AxiosResponse } from "axios";
import { useState, useEffect } from "react";
import { useToken } from "./AdminContext";
import { notifyError } from "../utils";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export type LogEntry = {
  date: string;
  category: string;
  level: LogLevel;
  message: string;
};

export type LogsData = {
  items: LogEntry[];
};

export type LogsOptions = {
  start_date: string;
  end_date: string;
  level: LogLevel;
  category?: string;
};
export const defaultLogsOptions: LogsOptions = {
  start_date: "2000-01-01T00:00:00.000",
  end_date: "2030-01-01T00:00:00.000",
  level: LogLevel.WARNING,
};

export type ReloadLogs = (options?: LogsOptions) => void;

export function useLogs(): [Loadable<LogsData>, ReloadLogs] {
  const token = useToken();
  const [logs, setLogs] = useState<Loadable<LogsData>>(Loadable.loading());
  const [logsOptions, setLogsOptions] = useState(defaultLogsOptions);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    client
      .adminApi(token, "/log", logsOptions)
      .then((response: AxiosResponse) => {
        setLogs(Loadable.of(response.data as LogsData));
      })
      .catch((response) => {
        notifyError(response);
        setLogs(Loadable.error(response));
      });
  }, [token, logCount, logsOptions]);

  const reloadLogs = (options?: LogsOptions) => {
    if (options) setLogsOptions(options);
    setLogCount(logCount + 1);
  };

  return [logs, reloadLogs];
}
