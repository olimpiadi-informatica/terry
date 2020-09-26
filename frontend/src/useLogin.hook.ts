import { useState, useMemo } from "react";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function useLogin(cookieName: string) {
  const tokenFromCookie = cookies.get(cookieName);
  const [token, setToken] = useState<string | null>(tokenFromCookie || null);
  const login = useMemo(
    () => (newToken: string) => {
      cookies.set(cookieName, newToken);
      setToken(newToken);
    },
    [cookieName],
  );
  const logout = useMemo(
    () => () => {
      cookies.remove(cookieName);
      setToken(null);
    },
    [cookieName],
  );

  return [token, login, logout] as const;
}
