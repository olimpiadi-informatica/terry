import React, { Component } from 'react';
import ContestView from './ContestView';
import LoginView from './LoginView';
import {translateComponent} from "./utils";
import LoadingView from "./LoadingView";
import PromiseView from './PromiseView';
import { Model } from './user.models';

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
    if (!this.model.isLoggedIn()) return <LoginView model={this.model}/>;

    return <PromiseView promise={this.model.userStatePromise}
      renderPending={() => <LoadingView />}
      renderFulfilled={(userState) => <ContestView model={this.model} userState={userState}/>}
      renderError={(error) => <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">{t("error")}</h4>
        <p>{t("reload")}</p>
      </div>}
    />;
  }
}

export default translateComponent(AppView);
