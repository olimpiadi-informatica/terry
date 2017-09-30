import React, { Component } from 'react';
import {translateComponent} from "../../utils";
import {Collapse, Navbar, NavbarToggler} from "reactstrap";
import {Link} from "react-router-dom";
import Countdown from '../CountdownView';
import Session from "../../models/admin/Session";
import AdminLoginView from "./AdminLoginView";
import LoadingView from "../LoadingView";

class ContestView extends Component {
  constructor(props) {
    super(props);

    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true
    };
    this.session = new Session();
  }

  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  componentWillMount() {
    this.session.tryLogin();
  }

  componentDidMount() {
    this.session.pushObserver(this);
  }

  componentWillUnmount() {
    this.session.popObserver(this);
  }

  getNavBar() {
    const { t } = this.props;
    return <Navbar color="danger" inverse toggleable>
      <NavbarToggler onClick={this.toggleNavbar} right />
      <Link to="/" className="navbar-brand">{t("navbar.title")}</Link>
      <Collapse navbar className="navbar-toggleable-sm" isOpen={!this.state.collapsed}>
        <ul className="navbar-nav mr-auto" />
        <ul className="nav navbar-nav navbar-right">
          <li>
            <span className="nav-link"><Countdown remaining={this.session.status.remaining_time}/></span>
          </li>
          <li className="nav-item">
            <a className="btn btn-danger" href="#" role="button" onClick={() => this.session.logout()}>
              <span aria-hidden="true" className="fa fa-sign-out" /> {t("navbar.logout")}
            </a>
          </li>
        </ul>
      </Collapse>
    </Navbar>
  }

  render() {
    if (this.session.isLoading()) return <LoadingView />;
    if (!this.session.isLoggedIn()) return <AdminLoginView session={this.session} />;

    return <div>
      { this.getNavBar() }

      <div className="container-fluid">
        <div className="row">
          <main className="col-sm-12">
            <h1>Admin page</h1>
          </main>
        </div>
      </div>
    </div>
  }
}

export default translateComponent(ContestView, "admin");