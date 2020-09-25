import * as React from "react";
import { Redirect, RouteComponentProps } from "react-router-dom";
import client from "./TerryClient";
import ContestView from "./contest/ContestView";
import Loading from "./Loading";
import PromiseView from "./PromiseView";
import { Model } from "./contest/user.models";
import ObservablePromise from "./ObservablePromise";
import { Trans } from "@lingui/macro";

type Props = RouteComponentProps<any>;

export default class AppView extends React.Component<Props> {
  model: Model;

  constructor(props: Props) {
    super(props);

    this.model = new Model();
    this.model.onAppStart();
  }

  componentDidMount() {
    this.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
  }

  render() {
    if (this.model.isLoggedIn()) {
      return (
        this.model.userStatePromise && (
          <PromiseView
            promise={this.model.userStatePromise}
            renderPending={() => <Loading />}
            renderFulfilled={(userState) => <ContestView {...this.props} model={this.model} userState={userState} />}
            renderRejected={(_error) => (
              <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">
                  <Trans>Error</Trans>
                </h4>
                <p>
                  <Trans>Reload</Trans>
                </p>
              </div>
            )}
          />
        )
      );
    } else {
      return (
        <PromiseView
          promise={new ObservablePromise(client.api("/admin/pack_status"))}
          renderPending={() => <Loading />}
          renderFulfilled={(response) => {
            if (response.data.uploaded) return <ContestView {...this.props} model={this.model} userState={null} />;
            else return <Redirect to="/admin" />;
          }}
          renderRejected={(_error) => <ContestView {...this.props} model={this.model} userState={null} />}
        />
      );
    }
  }
}
