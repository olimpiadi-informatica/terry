import React, { Component } from 'react';
import {translateComponent} from "./utils";
import ReactMarkdown from 'react-markdown';

class AdminLoginView extends Component {
  componentDidMount() {
    this.props.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.session.popObserver(this);
  }

  login() {
    this.props.session.login(this.refs.form.token.value);
  }

  renderLoginError() {
    const { t } = this.props;
    const error = this.props.session.error;
    if (error) {
      const message = error.response.data.message;
      return (<div className="alert alert-danger" role="alert">
        <strong>{t("login.error")}</strong> {message}
      </div>);
    }
  }

  render() {
    const { t } = this.props;
    return (
      <div className="jumbotron admin-jumbotron">
        <h1 className="text-center display-3">{this.props.pack.data.name}</h1>
        <ReactMarkdown source={this.props.pack.data.description}/>
        <hr />
        <h2 className="text-center">{t("login.please login")}</h2>
        <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
          <div className="form-group">
            <label htmlFor="token" className="sr-only">{t("login.token")}</label>
            <input name="token" id="token" className="form-control text-center" required
                   placeholder={t("login.token")}/>
          </div>
          { this.renderLoginError() }
          <input type="submit" className="btn btn-danger" value={t("login.login")} />
        </form>
      </div>
    );
  }
}

export default translateComponent(AdminLoginView, "admin");
