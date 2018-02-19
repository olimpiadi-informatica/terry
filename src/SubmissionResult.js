import client from './TerryClient';
import Observable from './Observable';

export default class SubmissionResult extends Observable {
  constructor(data) {
    super();
    if(!data) throw Error();
    this.data = data;
  }
}
