import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'
import client from './TerryClient'
import ContestView from './ContestView';
import LoginView from './LoginView';
import { translateComponent } from "./utils";
import LoadingView from "./LoadingView";
import PromiseView from './PromiseView';
import { Model } from './user.models';
import ObservablePromise from './ObservablePromise';

class AppView extends Component {
  constructor(props) {
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
      return <PromiseView promise={this.model.userStatePromise}
        renderPending={() => <LoadingView />}
        renderFulfilled={(userState) => <ContestView model={this.model} userState={userState} />}
        renderRejected={(error) => <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">{t("error")}</h4>
          <p>{t("reload")}</p>
        </div>}
      />;
    } else {
      return <PromiseView promise={new ObservablePromise(client.api("/admin/pack_status"))}
        renderPending={() => <LoadingView />}
        renderFulfilled={(response) => {
          if (response.data.uploaded)
            return <LoginView model={this.model} />
          else
            return <Redirect to='/admin' />
        }}
        renderRejected={(error) => <LoginView model={this.model} />}
      />;
    }
  }
}

export default translateComponent(AppView)
