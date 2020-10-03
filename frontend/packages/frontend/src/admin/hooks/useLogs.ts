import { AxiosResponse } from "axios";
import { useState, useEffect } from "react";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";
import { notifyError } from "src/utils";
import { useTriggerUpdate } from "@terry/shared/_/hooks/useTriggerUpdate";
import { useToken } from "src/admin/AdminContext";
import { LogsOptions, LogLevel, LogsData } from "src/admin/types";

export const defaultLogsOptions: LogsOptions = {
  start_date: "2000-01-01T00:00:00.000Z",
  end_date: "2030-01-01T00:00:00.000Z",
  level: LogLevel.WARNING,
};

export type ReloadLogs = (options?: LogsOptions) => void;

export function useLogs(initialOptions?: LogsOptions): [Loadable<LogsData>, ReloadLogs] {
  const token = useToken();
  const [logs, setLogs] = useState<Loadable<LogsData>>(Loadable.loading());
  const [logsOptions, setLogsOptions] = useState<LogsOptions>(initialOptions || defaultLogsOptions);
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
