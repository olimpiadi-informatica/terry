import * as React from "react";
import { AdminSession } from "./admin.models";
import { Trans, t } from "@lingui/macro";
import { i18n } from "./i18n";

const ReactMarkdown = require("react-markdown");

type Props = {
  session: AdminSession;
  pack: { data: { deletable: boolean; name: string; description: string } };
};

export default class AdminLoginView extends React.Component<Props> {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  login() {
    const token = (this.refs.form as any).token.value;
    this.props.session.login(token);
  }

  render() {
    return (
      <div className="jumbotron admin-jumbotron">
        <h1 className="text-center display-3">{this.props.pack.data.name}</h1>
        <ReactMarkdown source={this.props.pack.data.description} />
        <hr />
        <h2 className="text-center">
          <Trans>Log in</Trans>
        </h2>
        <form
          ref="form"
          action=""
          onSubmit={(e) => {
            e.preventDefault();
            this.login();
          }}
        >
          <div className="form-group">
            <label htmlFor="token" className="sr-only">
              <Trans>Admin token</Trans>
            </label>
            <input
              name="token"
              id="token"
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
}
