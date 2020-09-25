import React, { useState, ReactNode, useEffect, useContext, useMemo } from "react";
import client from "../TerryClient";
import Cookies from "universal-cookie";
import { DateTime } from "luxon";
import { AxiosResponse } from "axios";
import { notifyError } from "../utils";
import Loadable from "./Loadable";

export type StatusData = {
  loaded: boolean;
  start_time?: string;
  end_time?: string;
  extra_time?: number;
};

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
  category: undefined,
};

type ContextData = {
  token: string | null;
  serverTime: Loadable<DateTime>;
  status: Loadable<StatusData>;
  logs: Loadable<LogsData>;
};

export type ContextActions = {
  isLoggedIn: () => boolean;
  login: (token: string) => void;
  logout: () => void;
  changeLogsOptions: (options: LogsOptions) => void;
  reloadLogs: () => void;
};

type AdminContextType = {
  data: ContextData;
  actions: ContextActions;
};

export const AdminContext = React.createContext<AdminContextType>({
  data: {
    token: null,
    serverTime: Loadable.loading(),
    status: Loadable.loading(),
    logs: Loadable.loading(),
  },
  actions: {
    isLoggedIn: () => false,
    login: () => {},
    logout: () => {},
    changeLogsOptions: () => {},
    reloadLogs: () => {},
  },
});

type AdminContextProps = {
  children: ReactNode;
};

export function AdminContextProvider({ children }: AdminContextProps) {
  const cookieName = "adminToken";
  const cookies = new Cookies();
  const tokenFromCookie = cookies.get(cookieName);

  const [token, setToken] = useState(tokenFromCookie);
  const [serverTime, setServerTime] = useState<Loadable<DateTime>>(Loadable.loading());
  const [status, setStatus] = useState<Loadable<StatusData>>(Loadable.loading());
  const [logs, setLogs] = useState<Loadable<LogsData>>(Loadable.loading());
  const [logsOptions, setLogsOptions] = useState(defaultLogsOptions);
  const [logCount, setLogCount] = useState(0);

  const login = (token: string) => {
    cookies.set(cookieName, token);
    setToken(token);
  };
  const logout = () => {
    cookies.remove(cookieName);
    setToken(null);
  };
  const changeLogsOptions = (options: LogsOptions) => {
    setLogsOptions(options);
  };
  const reloadLogs = () => {
    setLogCount(logCount + 1);
  };

  // handle the login
  useEffect(() => {
    if (!token) return;
    client
      .adminApi(token, "/status")
      .then((response: AxiosResponse) => {
        setServerTime(Loadable.of(DateTime.fromHTTP(response.headers["date"])));
        setStatus(response.data);
      })
      .catch((response: AxiosResponse) => {
        notifyError(response);
        setToken(null);
        setServerTime(Loadable.loading());
        setStatus(Loadable.loading());
      });
  }, [token]);
  // handle the logs
  useEffect(() => {
    if (!token) return;
    client.adminApi(token, "/log", logsOptions).then((response: AxiosResponse) => {
      setLogs(Loadable.of(response.data));
    });
  }, [token, logCount, logsOptions]);

  const isLoggedIn = () => status !== null;

  return (
    <AdminContext.Provider
      value={{
        data: {
          token,
          serverTime,
          status,
          logs,
        },
        actions: {
          isLoggedIn,
          login,
          logout,
          changeLogsOptions,
          reloadLogs,
        },
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useActions() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.actions;
  }, [context.actions]);
}

export function useToken() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.token;
  }, [context.data.token]);
}

export function useLogs() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.logs;
  }, [context.data.logs]);
}

export function useServerTime() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.serverTime;
  }, [context.data.serverTime]);
}
