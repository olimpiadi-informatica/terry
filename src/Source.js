import axios from 'axios';
import wait from './utils';

class Source {
    constructor(file, submission) {
      this.file = file;
      this.submission = submission;
    }
}

export default Source;
