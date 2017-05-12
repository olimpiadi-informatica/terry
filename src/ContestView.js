import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import TaskView from './TaskView';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

var FontAwesome = require('react-fontawesome');

class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.currentTaskName = this.model.contest.tasks[0].name;
  }

  setCurrentTask(name) {
    this.currentTaskName = name;
    this.forceUpdate();
  }

  taskNavItem(item, i) {

    return (
      <li key={ i } className="nav-item">
        <a href={ "#" + item.name } className={ (this.currentTaskName == item.name) ? "nav-link active" : "nav-link" } onClick={this.setCurrentTask.bind(this, item.name)}>{ item.name }</a>
      </li>
    );
  }

  getSideBar()
  {
    return (
      <nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>Task</h3>
          </li>
          <li className="divider-vertical"></li>
          { this.model.contest.tasks.map(this.taskNavItem.bind(this)) }
        </ul>
      </nav>
    );
  }

  getNavBar()
  {
    return (
      <nav className="navbar navbar-toggleable-md navbar-inverse bg-primary">
        <a className="navbar-brand" href="#">Terry</a>
        <div className="collapse navbar-collapse" id="navbarsExampleDefault">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Settings</a>
            </li>
          </ul>

          <ul className="nav navbar-nav navbar-right">
            <li className="nav-item">
              <a className="btn btn-danger" href="#" role="button" onClick={() => this.model.logout()}>
                <FontAwesome name='rocket' /> Log Out</a>
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

export default ContestView;
