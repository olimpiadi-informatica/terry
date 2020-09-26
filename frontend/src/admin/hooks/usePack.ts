import { useContext, useMemo } from "react";
import { PackContext } from "src/admin/PackContext";

export function usePack() {
  const context = useContext(PackContext);
  return useMemo(() => context.pack, [context.pack]);
}
