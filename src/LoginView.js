import React, { Component } from 'react';

class LoginView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  login() {
    this.model.attemptLogin(this.refs.form.token.value);
  }

  getLoginError() {
    const a = this.model.loginAttempt;
    if(a && a.error) {
      return <p>Login failed!</p>
    }
  }

  render() {
    return (
      <div>
        <form ref="form" action="" onSubmit={ (e) => { e.preventDefault() ; this.login(); } }>
          <input name="token" required />
          <input type="submit" value="Log in" />
        </form>
        { this.getLoginError() }
      </div>
    );
  }
}

export default LoginView;
