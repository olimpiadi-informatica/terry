import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { colorFromScore } from './utils';
import { Model } from './user.models';

type Props = {
  userState: any
  taskName: string
  model: Model
}

export default class NavbarItemView extends React.Component<Props> {
  getMaxScore() {
    return this.props.userState.getTask(this.props.taskName).data.max_score;
  }

  componentDidMount() {
    this.props.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.model.popObserver(this);
  }

  render() {
    const score = this.props.userState.data.tasks[this.props.taskName].score;
    const color = colorFromScore(score, this.getMaxScore());
    return (
      <li className="nav-item">
        <NavLink to={"/" + this.props.taskName} className="nav-link tasklist-item" activeClassName="active">
          <div className={"task-score-badge badge badge-pill badge-" + color}>
            {score}/{this.getMaxScore()}
          </div>
          <div className="task-list-item">{this.props.taskName}</div>
        </NavLink>
      </li>
    );
  }
}
