import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { colorFromScore } from './utils';

export default class NavbarItemView extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
    this.taskName = props.taskName;
    this.max_score = this.model.contest.getTask(this.taskName).data.max_score;
  }

  componentDidMount() {
    this.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.model.popObserver(this);
  }

  render() {
    const score = this.model.user.tasks[this.taskName].score;
    const color = colorFromScore(score, this.max_score);
    return (
        <li className="nav-item">
          <NavLink to={ "/" + this.taskName } className="nav-link tasklist-item" activeClassName="active">
            <div className={"task-score-badge badge badge-pill badge-" + color}>
              {score}/{this.max_score}
            </div>
            <div className="task-list-item">{ this.taskName }</div>
          </NavLink>
        </li>
    );
  }
}
