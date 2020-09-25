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

type ContextData = {
  token: string | null;
  serverTimeSkew: Loadable<Duration>;
  status: Loadable<StatusData>;
  pack: Loadable<Pack>;
};

export type ContextActions = {
  isLoggedIn: () => boolean;
  login: (token: string) => void;
  logout: () => void;
  startContest: () => Promise<void>;
  resetContest: () => Promise<void>;
  setExtraTime: (extraTime: number) => Promise<void>;
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
  },
  actions: {
    isLoggedIn: () => false,
    login: () => {},
    logout: () => {},
    startContest: () => Promise.reject(),
    resetContest: () => Promise.reject(),
    setExtraTime: () => Promise.reject(),
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

  const login = (token: string) => {
    cookies.set(cookieName, token);
    setToken(token);
  };
  const logout = () => {
    cookies.remove(cookieName);
    setToken(null);
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
  const setExtraTime = (extraTime: number, userToken?: string) => {
    const options = {
      extra_time: extraTime,
      token: userToken,
    };
    if (options.token === undefined) delete options.token;
    return client
      .adminApi(token, "/set_extra_time", options)
      .then(() => {
        setStatusCount(statusCount + 1);
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

  const isLoggedIn = () => !status.isLoading();
  return (
    <AdminContext.Provider
      value={{
        data: {
          token,
          serverTimeSkew: serverTimeSkew,
          status,
          pack,
        },
        actions: {
          isLoggedIn,
          login,
          logout,
          startContest,
          resetContest,
          setExtraTime,
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

export function useServerTime() {
  const context = useContext(AdminContext);

  return useMemo(() => {
    return () => DateTime.local().minus(context.data.serverTimeSkew.valueOr(Duration.fromMillis(0)));
  }, [context.data.serverTimeSkew]);
}
