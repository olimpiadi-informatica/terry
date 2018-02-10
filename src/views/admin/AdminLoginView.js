import React, { Component } from 'react';
import {translateComponent} from "../../utils";

class AdminLoginView extends Component {
  constructor(props) {
    super(props);

    this.session = props.session;
  }

  componentDidMount() {
    this.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.session.popObserver(this);
  }

  login() {
    this.session.attemptLogin(this.refs.form.token.value);
  }

  getLoginError() {
    const { t } = this.props;
    const error = this.session.error;
    if (error) {
      const message = error.response.data.message;
      return (<div className="alert alert-danger" role="alert">
        <strong>{t("login.error")}</strong> {message}
      </div>);
    }
  }

  renderLoginForm() {
    const { t } = this.props;
    return <React.Fragment>
      <h1 className="text-center display-3">{t("navbar.title")}</h1>
      <hr />
      <h2 className="text-center">{t("login.please login")}</h2>
      <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
        <div className="form-group">
          <label htmlFor="token" className="sr-only">{t("login.token")}</label>
          <input name="token" id="token" className="form-control text-center" required
                 placeholder={t("login.token")} type="password"/>
        </div>
        { this.getLoginError() }
        <input type="submit" className="btn btn-danger" value={t("login.login")} />
      </form>
    </React.Fragment>;
  }

  render() {
    return (
      <div className="jumbotron admin-jumbotron">
        { this.renderLoginForm() }
      </div>
    );
  }
}

export default translateComponent(AdminLoginView, "admin");
