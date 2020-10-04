import React, {
  useState, useEffect, createContext, ReactNode, useMemo, useContext,
} from "react";
import { client } from "@terry/shared/_/TerryClient";
import { useToken } from "src/contest/ContestContext";
import { Loadable } from "@terry/shared/_/Loadable";
import { notifyError } from "@terry/shared/_/utils";
import { SubmissionList } from "@terry/shared/_/types/contest";

type TasksSubmissionList = {
  [taskName: string]: Loadable<SubmissionList>;
};

type SubmissionListContextType = {
  list: TasksSubmissionList;
  reloadTask: (taskName: string) => void;
};

export const SubmissionListContext = createContext<SubmissionListContextType>({
  list: {},
  reloadTask: () => {},
});

export function SubmissionListContextProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<TasksSubmissionList>({});
  const [toUpdate, setToUpdate] = useState<string[]>([]);
  const token = useToken();

  useEffect(() => {
    // delay until logged in
    if (!token) {
      if (Object.keys(list).length > 0) {
        setList({});
      }
    }

    const newList = { ...list };
    toUpdate.forEach((taskName) => {
      newList[taskName] = Loadable.loading();
      client.api
        .get(`/user/${token}/submissions/${taskName}`)
        .then((response) => {
          setList({ ...list, [taskName]: Loadable.of(response.data) });
        })
        .catch((response) => {
          notifyError(response);
          setList({ ...list, [taskName]: Loadable.error(response) });
        });
    });
    if (toUpdate.length > 0) {
      setList(newList);
      setToUpdate([]);
    }
  }, [toUpdate, list, token]);

  const reloadTask = (taskName: string) => {
    setToUpdate([...toUpdate, taskName]);
  };

  return (
    <SubmissionListContext.Provider
      value={{
        list,
        reloadTask,
      }}
    >
      {children}
    </SubmissionListContext.Provider>
  );
}

export function useSubmissionList(taskName: string) {
  const context = useContext(SubmissionListContext);
  const list = context.list[taskName];
  useEffect(() => {
    if (!list) {
      context.reloadTask(taskName);
    }
  }, [list, context, taskName]);
  return [
    useMemo(() => list || Loadable.loading(), [list]),
    () => context.reloadTask(taskName),
  ] as const;
}
