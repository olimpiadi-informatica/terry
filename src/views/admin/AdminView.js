import React, { Component } from 'react';
import {translateComponent} from "../../utils";
import {Collapse, Navbar, NavbarToggler} from "reactstrap";
import {Link} from "react-router-dom";
import Countdown from '../CountdownView';
import Session from "../../models/admin/Session";
import AdminLoginView from "./AdminLoginView";
import LoadingView from "../LoadingView";
import LogsView from "./LogsView";
import ContestView from "./ContestView";
import UsersView from "./UsersView";

class AdminView extends Component {
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
    const countdown = this.session.status.start_time ? <Countdown remaining={this.session.status.remaining_time}/> : "";

    return <Navbar color="danger" inverse toggleable>
      <NavbarToggler onClick={this.toggleNavbar} right />
      <Link to="/admin" className="navbar-brand">{t("navbar.title")}</Link>
      <Collapse navbar className="navbar-toggleable-sm" isOpen={!this.state.collapsed}>
        <ul className="navbar-nav mr-auto" />
        <ul className="nav navbar-nav navbar-right">
          <li>
            <span className="nav-link">{countdown}</span>
          </li>
          <li className="nav-item">
            <a className="btn btn-danger" href="#" role="button" onClick={(e) => { e.preventDefault(); this.session.logout()}}>
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
            <LogsView session={this.session} />
            <ContestView session={this.session} />
            { this.session.status.loaded ? <UsersView session={this.session} /> : ""}
          </main>
        </div>
      </div>
    </div>
  }
}

export default translateComponent(AdminView, "admin");