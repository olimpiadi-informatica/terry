import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';

export default class LoginView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  login() {
    this.model.attemptLogin(this.refs.form.token.value);
  }

  getLoginError() {
    const attempt = this.model.loginAttempt;
    if (attempt && attempt.error) {
      const message = attempt.error.response.data.message;
      return (<div className="alert alert-danger col-md-8 offset-md-2" role="alert">
        <strong>Error!</strong> {message}
      </div>);
    }
  }

  renderLoginForm() {
    return <div>
      <h2 className={"text-center"}>Please login</h2>
      <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
        <div className="form-group">
          <label htmlFor="token" className="sr-only">Token</label>
          <input name="token" id="token" className="col-md-8 offset-md-2 form-control text-center" required placeholder="Token"/>
        </div>
        { this.getLoginError() }
        <input type="submit" className="btn btn-primary col-md-2 offset-md-5" value="Log in" />
      </form>
    </div>;
  }

  renderNotStarted() {
    return <em>The contest has not started yet! Refresh this page when the constest has started to be able to login.</em>;
  }

  render() {
    const form = this.model.contest.data.has_started ? this.renderLoginForm() : this.renderNotStarted();
    return (
      <div className="container-fluid mt-4">
        <div className="jumbotron col-xl-6 offset-xl-3 col-lg-8 offset-lg-2 col-md-10 offset-md-1">
        <h1 className="display-3 center-align">{this.model.contest.data.name}</h1>
          <ReactMarkdown source={this.model.contest.data.description} />
          <hr />
          { form }
        </div>
    </div>
    );
  }
}
