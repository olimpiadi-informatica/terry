import client from './TerryClient';
import Observable from './Observable';

export default class Task extends Observable {
  constructor(contest, name, data) {
    super();

    this.contest = contest;
    this.name = name;
    this.data = data;
  }

  isLoadingStatement() {
    return this.loadStatementPromise !== undefined;
  }

  loadStatement() {
    if(this.isLoadingStatement()) throw Error("loadStatement() called while already loading statement");
    if(this.isLoadedStatement()) throw Error("loadStatement() called but statement already loaded");

    this.fireUpdate();

    return this.loadStatementPromise = client.statements.get(this.data.statement_path).then((response) => {
      this.statement = response.data;
      delete this.loadStatementPromise;
      this.fireUpdate();
    }, (response) => {
      delete this.loadStatementPromise;
      this.fireUpdate();
      return Promise.reject(response);
    });
  }

  isLoadedStatement() {
    return this.statement !== undefined;
  }

  getStatement() {
    if(!this.isLoadedStatement()) throw Error("statement not loaded");

    return this.statement;
  }
}
