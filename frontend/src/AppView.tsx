import * as React from "react";
import ContestView from "./contest/ContestView";
import { ContestContextProvider } from "./contest/ContestContext";

function AppViewInternal() {
  // TODO: is the pack is not uploaded, redirect to /admin
  return <ContestView />;
}

export default function AppView() {
  return (
    <ContestContextProvider>
      <AppViewInternal />
    </ContestContextProvider>
  );
}
