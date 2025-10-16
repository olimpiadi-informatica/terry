import React, { createRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Trans, t } from "@lingui/macro";
import { Loading } from "src/components/Loading";
import { Error } from "src/components/Error";
import { Markdown } from "src/components/Markdown";
import { useActions, useStatus, useToken } from "./ContestContext";

export function LoginView() {
  const tokenRef = createRef<HTMLInputElement>();
  const { login } = useActions();
  const status = useStatus();
  const token = useToken();
  const [isLoading, setIsLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const doLogin = () => {
    if (!tokenRef.current) return;
    setIsLoading(true);
    login(tokenRef.current.value).finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <>
      {status.isReady() && (
        <div>
          <h1>{status.value().contest.name}</h1>
          <Markdown source={status.value().contest.description} />
          <hr />
        </div>
      )}
      <div className="jumbotron">
        <h1 className="text-center">
          <Trans>Please login</Trans>
        </h1>
        <form
          action=""
          onSubmit={(e) => {
            e.preventDefault();
            doLogin();
          }}
        >
          <div className="form-group">
            <label htmlFor="token" className="sr-only">
              <Trans>Token</Trans>
            </label>
            <input
              autoComplete="off"
              name="token"
              id="token"
              ref={tokenRef}
              className="form-control text-center"
              required
              placeholder={t`Token`}
              type="text"
            />
          </div>
          <input type="submit" className="btn btn-primary" value={t`Login`} />
          {status.isError() && (
            <Error className="mt-2" cause={status.error()} />
          )}
          {isLoading && <Loading />}
        </form>
      </div>
    </>
  );
}
