import * as React from "react";
import ContestView from "./contest/ContestView";
import { Model } from "./contest/user.models";
import { ContestContextProvider } from "./contest/ContestContext";

function AppViewInternal() {
  const model = new Model();
  model.onAppStart();
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
