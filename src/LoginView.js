import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import {translateComponent} from "./utils";
import PromiseView from './PromiseView';

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
          <input type="submit" className="btn btn-primary" value={t("login.login")} />
          { this.props.model.lastLoginAttempt &&
            <PromiseView promise={this.props.model.lastLoginAttempt}
              renderPending={() => t("loading")}
              renderRejected={(error) =>
                <div className="alert alert-danger" role="alert">
                  <strong>{t("login.error")}</strong> {error.response && error.response.data.message}
                </div>  
              }
              renderFulfilled={() => null}
            />
          }
        </form>
      </div>
    );
  }
}

export default translateComponent(LoginView);
