import * as React from "react";
import { Trans, t } from "@lingui/macro";
import ReactMarkdown from "react-markdown";
import { i18n } from "../i18n";
import { useActions } from "./AdminContext";
import usePack from "./usePack.hook";

export default function AdminLoginView() {
  const tokenRef = React.createRef<HTMLInputElement>();
  const { login } = useActions();
  const pack = usePack().value();

  const doLogin = () => {
    if (tokenRef.current) {
      login(tokenRef.current.value);
    }
  };

  if (!pack.uploaded) {
    throw new Error("AdminLoginView requires the pack to be uploaded");
  }

  return (
    <div className="jumbotron admin-jumbotron">
      <h1 className="text-center display-3">{pack.name}</h1>
      <ReactMarkdown source={pack.description} />
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
