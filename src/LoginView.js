import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import {translateComponent} from "./utils";

class LoginView extends Component {
  componentDidMount() {
    this.props.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.model.popObserver(this);
  }

  login() {
    this.props.model.attemptLogin(this.refs.form.token.value);
  }

  getLoginError() {
    const { t } = this.props;
    const attempt = this.props.model.loginAttempt;
    if (attempt && attempt.error) {
      const message = attempt.error.response.data.message;
      return (<div className="alert alert-danger" role="alert">
        <strong>{t("login.error")}</strong> {message}
      </div>);
    }
  }

  render() {
    const { t } = this.props;
    return (
      <div className="jumbotron">
        <h1 className={"text-center"}>{t("login.please login")}</h1>
        <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
          <div className="form-group">
            <label htmlFor="token" className="sr-only">{t("login.token")}</label>
            <input name="token" id="token" className="form-control text-center" required
                  placeholder={t("login.token")} type="text"/>
          </div>
          { this.getLoginError() }
          <input type="submit" className="btn btn-primary" value={t("login.login")} />
        </form>
      </div>
    );
  }
}

export default translateComponent(LoginView);
