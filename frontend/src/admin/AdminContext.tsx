import React, { useState, ReactNode, useEffect, useContext, useMemo } from "react";
import client from "../TerryClient";
import Cookies from "universal-cookie";
import { DateTime, Duration } from "luxon";
import { AxiosResponse } from "axios";
import { notifyError } from "../utils";
import Loadable from "./Loadable";

export type StatusData = {
  loaded: boolean;
  start_time?: string;
  end_time?: string;
  extra_time?: number;
};

export type Pack =
  | { uploaded: false }
  | {
      uploaded: true;
      deletable: boolean;
      name: string;
      description: string;
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

export type UserIp = {
  first_date: string;
  ip: string;
};

export type UserEntry = {
  name: string;
  surname: string;
  token: string;
  extra_time: number;
  ip: UserIp[];
};

export type UsersData = {
  items: UserEntry[];
};

type ContextData = {
  token: string | null;
  serverTimeSkew: Loadable<Duration>;
  status: Loadable<StatusData>;
  pack: Loadable<Pack>;
  logs: Loadable<LogsData>;
  users: Loadable<UsersData>;
};

export type ContextActions = {
  isLoggedIn: () => boolean;
  login: (token: string) => void;
  logout: () => void;
  changeLogsOptions: (options: LogsOptions) => void;
  reloadLogs: () => void;
  startContest: () => Promise<void>;
  resetContest: () => Promise<void>;
};

type AdminContextType = {
  data: ContextData;
  actions: ContextActions;
};

export const AdminContext = React.createContext<AdminContextType>({
  data: {
    token: null,
    serverTimeSkew: Loadable.loading(),
    status: Loadable.loading(),
    pack: Loadable.loading(),
    logs: Loadable.loading(),
    users: Loadable.loading(),
  },
  actions: {
    isLoggedIn: () => false,
    login: () => {},
    logout: () => {},
    changeLogsOptions: () => {},
    reloadLogs: () => {},
    startContest: () => Promise.reject(),
    resetContest: () => Promise.reject(),
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
  const [serverTimeSkew, setServerTimeSkew] = useState<Loadable<Duration>>(Loadable.loading());
  const [status, setStatus] = useState<Loadable<StatusData>>(Loadable.loading());
  const [statusCount, setStatusCount] = useState(0);
  const [pack, setPack] = useState<Loadable<Pack>>(Loadable.loading());
  const [logs, setLogs] = useState<Loadable<LogsData>>(Loadable.loading());
  const [logsOptions, setLogsOptions] = useState(defaultLogsOptions);
  const [logCount, setLogCount] = useState(0);
  const [users, setUsers] = useState<Loadable<UsersData>>(Loadable.loading());

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
  const startContest = () => {
    return client
      .adminApi(token, "/start")
      .then(() => {
        // reload the status
        setStatusCount(statusCount + 1);
      })
      .catch((response) => {
        notifyError(response);
      });
  };
  const resetContest = () => {
    return client
      .adminApi(token, "/drop_contest")
      .then(() => {
        logout();
      })
      .catch((response) => {
        notifyError(response);
      });
  };

  // handle the login
  useEffect(() => {
    if (!token) {
      setServerTimeSkew(Loadable.loading());
      setStatus(Loadable.loading());
      setLogs(Loadable.loading());
      return;
    }
    client
      .adminApi(token, "/status")
      .then((response: AxiosResponse) => {
        const serverDate = DateTime.fromHTTP(response.headers["date"]);
        setServerTimeSkew(Loadable.of(DateTime.local().diff(serverDate)));
        setStatus(Loadable.of(response.data));
      })
      .catch((response: AxiosResponse) => {
        notifyError(response);
        setToken(null);
        setServerTimeSkew(Loadable.loading());
        setStatus(Loadable.loading());
      });
  }, [token, statusCount]);

  // handle the pack status
  useEffect(() => {
    client
      .api("/admin/pack_status")
      .then((response) => {
        setPack(Loadable.of(response.data as Pack));
      })
      .catch((response) => {
        notifyError(response);
        setPack(Loadable.error(response));
      });
  }, []);

  // handle the logs
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

  useEffect(() => {
    client
      .adminApi(token, "/user_list")
      .then((response: AxiosResponse) => {
        setUsers(Loadable.of(response.data as UsersData));
      })
      .catch((response) => {
        notifyError(response);
        setUsers(Loadable.error(response));
      });
  }, [token]);

  const isLoggedIn = () => !status.isLoading();
  return (
    <AdminContext.Provider
      value={{
        data: {
          token,
          serverTimeSkew: serverTimeSkew,
          status,
          pack,
          logs,
          users,
        },
        actions: {
          isLoggedIn,
          login,
          logout,
          changeLogsOptions,
          reloadLogs,
          startContest,
          resetContest,
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

export function useStatus() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.status;
  }, [context.data.status]);
}

export function usePack() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.pack;
  }, [context.data.pack]);
}

export function useLogs() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.logs;
  }, [context.data.logs]);
}

export function useUsers() {
  const context = useContext(AdminContext);
  return useMemo(() => {
    return context.data.users;
  }, [context.data.users]);
}

export function useServerTime() {
  const context = useContext(AdminContext);

  return useMemo(() => {
    return () => DateTime.local().minus(context.data.serverTimeSkew.valueOr(Duration.fromMillis(0)));
  }, [context.data.serverTimeSkew]);
}
