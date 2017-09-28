import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import TaskView from './TaskView';
import Countdown from './Countdown';
import TaskNavbarItem from './TaskNavbarItem';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';
import 'moment-precise-range-plugin';

export default class ContestView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
  }

  componentWillMount() {
    this.model.enterContest();
  }

  getSideBar() {
    return (
      <nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar">
        <ul className="nav nav-pills flex-column">
          <li className="nav-item title">
            <h3>Task list</h3>
          </li>

          <li className="divider-vertical"></li>

          { this.model.getContest().data.tasks.map((task,i) => <TaskNavbarItem key={i} taskName={task.name} model={this.model} />)}
        </ul>
      </nav>
    );
  }

  getNavBar() {
    const user = this.model.user;
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
              <span className="nav-link">{user.name} {user.surname}</span>
            </li>
            <li>
              <span className="nav-link"><Countdown remaining={user.remaining_time}/></span>
            </li>
            <li className="nav-item">
              <a className="btn btn-danger" href="#" role="button" onClick={() => this.model.logout()}>
                <span aria-hidden="true" className="fa fa-sign-out"></span> Log Out</a>
            </li>
          </ul>
        </div>
      </nav>
    );
  }

  render_index() {
    // start and end are rounded to minutes
    const start = moment(this.model.contest.data.start_time).seconds(0);
    const end = moment().add(this.model.user.remaining_time, 'seconds').seconds(0);
    const length = moment.preciseDiff(start, end);

    return <div>
      <h1>{this.model.contest.data.name}</h1>
      <ReactMarkdown source={this.model.contest.data.description}/>
      <hr />
      <h2>Usage guide</h2>
      <p>On the left side of this page you can find the tasks, click on any one to open it.</p>
      <p>You can submit <em>as many times as you want</em>, but you will have a different input every time. When you
        make a submission remember to send the correct source file and the output corresponding to the last
        generated input. When you have uploaded your files <em>remember to submit</em> them by clicking the green
        button!</p>
      <p>If you want to submit more than one source code file, please create a zip file containing them.</p>
      <p>This contest is {length} long.</p>
    </div>
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
              <Route exact path={'/'} render={({match}) => this.render_index()}/>
            </main>
          </div>
        </div>
      </div>
    );
  }
}
