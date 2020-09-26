import * as React from "react";
import { Trans } from "@lingui/macro";
import { Redirect } from "react-router-dom";
import { ContestView } from "./contest/ContestView";
import { ContestContextProvider } from "./contest/ContestContext";
import { PackContextProvider } from "./admin/PackContext";
import { usePack } from "./admin/hooks/usePack";
import Loading from "./Loading";

function AppViewInternal() {
  const pack = usePack();
  if (pack.isLoading()) return <Loading />;
  if (pack.isError()) return <Trans>Error</Trans>;
  if (pack.value().uploaded) return <ContestView />;
  return <Redirect to="/admin" />;
}

export default function AppView() {
  return (
    <PackContextProvider>
      <ContestContextProvider>
        <AppViewInternal />
      </ContestContextProvider>
    </PackContextProvider>
  );
}
