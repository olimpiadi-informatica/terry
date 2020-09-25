import * as React from "react";
import { AdminSession } from "./admin.models";
import { Trans, t } from "@lingui/macro";
import { i18n } from "../i18n";

import ReactMarkdown from "react-markdown";
import { useActions } from "./AdminContext";

type Props = {
  session: AdminSession;
  pack: { data: { deletable: boolean; name: string; description: string } };
};

export default function AdminLoginView({ session, pack }: Props) {
  const tokenRef = React.createRef<HTMLInputElement>();
  const { login } = useActions();
  const doLogin = () => {
    if (tokenRef.current) {
      session.login(tokenRef.current.value);
      login(tokenRef.current.value);
    }
  };

  return (
    <div className="jumbotron admin-jumbotron">
      <h1 className="text-center display-3">{pack.data.name}</h1>
      <ReactMarkdown source={pack.data.description} />
      <hr />
      <h2 className="text-center">
        <Trans>Log in</Trans>
      </h2>
      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          doLogin();
        }}
      >
        <div className="form-group">
          <label htmlFor="token" className="sr-only">
            <Trans>Admin token</Trans>
          </label>
          <input
            name="token"
            id="token"
            ref={tokenRef}
            className="form-control text-center"
            required
            placeholder={i18n._(t`Admin token`)}
          />
        </div>
        <input type="submit" className="btn btn-danger" value={i18n._(t`Login`)} />
      </form>
    </div>
  );
}
