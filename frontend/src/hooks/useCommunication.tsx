import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { t } from "@lingui/macro";
import { AxiosError } from "axios";
import { notifyError } from "src/utils";
import { CommunicationData, Announcement, Question } from "src/types/contest";
import { client } from "src/TerryClient";
import { Loadable } from "src/Loadable";
import { useToken } from "src/contest/ContestContext";
import { useTriggerUpdate } from "./useTriggerUpdate";

const POLL_INTERVAL = 15 * 1000;
const sessionName = "communications";

type CommunicationContextType = {
  announcements: Loadable<Announcement[]>;
  questions: Loadable<Question[]>;
  errored: boolean;
  reload: () => void;
  askQuestion: (question: string) => Promise<Question>;
};

const readStorage = () => {
  const item = window.sessionStorage.getItem(sessionName);
  if (!item) return null;
  return JSON.parse(item) as CommunicationData;
};

const saveStorage = (data: CommunicationData) => {
  const item = JSON.stringify(data);
  window.sessionStorage.setItem(sessionName, item);
};

const defaultContext = () => {
  const storage = readStorage();
  if (!storage) {
    return {
      announcements: Loadable.loading(),
      questions: Loadable.loading(),
      errored: false,
      reload: () => {},
      askQuestion: () => Promise.reject(),
    } as CommunicationContextType;
  }
  return {
    announcements: Loadable.of(storage.announcements),
    questions: Loadable.of(storage.questions),
    errored: false,
    reload: () => {},
    askQuestion: () => Promise.reject(),
  } as CommunicationContextType;
};

export const CommunicationContext = createContext<CommunicationContextType>(defaultContext());

type Props = {
  children: ReactNode;
};

export function CommunicationContextProvider({ children }: Props) {
  const fromStorage = defaultContext();
  const [errored, setErrored] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<Loadable<Announcement[]>>(
    fromStorage.announcements,
  );
  const [questions, setQuestions] = useState<Loadable<Question[]>>(
    fromStorage.questions,
  );
  const [handle, reload] = useTriggerUpdate();
  const token = useToken();

  useEffect(() => {
    const fetchData = () => {
      client.communications
        ?.get("/communications")
        .then((response) => {
          const data = response.data as CommunicationData;
          setAnnouncements(Loadable.of(data.announcements));
          setQuestions(Loadable.of(data.questions || []));
          setErrored(false);
        })
        .catch((response: AxiosError) => {
          notifyError(response);
          setErrored(true);
          // eslint-disable-next-line no-console
          console.error("Failed to load communications", response);
          // the announcements and questions are not reset here, preventing
          // network failures to hide the locally stored backup
        });
    };

    fetchData();
    const interval = setInterval(() => fetchData(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token, handle]);

  const askQuestion = useCallback(
    (question: string) => {
      if (!token) throw new Error("You have to be logged in to ask a question");
      if (!client.communications) return Promise.reject();

      return client.communications
        .post(`/communications`, question)
        .then((response) => {
          reload();
          return response.data;
        })
        .catch((response: AxiosError) => {
          notifyError(response);
          throw response;
        });
    },
    [reload, token],
  );

  return (
    <CommunicationContext.Provider
      value={{
        announcements,
        questions,
        errored,
        reload,
        askQuestion,
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

export function useCommunicationErrored() {
  const context = useContext(CommunicationContext);
  return useMemo(() => context.errored, [context.errored]);
}

export function useReloadCommunication() {
  const context = useContext(CommunicationContext);
  return useMemo(() => context.reload, [context.reload]);
}

export function useAskQuestion() {
  const context = useContext(CommunicationContext);
  return useMemo(() => context.askQuestion, [context.askQuestion]);
}

const notifyNewAnnouncements = (
  oldList: Announcement[],
  newList: Announcement[],
) => {
  newList.forEach((item) => {
    const oldAnn = oldList.find((old) => old.id === item.id);
    let title = null;
    if (!oldAnn) {
      title = t`New announcement: ${item.title}`;
    }
    if (oldAnn && oldAnn.content !== item.content) {
      title = t`Updated announcement: ${item.title}`;
    }

    // old announcement
    if (!title) return;

    // eslint-disable-next-line no-new
    new Notification(title, {
      body: item.content,
      requireInteraction: true,
    });
  });
};

const notifyNewQuestions = (oldList: Question[], newList: Question[]) => {
  newList.forEach((item) => {
    const oldQ = oldList.find((old) => old.id === item.id);
    // new question
    if (!oldQ) return;

    let title = null;
    if (!oldQ.answer && item.answer) {
      title = t`Question answered!`;
    }
    if (oldQ.answer && item.answer && oldQ.answer !== item.answer) {
      title = t`The answer to one of your questions got updated`;
    }

    // no changes
    if (!title) return;

    // eslint-disable-next-line no-new
    new Notification(title, {
      body: item.answer || undefined,
      requireInteraction: true,
    });
  });
};

export function useCommunicationNotifier() {
  const questions = useQuestions();
  const announcements = useAnnouncements();

  useEffect(() => {
    if ("Notification" in window) {
      const { permission } = Notification;
      if (permission !== "granted" && permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (announcements.isReady() && questions.isReady()) {
      const oldDada = readStorage();
      if (oldDada) {
        notifyNewAnnouncements(oldDada.announcements, announcements.value());
        notifyNewQuestions(oldDada.questions || [], questions.value() || []);
      }
      saveStorage({
        announcements: announcements.value(),
        questions: questions.value(),
      });
    }
  }, [questions, announcements]);
}
