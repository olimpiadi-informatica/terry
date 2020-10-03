import { useState, useEffect, useMemo } from "react";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";

export function useStatement(path: string) {
  const [statement, setStatement] = useState<Loadable<string>>(Loadable.loading());

  // This is a hack that forces the statement to be immediately discarded if the path changes: without this the old
  // statement is returned, used and drawn under the context of the other task. This cause the old images to be loaded
  // using the base uri of the new task.
  useMemo(() => {
    if (!statement.isLoading()) {
      setStatement(Loadable.loading());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

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
