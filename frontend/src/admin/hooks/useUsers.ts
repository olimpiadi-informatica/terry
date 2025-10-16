import { useState, useEffect } from "react";
import { client } from "src/TerryClient";
import { notifyError } from "src/utils";
import { AxiosError } from "axios";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  total_score: number;
  scores: Record<string, number>;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    client
      .adminApi("user_list")
      .then((response) => {
        setUsers(response.data.items);
      })
      .catch((error: AxiosError) => {
        notifyError(error);
      });
  }, []);

  return users;
}
