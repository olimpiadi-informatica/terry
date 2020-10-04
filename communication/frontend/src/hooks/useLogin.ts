import { useState } from "react";
import { useHistory } from "react-router-dom";

const sessionName = "communicationAdminToken";

export function useLogin() {
  const fromStorage = window.sessionStorage.getItem(sessionName);
  const [token, setToken] = useState(fromStorage);
  const history = useHistory();

  const login = (newToken: string) => {
    if (!newToken) return;
    window.sessionStorage.setItem(sessionName, newToken);
    setToken(newToken);
    history.push("/");
  };
  const logout = () => {
    window.sessionStorage.removeItem(sessionName);
    setToken(null);
    history.push("/login");
  };

  return [token, login, logout] as const;
}
