/* eslint-disable no-console */
import { useMemo, useEffect } from "react";
import client from "../../TerryClient";
import { useToken } from "../ContestContext";

const DETECT_INTERNET_TEST_ENDPOINT = process.env.REACT_APP_DETECT_INTERNET_TEST_ENDPOINT || null;
const DETECT_INTERNET_TEST_CONTENT = process.env.REACT_APP_DETECT_INTERNET_TEST_CONTENT || null;
const DETECT_INTERNET_INTERVAL = 10 * 60 * 1000;

export function useDetectInternet() {
  const token = useToken();
  const detectInternet = useMemo(
    () => async (endpoint: string) => {
      if (!token) return;
      console.log(`Testing internet connection (${DETECT_INTERNET_TEST_ENDPOINT})...`);
      try {
        const res = await fetch(endpoint, {
          mode: "no-cors",
        });
        const content = await res.text();
        if (content !== DETECT_INTERNET_TEST_CONTENT) {
          console.log(`Invalid content ${content}`);
        }
      } catch (e) {
        console.log(`No internet connection (${e})`);
        return;
      }
      console.log(`Internet connection detected. Reporting.`);

      const data = new FormData();

      data.append("token", token);

      await client.api.post("/internet_detected", data);
    },
    [token],
  );

  useEffect(() => {
    if (!DETECT_INTERNET_TEST_ENDPOINT) return () => {};

    const interval = setInterval(() => detectInternet(DETECT_INTERNET_TEST_ENDPOINT), DETECT_INTERNET_INTERVAL);
    return () => clearInterval(interval);
  }, [detectInternet]);
}
