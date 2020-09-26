import React, {
  useState, ReactNode, useEffect, useContext, useMemo,
} from "react";
import { DateTime, Duration } from "luxon";
import { AxiosResponse } from "axios";
import client from "../TerryClient";
import { notifyError } from "../utils";
import Loadable from "../Loadable";
import useTriggerUpdate from "../useTriggerUpdate.hook";
import useLogin from "../useLogin.hook";

export type StatusData = {
  loaded: boolean;
  // eslint-disable-next-line camelcase
  start_time?: string;
  // eslint-disable-next-line camelcase
  end_time?: string;
  // eslint-disable-next-line camelcase
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
  setExtraTime: (extraTime: number, userToken?: string) => Promise<void>;
  uploadPack: (file: File) => void;
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
    uploadPack: () => {},
  },
});

type AdminContextProps = {
  children: ReactNode;
};

export function AdminContextProvider({ children }: AdminContextProps) {
  const cookieName = "adminToken";

  const [token, login, logout] = useLogin(cookieName);
  const [serverTimeSkew, setServerTimeSkew] = useState<Loadable<Duration>>(Loadable.loading());
  const [status, setStatus] = useState<Loadable<StatusData>>(Loadable.loading());
  const [statusUpdate, triggerStatusUpdate] = useTriggerUpdate();
  const [pack, setPack] = useState<Loadable<Pack>>(Loadable.loading());
  const [packUpdate, triggerPackUpdate] = useTriggerUpdate();

  const startContest = () => {
    if (!token) throw new Error("You are not logged in");

    return client
      .adminApi(token, "/start")
      .then(() => {
        triggerStatusUpdate();
      })
      .catch((response) => {
        notifyError(response);
      });
  };
  const resetContest = () => {
    if (!token) throw new Error("You are not logged in");
    return client
      .adminApi(token, "/drop_contest")
      .then(() => {
        logout();
        triggerPackUpdate();
      })
      .catch((response) => {
        notifyError(response);
      });
  };
  const setExtraTime = (extraTime: number, userToken?: string) => {
    if (!token) throw new Error("You are not logged in");
    const options = {
      extra_time: extraTime.toString(),
      token: userToken,
    };
    if (options.token === undefined) delete options.token;
    return client
      .adminApi(token, "/set_extra_time", options)
      .then(() => {
        triggerStatusUpdate();
      })
      .catch((response) => {
        notifyError(response);
      });
  };
  const uploadPack = (file: File) => {
    const data = new FormData();

    data.append("file", file);

    return client.api
      .post("/admin/upload_pack", data)
      .then(() => {
        triggerPackUpdate();
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
        const serverDate = DateTime.fromHTTP(response.headers.date);
        setServerTimeSkew(Loadable.of(DateTime.local().diff(serverDate)));
        setStatus(Loadable.of(response.data));
      })
      .catch((response: AxiosResponse) => {
        notifyError(response);
        logout();
        setServerTimeSkew(Loadable.loading());
        setStatus(Loadable.loading());
      });
  }, [token, statusUpdate, logout]);

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
  }, [packUpdate]);

  const isLoggedIn = () => !status.isLoading();
  return (
    <AdminContext.Provider
      value={{
        data: {
          token,
          serverTimeSkew,
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
          uploadPack,
        },
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useActions() {
  const context = useContext(AdminContext);
  return useMemo(() => context.actions, [context.actions]);
}

export function useToken() {
  const context = useContext(AdminContext);
  return useMemo(() => context.data.token, [context.data.token]);
}

export function useStatus() {
  const context = useContext(AdminContext);
  return useMemo(() => context.data.status, [context.data.status]);
}

export function usePack() {
  const context = useContext(AdminContext);
  return useMemo(() => context.data.pack, [context.data.pack]);
}

export function useServerTime() {
  const context = useContext(AdminContext);

  return useMemo(() => () => DateTime.local().minus(context.data.serverTimeSkew.valueOr(Duration.fromMillis(0))), [
    context.data.serverTimeSkew,
  ]);
}
