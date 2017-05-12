import React, { Component } from 'react';
import { Link, Route } from 'react-router-dom';
import TaskView from './TaskView';

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
      <li key={ i }>
        <Link to={ "/" + item.name }> { item.name } </Link>
      </li>
    );
  }

  render() {
    return (
      <div>
        <nav className="leftcol">
          <ul>
          { this.model.contest.tasks.map(this.taskNavItem.bind(this)) }
          </ul>
        </nav>

        <Route path={'/:taskName'} render={ ({match}) =>
            <TaskView key={match.params.taskName} model={this.model} taskName={match.params.taskName}/>
        }/>
      </div>
    );
  }
}

export default ContestView;
