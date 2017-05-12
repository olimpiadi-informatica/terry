import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';

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
    if( a && a.error ) {
      return (<div className="alert alert-danger col-md-8 offset-md-2" role="alert">
        <strong>Error!</strong> Wrong token!
      </div>);
    }
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="jumbotron col-md-6 offset-md-3">
        <h1 className="display-3 center-align" >Local Contest</h1>
          <div>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </div>
          <br/>
          <form ref="form" action="" onSubmit={ (e) => { e.preventDefault() ; this.login(); } }>
            <div className="form-group">
              <label htmlFor="token" className="sr-only">Token</label>
              <input name="token" id="token" className="col-md-8 offset-md-2 form-control" required placeholder="Token"/>
            </div>
            { this.getLoginError() }
            <input type="submit" className="btn btn-primary col-md-2 offset-md-8" value="Log in" />
          </form>
        </div>
    </div>
    );
  }
}

export default LoginView;
