import { useState, useMemo } from "react";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export function useLogin(cookieName: string) {
  const tokenFromCookie = cookies.get(cookieName);
  const [token, setToken] = useState<string | null>(tokenFromCookie || null);
  const login = useMemo(
    () => (token: string) => {
      cookies.set(cookieName, token);
      setToken(token);
    },
    [cookieName]
  );
  const logout = useMemo(
    () => () => {
      cookies.remove(cookieName);
      setToken(null);
    },
    [cookieName]
  );

  return [token, login, logout] as const;
}
