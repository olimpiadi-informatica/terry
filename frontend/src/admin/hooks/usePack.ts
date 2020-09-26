import { useContext, useMemo } from "react";
import { PackContext } from "../PackContext";

export function usePack() {
  const context = useContext(PackContext);
  return useMemo(() => context.pack, [context.pack]);
}
