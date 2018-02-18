import React, { Component } from 'react';
import ContestView from './ContestView';
import LoginView from './LoginView';
import Model from './Model';
import {translateComponent} from "./utils";
import LoadingView from "./LoadingView";

class AppView extends Component {
  constructor(props) {
    super(props);

    this.model = new Model();
  }

  componentWillMount() {
    this.model.onAppStart();
  }

  componentDidMount() {
    this.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
  }

  renderError() {
    const { t } = this.props;
    return <div className="alert alert-danger" role="alert">
      <h4 className="alert-heading">{t("error")}</h4>
      <p>{t("reload")}</p>
    </div>
  }

  render() {
    if (this.model.isUserLoading()) return <LoadingView />;
    if (!this.model.isLoggedIn()) return <LoginView model={this.model}/>;
    if (!this.model.isUserLoaded()) return this.renderError();

    return <ContestView model={this.model}/>;
  }
}

export default translateComponent(AppView);
