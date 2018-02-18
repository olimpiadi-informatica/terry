import client from './TerryClient';
import Observable from './Observable';
import ObservablePromise from './ObservablePromise';

export default class Task extends Observable {
  constructor(contest, name, data) {
    super();

    this.contest = contest;
    this.name = name;
    this.data = data;

    this.statementPromise = new ObservablePromise(
      client.statements.get(this.data.statement_path).then((response) => response.data)
    );
  }
}
