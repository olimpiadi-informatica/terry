import { useCallback } from "react";
import { useCookies } from "react-cookie";

export function useLogin(cookieName: string) {
  const [cookies, setCookie, removeCookie] = useCookies([cookieName]);
  const login = useCallback(
    (newToken: string) => {
      setCookie(cookieName, newToken, { path: "/" });
    },
    [cookieName, setCookie],
  );
  const logout = useCallback(
    () => {
      removeCookie(cookieName, { path: "/" });
    },
    [cookieName, removeCookie],
  );

  return [cookies[cookieName], login, logout] as const;
}
