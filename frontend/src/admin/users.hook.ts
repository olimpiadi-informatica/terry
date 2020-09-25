import Loadable from "./Loadable";
import client from "../TerryClient";
import { AxiosResponse } from "axios";
import { useState, useEffect } from "react";
import { useToken } from "./AdminContext";
import { notifyError } from "../utils";

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
  const [count, setCount] = useState(0);

  // handle the users
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
  }, [token, count]);

  const reloadUsers = () => {
    setCount(count + 1);
  };

  return [users, reloadUsers];
}
