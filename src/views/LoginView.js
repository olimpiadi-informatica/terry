import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import {translateComponent} from "../utils";

class LoginView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  componentDidMount() {
    this.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
  }

  login() {
    this.model.attemptLogin(this.refs.form.token.value);
  }

  getLoginError() {
    const { t } = this.props;
    const attempt = this.model.loginAttempt;
    if (attempt && attempt.error) {
      const message = attempt.error.response.data.message;
      return (<div className="alert alert-danger" role="alert">
        <strong>{t("login.error")}</strong> {message}
      </div>);
    }
  }

  renderLoginForm() {
    const { t } = this.props;
    return <React.Fragment>
      <h2 className={"text-center"}>{t("login.please login")}</h2>
      <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
        <div className="form-group">
          <label htmlFor="token" className="sr-only">{t("login.token")}</label>
          <input name="token" id="token" className="form-control text-center" required
                 placeholder={t("login.token")} type="text"/>
        </div>
        { this.getLoginError() }
        <input type="submit" className="btn btn-primary" value={t("login.login")} />
      </form>
    </React.Fragment>;
  }

  renderNotStarted() {
    const { t } = this.props;
    return <em>{t("login.not started")}</em>;
  }

  render() {
    const form = this.model.contest.data.has_started ? this.renderLoginForm() : this.renderNotStarted();
    return (
      <div className="jumbotron">
        <h1 className="display-3 center-align">{this.model.contest.data.name}</h1>
        <ReactMarkdown source={this.model.contest.data.description} />
        <hr />
        { form }
      </div>
    );
  }
}

export default translateComponent(LoginView);
