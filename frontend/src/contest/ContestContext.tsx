import React, { ReactNode, useState, createContext, useContext, useMemo, useEffect } from "react";
import { useLogin } from "../useLogin.hook";
import Loadable from "../admin/Loadable";
import client from "../TerryClient";
import { notifyError } from "../utils";
import { Duration, DateTime } from "luxon";
import { AxiosError } from "axios";

export type NotStartedContestData = {
  name: string;
  description: string;
  has_started: false;
};

export type TaskData = {
  name: string;
  title: string;
  max_score: number;
  statement_path: string;
};

export type StartedContestData = {
  name: string;
  description: string;
  has_started: true;
  start_time: string;
  max_total_score: number;
  tasks: TaskData[];
};

export type UserData = {
  name: string;
  surname: string;
  token: string;
  sso_user: number;
  contest_start_delay: number | null;
};

export type CurrentInput = {
  id: string;
  attempt: number;
  date: number;
  path: string;
  size: number;
  task: string;
  token: string;
};

export type UserTaskData = {
  name: string;
  score: number;
  current_input: CurrentInput | null;
};

export type NotStartedContest = {
  contest: NotStartedContestData;
} & UserData;

export type StartedContest = {
  contest: StartedContestData;
  end_time: string;
  total_score: number;
  tasks: { [name: string]: UserTaskData };
} & UserData;

export type ContestData = NotStartedContest | StartedContest;

export type ContextData = {
  token: string | null;
  serverTimeSkew: Loadable<Duration>;
  contest: Loadable<ContestData, AxiosError>;
};

export type ContextActions = {
  isLoggedIn: () => boolean;
  login: (token: string) => void;
  logout: () => void;
};

type ContestContextType = {
  data: ContextData;
  actions: ContextActions;
};

export const ContestContext = createContext<ContestContextType>({
  data: {
    token: null,
    serverTimeSkew: Loadable.loading(),
    contest: Loadable.loading(),
  },
  actions: {
    isLoggedIn: () => false,
    login: () => {},
    logout: () => {},
  },
});

type ContestContextProps = {
  children: ReactNode;
};

export function ContestContextProvider({ children }: ContestContextProps) {
  const cookieName = "userToken";
  const [token, login, logout] = useLogin(cookieName);
  const [serverTimeSkew, setServerTimeSkew] = useState<Loadable<Duration>>(Loadable.loading());
  const [contest, setContest] = useState<Loadable<ContestData, AxiosError>>(Loadable.loading());

  useEffect(() => {
    if (!token) {
      setServerTimeSkew(Loadable.loading());
      setContest(Loadable.loading());
      return;
    }
    client.api
      .get("/user/" + token)
      .then((response) => {
        const serverDate = DateTime.fromHTTP(response.headers["date"]);
        setServerTimeSkew(Loadable.of(DateTime.local().diff(serverDate)));
        setContest(Loadable.of(response.data));
      })
      .catch((response) => {
        logout();
        setServerTimeSkew(Loadable.loading());
        setContest(Loadable.error(response));
      });
  }, [token, logout]);

  const isLoggedIn = () => token !== null && contest.isReady();

  return (
    <ContestContext.Provider
      value={{
        data: {
          token,
          serverTimeSkew,
          contest,
        },
        actions: {
          isLoggedIn,
          login,
          logout,
        },
      }}
    >
      {children}
    </ContestContext.Provider>
  );
}

export function useActions() {
  const context = useContext(ContestContext);
  return useMemo(() => {
    return context.actions;
  }, [context.actions]);
}

export function useToken() {
  const context = useContext(ContestContext);
  return useMemo(() => {
    return context.data.token;
  }, [context.data.token]);
}

export function useContest() {
  const context = useContext(ContestContext);
  return useMemo(() => {
    return context.data.contest;
  }, [context.data.contest]);
}

export function useServerTime() {
  const context = useContext(ContestContext);

  return useMemo(() => {
    return () => DateTime.local().minus(context.data.serverTimeSkew.valueOr(Duration.fromMillis(0)));
  }, [context.data.serverTimeSkew]);
}
