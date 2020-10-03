import React, { createRef, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { i18n } from "@terry/shared/_/i18n";
import { Loading } from "src/Loading";
import ReactMarkdown from "react-markdown";
import { usePack } from "src/admin/hooks/usePack";
import { useActions, useContest } from "./ContestContext";

export function LoginView() {
  const tokenRef = createRef<HTMLInputElement>();
  const { login } = useActions();
  const contest = useContest();
  const pack = usePack().value();
  const [isLoading, setIsLoading] = useState(false);

  const doLogin = () => {
    if (!tokenRef.current) return;
    setIsLoading(true);
    login(tokenRef.current.value);
  };

  return (
    <>
      {
        pack && pack.uploaded && (
          <div>
            <h1>{pack.name}</h1>
            <ReactMarkdown source={pack.description} />
            <hr />
          </div>
        )
      }
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
              placeholder={i18n._(t`Token`)}
              type="text"
            />
          </div>
          <input type="submit" className="btn btn-primary" value={i18n._(t`Login`)} />
          {contest.isError() && (
            <div className="alert alert-danger mt-2" role="alert">
              <strong>
                <Trans>Error</Trans>
              </strong>
              {" "}
              {contest.error().response?.data.message}
            </div>
          )}
          {isLoading && <Loading />}
        </form>
      </div>
    </>
  );
}
