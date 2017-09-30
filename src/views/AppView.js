import React, { Component } from 'react';
import ContestView from './ContestView';
import LoginView from './LoginView';
import Model from '../models/Model';
import {translateComponent} from "../utils";

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
    this.model.getContest().pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
    this.model.getContest().popObserver(this);
  }

  renderLoading() {
    return <div className="sk-folding-cube">
      <div className="sk-cube1 sk-cube"></div>
      <div className="sk-cube2 sk-cube"></div>
      <div className="sk-cube4 sk-cube"></div>
      <div className="sk-cube3 sk-cube"></div>
    </div>
  }

  renderError() {
    const { t } = this.props;
    return <div className="container">
      <div className="mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">{t("error")}</h4>
          <p>{t("reload")}</p>
        </div>
      </div>
    </div>
  }

  render() {
    if (this.model.getContest().isLoading()) return this.renderLoading();
    if (!this.model.getContest().isLoaded()) return this.renderError();

    if (this.model.isUserLoading()) return this.renderLoading();
    if (!this.model.isLoggedIn()) return <LoginView model={this.model}/>;
    if (!this.model.isUserLoaded()) return this.renderError();

    return <ContestView model={this.model}/>;
  }
}

export default translateComponent(AppView);