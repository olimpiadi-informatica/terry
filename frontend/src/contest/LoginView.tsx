import React, { createRef, useState } from "react";
import { Trans, t } from "@lingui/macro";
import { i18n } from "src/i18n";
import { Loading } from "src/components/Loading";
import { usePack } from "src/admin/hooks/usePack";
import { Markdown } from "src/components/Markdown";
import { Error } from "src/components/Error";
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
            <Markdown source={pack.description} />
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
          {contest.isError() && <Error className="mt-2" cause={contest.error()} />}
          {isLoading && <Loading />}
        </form>
      </div>
    </>
  );
}
