import React from "react";
import Loading from "../Loading";
import { UploadPackView } from "./UploadPackView";
import { AdminView } from "./AdminView";
import { AdminContextProvider } from "./AdminContext";
import { usePack } from "./hooks/usePack";
import { PackContextProvider } from "./PackContext";

function PackViewInner() {
  const pack = usePack();
  if (pack.isLoading()) return <Loading />;
  if (pack.isError()) {
    return (
      <p>
        An error occurred:
        {pack.error()}
      </p>
    );
  }

  if (pack.value().uploaded) {
    return <AdminView />;
  }
  return <UploadPackView />;
}

export function PackView() {
  return (
    <PackContextProvider>
      <AdminContextProvider>
        <PackViewInner />
      </AdminContextProvider>
    </PackContextProvider>
  );
}
