import { useState, useEffect } from "react";
import Loadable from "../Loadable";
import client from "../TerryClient";

export default function useStatement(path: string) {
  const [statement, setStatement] = useState<Loadable<string>>(Loadable.loading());
  useEffect(() => {
    client.statements
      .get(path)
      .then((response) => {
        setStatement(Loadable.of(response.data));
      })
      .catch((response) => {
        setStatement(Loadable.error(response));
      });
  }, [path]);

  return statement;
}
