import { AxiosResponse } from "axios";
import { useState, useEffect } from "react";
import { Loadable } from "@terry/shared/_/Loadable";
import { client } from "@terry/shared/_/TerryClient";
import { useToken } from "src/admin/AdminContext";
import { notifyError } from "@terry/shared/_/utils";
import { useTriggerUpdate } from "@terry/shared/_/hooks/useTriggerUpdate";
import { UsersData } from "@terry/shared/_/types/admin";

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