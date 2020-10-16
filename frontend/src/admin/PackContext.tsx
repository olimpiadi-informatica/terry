import React, {
  useState, useEffect, createContext, ReactNode,
} from "react";
import { client } from "src/TerryClient";
import { Loadable } from "src/Loadable";
import { useTriggerUpdate } from "src/hooks/useTriggerUpdate";
import { notifyError } from "src/utils";
import { Pack } from "src/types/admin";

type PackContextType = {
  pack: Loadable<Pack>;
  reloadPack: () => void;
};

export const PackContext = createContext<PackContextType>({
  pack: Loadable.loading(),
  reloadPack: () => {},
});

export function PackContextProvider({ children }: { children: ReactNode }) {
  const [pack, setPack] = useState<Loadable<Pack>>(Loadable.loading());
  const [packUpdate, reloadPack] = useTriggerUpdate();

  useEffect(() => {
    client
      .api("/admin/pack_status")
      .then((response) => {
        setPack(Loadable.of(response.data as Pack));
      })
      .catch((response) => {
        notifyError(response);
        setPack(Loadable.error(response));
      });
  }, [packUpdate]);

  return <PackContext.Provider value={{ pack, reloadPack }}>{children}</PackContext.Provider>;
}
