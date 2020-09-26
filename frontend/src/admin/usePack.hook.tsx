import React, {
  useState, useEffect, createContext, ReactNode, useContext, useMemo,
} from "react";
import client from "../TerryClient";
import Loadable from "../Loadable";
import useTriggerUpdate from "../useTriggerUpdate.hook";
import { notifyError } from "../utils";

export type Pack =
  | { uploaded: false }
  | {
      uploaded: true;
      deletable: boolean;
      name: string;
      description: string;
    };

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

  return (
    <PackContext.Provider value={{ pack, reloadPack }}>
      {children}
    </PackContext.Provider>
  );
}

export default function usePack() {
  const context = useContext(PackContext);
  return useMemo(() => context.pack, [context.pack]);
}
