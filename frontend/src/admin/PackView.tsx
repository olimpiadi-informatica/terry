import React from "react";
import Loading from "../Loading";
import UploadPackView from "./UploadPackView";
import AdminView from "./AdminView";
import { AdminContextProvider, usePack } from "./AdminContext";

function PackViewInner() {
  const pack = usePack();

  if (pack.isLoading()) return <Loading />;
  // FIXME: use a proper ErrorView or similar
  if (pack.isError()) return <p>An error occurred: {pack.error()}</p>;

  if (pack.value().uploaded) {
    return <AdminView />;
  } else {
    // return <UploadPackView />;
    throw new Error("TODO");
  }
}

export default function PackView() {
  return (
    <AdminContextProvider>
      <PackViewInner />
    </AdminContextProvider>
  );
}
