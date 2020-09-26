import { AxiosResponse } from "axios";
import { useState, useEffect } from "react";
import Loadable from "./Loadable";
import client from "../TerryClient";
import { useToken } from "./AdminContext";
import { notifyError } from "../utils";
import useTriggerUpdate from "../triggerUpdate.hook";

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

export type ReloadUsers = () => void;

export function useUsers(): [Loadable<UsersData>, ReloadUsers] {
  const token = useToken();
  const [users, setUsers] = useState<Loadable<UsersData>>(Loadable.loading());
  const [usersUpdate, triggerUsersUpdate] = useTriggerUpdate();

  useEffect(() => {
    if (!token) return;
    client
      .adminApi(token, "/user_list")
      .then((response: AxiosResponse) => {
        setUsers(Loadable.of(response.data as UsersData));
      })
      .catch((response) => {
        notifyError(response);
        setUsers(Loadable.error(response));
      });
  }, [token, usersUpdate]);

  const reloadUsers = () => {
    triggerUsersUpdate();
  };

  return [users, reloadUsers];
}
