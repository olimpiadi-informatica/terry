import React, { Component } from 'react';
import { Link, NavLink, Route } from 'react-router-dom';
import TaskView from './TaskView';

var FontAwesome = require('react-fontawesome');

export default class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  componentWillMount() {
    this.model.enterContest();
  }

  taskNavItem(item, i) {
    return (
      <li key={i} className="nav-item">
        <NavLink to={ "/" + item.name } className="nav-link tasklist-item" activeClassName="active">
          <div className="task-score-badge col-4 col-lg-3 badge badge-pill badge-danger">0/100</div>
          <div className="task-list-item col-8 col-lg-9">{ item.name }</div>
        </NavLink>
      </li>
    );
  }

  getSideBar() {
    return (
      <nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>Task list</h3>
          </li>

          <li className="divider-vertical"></li>

          { this.model.getContest().data.tasks.map(this.taskNavItem.bind(this)) }
        </ul>
      </nav>
    );
  }

  getNavBar() {
    return (
      <nav className="navbar navbar-toggleable-md navbar-inverse bg-primary">
        <a className="navbar-brand" href="#">Terry</a>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <Link to="/" className="nav-link">
                <span aria-hidden="true" className="fa fa-home"></span> Home
              </Link>
            </li>
          </ul>

          <ul className="nav navbar-nav navbar-right">
            <li className="nav-item">
              <a className="btn btn-danger" href="#" role="button" onClick={() => this.model.logout()}>
                <span aria-hidden="true" className="fa fa-sign-out"></span> Log Out</a>
            </li>
          </ul>
        </div>
      </nav>
    );
  }

  render() {
    return (
      <div >
        { this.getNavBar() }

        <div className="container-fluid">
          <div className="row">
            { this.getSideBar() }

            <main className="col-sm-9 col-md-10">
              <Route path={'/:taskName'} render={ ({match}) =>
                  <TaskView key={match.params.taskName} model={this.model} taskName={match.params.taskName}/>
              }/>
            </main>
          </div>
        </div>
      </div>
    );
  }
}
