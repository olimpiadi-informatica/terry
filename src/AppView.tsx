import * as React from "react";
import { Redirect, RouteComponentProps } from "react-router-dom";
import client from "./TerryClient";
import ContestView from "./ContestView";
import { translateComponent } from "./utils";
import LoadingView from "./LoadingView";
import PromiseView from "./PromiseView";
import { Model } from "./user.models";
import ObservablePromise from "./ObservablePromise";
import { WithTranslation } from "react-i18next";

type Props = WithTranslation & RouteComponentProps<any>;

class AppView extends React.Component<Props> {
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
    const { t } = this.props;
    if (this.model.isLoggedIn()) {
      return (
        this.model.userStatePromise && (
          <PromiseView
            promise={this.model.userStatePromise}
            renderPending={() => <LoadingView />}
            renderFulfilled={(userState) => <ContestView {...this.props} model={this.model} userState={userState} />}
            renderRejected={(_error) => (
              <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">{t("error")}</h4>
                <p>{t("reload")}</p>
              </div>
            )}
          />
        )
      );
    } else {
      return (
        <PromiseView
          promise={new ObservablePromise(client.api("/admin/pack_status"))}
          renderPending={() => <LoadingView />}
          renderFulfilled={(response) => {
            if (response.data.uploaded)
              return (
                // <LoginView {...this.props} model={this.model} />
                <ContestView {...this.props} model={this.model} userState={null} />
              );
            else return <Redirect to="/admin" />;
          }}
          renderRejected={(_error) => (
            // <LoginView {...this.props} model={this.model} />
            <ContestView {...this.props} model={this.model} userState={null} />
          )}
        />
      );
    }
  }
}

export default translateComponent(AppView);
