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
      return (<div className="alert alert-danger col-md-8 offset-md-2" role="alert">
        <strong>{t("login.error")}</strong> {message}
      </div>);
    }
  }

  renderLoginForm() {
    const { t } = this.props;
    return <div>
      <h2 className={"text-center"}>{t("login.please login")}</h2>
      <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
        <div className="form-group">
          <label htmlFor="token" className="sr-only">{t("login.token")}</label>
          <input name="token" id="token" className="col-md-8 offset-md-2 form-control text-center" required placeholder={t("login.token")}/>
        </div>
        { this.getLoginError() }
        <input type="submit" className="btn btn-primary col-md-2 offset-md-5" value={t("login.login")} />
      </form>
    </div>;
  }

  render() {
    return (
        <div className="container-fluid mt-4">
          <div className="jumbotron col-xl-6 offset-xl-3 col-lg-8 offset-lg-2 col-md-10 offset-md-1">
            { this.renderLoginForm() }
          </div>
        </div>
    );
  }
}

export default translateComponent(AdminLoginView, "admin");