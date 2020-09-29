import { useEffect, useState } from "react";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";
import { useToken } from "src/contest/ContestContext";
import { CommunicationData, Announcement, Question } from "src/contest/types";
import { useTriggerUpdate } from "src/useTriggerUpdate.hook";
import { notifyError } from "src/utils";
import { i18n } from "src/i18n";
import { t } from "@lingui/macro";

const POLL_INTERVAL = 15 * 1000;
const FAST_POLL_INTERVAL = 5 * 1000;

const sessionName = "communications";

const readStorage = () => {
  const item = window.sessionStorage.getItem(sessionName);
  if (!item) return null;
  return JSON.parse(item) as CommunicationData;
};

const saveStorage = (data: CommunicationData) => {
  const item = JSON.stringify(data);
  window.sessionStorage.setItem(sessionName, item);
};

const notifyNewAnnouncements = (oldList: Announcement[], newList: Announcement[]) => {
  newList.forEach((item) => {
    const oldAnn = oldList.find((old) => old.id === item.id);
    let title = null;
    if (!oldAnn) {
      title = i18n._(t`New announcement: ${item.title}`);
    }
    if (oldAnn && oldAnn.content !== item.content) {
      title = i18n._(t`Updated announcement: ${item.title}`);
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
      title = i18n._(t`Question answered!`);
    }
    if (oldQ.answer && item.answer && oldQ.answer.content !== item.answer.content) {
      title = i18n._(t`The answer to one of your questions got updated`);
    }

    // no changes
    if (!title) return;

    // eslint-disable-next-line no-new
    new Notification(title, {
      body: item.answer?.content,
      requireInteraction: true,
    });
  });
};

export function useCommunicationPoller() {
  const token = useToken();

  useEffect(() => {
    if ("Notification" in window) {
      const { permission } = Notification;
      if (permission !== "granted" && permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!client.communications) return () => {};

    const fetchData = () => {
      client.communications
        ?.get(token ? `/communications/${token}` : "/communications")
        .then((response) => {
          const data = response.data as CommunicationData;
          const oldDada = readStorage();
          if (oldDada) {
            notifyNewAnnouncements(oldDada.announcements, data.announcements);
            notifyNewQuestions(oldDada.questions || [], data.questions || []);
          }
          saveStorage(data);
        });
    };

    fetchData();
    const interval = setInterval(() => fetchData(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token]);
}

export function useCommunication() {
  const defaultValue = readStorage();
  const [announcements, setAnnouncements] = useState<Loadable<Announcement[]>>(
    defaultValue ? Loadable.of(defaultValue.announcements) : Loadable.loading(),
  );
  const [questions, setQuestions] = useState<Loadable<Question[]>>(
    defaultValue ? Loadable.of(defaultValue.questions || []) : Loadable.loading(),
  );
  const [reloadHandle, reload] = useTriggerUpdate();
  const token = useToken();

  useEffect(() => {
    if (!client.communications) return () => {};

    const fetchData = () => {
      client.communications
        ?.get(token ? `/communications/${token}` : "/communications")
        .then((response) => {
          const data = response.data as CommunicationData;
          setAnnouncements(Loadable.of(data.announcements));
          setQuestions(Loadable.of(data.questions || []));
        })
        .catch((response) => {
          // eslint-disable-next-line no-console
          console.error("Failed to load communications", response);
          // not resetting the Loadable here allows the contestant to see the announcements even under network errors
        });
    };

    fetchData();
    const interval = setInterval(() => fetchData(), FAST_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token, reloadHandle]);

  const askQuestion = (question: string) => {
    if (!token) throw new Error("You have to be logged in to ask a question");
    if (!client.communications) return Promise.reject();

    return client.communications
      .post(`/communications/${token}`, { content: question })
      .then(() => reload())
      .catch((response) => {
        notifyError(response);
        throw response;
      });
  };

  return [announcements, questions, askQuestion] as const;
}
