import axios from 'axios';
import wait from './utils';

class Output {
    constructor(file, submission) {
      this.file = file;
      this.submission = submission;
    }
}

export default Output;
