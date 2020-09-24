import * as React from "react";
import { Model } from "./user.models";
import PromiseView from "../PromiseView";
import { Trans, t } from "@lingui/macro";
import { i18n } from "../i18n";

type Props = {
  model: Model;
};

export default class LoginView extends React.Component<Props> {
  tokenRef: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);
    this.tokenRef = React.createRef();
  }

  componentDidMount() {
    this.props.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.model.popObserver(this);
  }

  login() {
    this.props.model.login(this.tokenRef.current!.value);
  }

  render() {
    return (
      <div className="jumbotron">
        <h1 className={"text-center"}>
          <Trans>Please login</Trans>
        </h1>
        <form
          action=""
          onSubmit={(e) => {
            e.preventDefault();
            this.login();
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
              ref={this.tokenRef}
              className="form-control text-center"
              required
              placeholder={i18n._(t`Token`)}
              type="text"
            />
          </div>
          <input type="submit" className="btn btn-primary" value={i18n._(t`Login`)} />
          {this.props.model.lastLoginAttempt && (
            <PromiseView
              promise={this.props.model.lastLoginAttempt}
              renderPending={() => (
                <span>
                  <Trans>Loading...</Trans>
                </span>
              )}
              renderRejected={(error) => (
                <div className="alert alert-danger" role="alert">
                  <strong>
                    <Trans>Error</Trans>
                  </strong>{" "}
                  {error.response && error.response.data.message}
                </div>
              )}
              renderFulfilled={() => null}
            />
          )}
        </form>
      </div>
    );
  }
}
