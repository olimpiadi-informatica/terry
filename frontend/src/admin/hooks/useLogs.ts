import { AxiosResponse } from "axios";
import { useState, useEffect } from "react";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";
import { notifyError } from "src/utils";
import { useTriggerUpdate } from "src/useTriggerUpdate.hook";
import { useToken } from "src/admin/AdminContext";

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
  // eslint-disable-next-line camelcase
  start_date: string;
  // eslint-disable-next-line camelcase
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
  const [logsOptions, setLogsOptions] = useState<LogsOptions>(defaultLogsOptions);
  const [logsUpdate, triggerLogsUpdate] = useTriggerUpdate();

  useEffect(() => {
    if (!token) return;
    const options = { ...logsOptions };
    if (!options.category) delete options.category;
    client
      .adminApi(token, "/log", options)
      .then((response: AxiosResponse) => {
        setLogs(Loadable.of(response.data as LogsData));
      })
      .catch((response) => {
        notifyError(response);
        setLogs(Loadable.error(response));
      });
  }, [token, logsUpdate, logsOptions]);

  const reloadLogs = (options?: LogsOptions) => {
    if (options) setLogsOptions(options);
    triggerLogsUpdate();
  };

  return [logs, reloadLogs];
}
