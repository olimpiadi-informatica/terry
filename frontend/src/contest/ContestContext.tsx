import React, {
  ReactNode,
  useState,
  createContext,
  useContext,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Duration, DateTime } from "luxon";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";
import { useTriggerUpdate } from "src/hooks/useTriggerUpdate";
import { Status } from "src/types/contest";
import { CommunicationContextProvider } from "src/hooks/useCommunication";
import { Loading } from "src/components/Loading";
import { notifyError } from "src/utils";
import { SubmissionListContextProvider } from "./hooks/useSubmissionList";

export type ContextData = {
  serverTimeSkew: Loadable<Duration>;
  status: Loadable<Status>;
};

export type ContextActions = {
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadContest: () => void;
};

type ContestContextType = {
  data: ContextData;
  actions: ContextActions;
};

export const ContestContext = createContext<ContestContextType>({
  data: {
    serverTimeSkew: Loadable.loading(),
    status: Loadable.loading(),
  },
  actions: {
    login: () => Promise.reject(),
    logout: () => Promise.reject(),
    reloadContest: () => {},
  },
});

type ContestContextProps = {
  children: ReactNode;
};

export function ContestContextProvider({ children }: ContestContextProps) {
  const [serverTimeSkew, setServerTimeSkew] = useState<Loadable<Duration>>(
    Loadable.loading(),
  );
  const [status, setStatus] = useState<Loadable<Status>>(Loadable.loading());
  const [reloadContestHandle, reloadContest] = useTriggerUpdate();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    await client.api.post("/logout");
    reloadContest();
    navigate("/");
  }, [navigate, reloadContest]);

  const login = useCallback(
    async (token: string) => {
      await client.api
        .post("/login", token)
        .catch((e: AxiosError) => notifyError(e));
      reloadContest();
    },
    [reloadContest],
  );

  useEffect(() => {
    setStatus(Loadable.loading());
    client.api
      .get("/status")
      .then((resp) => {
        const serverDate = DateTime.fromHTTP(resp.headers.date);
        setServerTimeSkew(Loadable.of(DateTime.local().diff(serverDate)));
        setStatus(Loadable.of(resp.data));
      })
      .catch((error) => {
        setServerTimeSkew(Loadable.loading());
        setStatus(Loadable.error(error));
      });
  }, [reloadContestHandle]);

  if (status.isLoading()) {
    return <Loading />;
  }

  return (
    <ContestContext.Provider
      value={{
        data: {
          serverTimeSkew,
          status,
        },
        actions: {
          login,
          logout,
          reloadContest,
        },
      }}
    >
      <CommunicationContextProvider>
        <SubmissionListContextProvider>
          {children}
        </SubmissionListContextProvider>
      </CommunicationContextProvider>
    </ContestContext.Provider>
  );
}

export function useActions() {
  const context = useContext(ContestContext);
  return useMemo(() => context.actions, [context.actions]);
}

export function useStatus() {
  const context = useContext(ContestContext);
  return useMemo(() => context.data.status, [context.data.status]);
}

export function useIsAdmin() {
  const context = useContext(ContestContext);
  return useMemo(
    () => context.data.status.isReady()
      && context.data.status.value().user?.role === "Admin",
    [context.data.status],
  );
}

export function useToken() {
  const context = useContext(ContestContext);
  return useMemo(
    () => (context.data.status.isReady()
      ? context.data.status.value().user?.token
      : null),
    [context.data.status],
  );
}

export function useServerTime() {
  const context = useContext(ContestContext);

  return useMemo(
    () => () => DateTime.local().minus(
      context.data.serverTimeSkew.valueOr(Duration.fromMillis(0)),
    ),
    [context.data.serverTimeSkew],
  );
}
