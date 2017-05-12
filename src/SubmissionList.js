import wait from './utils';
import Source from './Source';
import Output from './Output';

class SubmissionList {
    constructor(taskName, model) {
      this.taskName = taskName;
      this.model = model;
    }

    load() {
      return wait(1000).then(() => {
        this.data = [
          {
            id: "sub3",
            input: {
              id: "i5"
            },
            source: {
              id: "src5",
            },
            output : {
              id: "o5",
            },
            result: {
              warnings: [
                {
                  code: "partial_parse",
                  severity: "warning",
                  message: "Attention: the submitted file could not be fully processed.",
                },
              ],
              cases: [
                {
                  id: "1",
                  status: "correct",
                  message: "Output correct.",
                },
                {
                  id: "5",
                  status: "wrong",
                  message: "Your output is 5, but the cycle (4 6 8 1) has shorter length (4) !",
                },
                {
                  id: "4",
                  status: "wrong",
                  message: "Your output is 3, but there is no cycle of length 3.",
                },
              ]
            },
          },
          {
            id: "sub5",
          },
        ]
      })
    }

    isLoaded() {
      return this.data !== undefined;
    }

    getData() {
      return this.data;
    }
}

export default SubmissionList;
