import React, {
  createContext, ReactNode, useContext, useEffect, useMemo, useState,
} from "react";
import { CommunicationData, Announcement, Question } from "src/terry-frontend/types";
import { Loadable } from "src/terry-frontend/Loadable";
import { client } from "src/terry-frontend/TerryClient";
import { notifyError } from "src/terry-frontend/utils";
import { useTriggerUpdate } from "src/terry-frontend/useTriggerUpdate.hook";
import { useLogin } from "./useLogin";

const POLL_INTERVAL = 15 * 1000;

type CommunicationContextType = {
  announcements: Loadable<Announcement[]>;
  questions: Loadable<Question[]>;
  reload: () => void;
}

export const CommunicationContext = createContext<CommunicationContextType>({
  announcements: Loadable.loading(),
  questions: Loadable.loading(),
  reload: () => {},
});

export function CommunicationContextProvider({ children }: {children: ReactNode}) {
  const [announcements, setAnnouncements] = useState<Loadable<Announcement[]>>(Loadable.loading());
  const [questions, setQuestions] = useState<Loadable<Question[]>>(Loadable.loading());
  const [token] = useLogin();
  const [handle, reload] = useTriggerUpdate();

  useEffect(() => {
    if (!client.communications) throw new Error("The communication must be enabled");

    const fetchData = () => {
      client.communications
        ?.get(`/communications/${token}`)
        .then((response) => {
          const data = response.data as CommunicationData;
          setAnnouncements(Loadable.of(data.announcements));
          setQuestions(Loadable.of(data.questions || []));
        })
        .catch((response) => {
          notifyError(response);
          // eslint-disable-next-line no-console
          console.error("Failed to load communications", response);
        });
    };

    fetchData();
    const interval = setInterval(() => fetchData(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token, handle]);

  return (
    <CommunicationContext.Provider value={{
      announcements,
      questions,
      reload,
    }}
    >
      {children}
    </CommunicationContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(CommunicationContext);
  return useMemo(() => context.announcements, [context.announcements]);
}

export function useQuestions() {
  const context = useContext(CommunicationContext);
  return useMemo(() => context.questions, [context.questions]);
}

export function useReloadCommunication() {
  const context = useContext(CommunicationContext);
  return useMemo(() => context.reload, [context.reload]);
}
