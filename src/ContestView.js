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
    const taskRoutes = [];

    for (let t of this.model.contest.tasks) {
      taskRoutes.push(
        <Route key={t.name} exact path={'/' + t.name} component={
          () => <TaskView model={this.model} key={t.name} taskName={t.name}/>
        }/>
      );
    }

    return (
      <div>
        <nav className="leftcol">
          <ul>
          { this.model.contest.tasks.map(this.taskNavItem.bind(this)) }
          </ul>
        </nav>

        { taskRoutes }
      </div>
    );
  }
}

export default ContestView;
