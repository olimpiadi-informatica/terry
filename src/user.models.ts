import client from "./TerryClient";
import Cookies from "universal-cookie";
import Observable from "./Observable";
import { DateTime, Duration } from "luxon";
import ObservablePromise from "./ObservablePromise";
import { notifyError } from "./utils";

export class Model extends Observable {
  submissions: any;
  lastLoginAttempt?: ObservablePromise;
  userStatePromise?: ObservablePromise;
  timeDelta?: Duration;
  cookies: any;

  static cookieName = "userToken";

  constructor() {
    super();

    this.cookies = new Cookies();
    this.submissions = {};
  }

  onAppStart() {
    if (this.isLoggedIn()) {
      this.loadUser();
    }
  }

  userToken() {
    return this.cookies.get(Model.cookieName);
  }

  isLoggedIn() {
    return this.userToken() !== undefined;
  }

  serverTime() {
    return DateTime.local().minus(this.timeDelta || {});
  }

  setServerTime(time: DateTime) {
    this.timeDelta = DateTime.local().diff(time);
  }

  doLoadUser() {
    if (!this.isLoggedIn()) throw Error("doLoadUser can only be called after a successful login");

    return client.api.get("/user/" + this.userToken()).then((response) => {
      this.setServerTime(DateTime.fromHTTP(response.headers["date"]));
      return new UserState(this, response.data);
    });
  }

  loadUser() {
    this.userStatePromise = new ObservablePromise(
      this.doLoadUser().catch((error) => {
        console.error("Forced logout because: ", error);
        this.logout();
        return Promise.reject(error);
      })
    );
    this.fireUpdate();
  }

  refreshUser() {
    return this.doLoadUser().then((userState) => {
      this.userStatePromise = new ObservablePromise(Promise.resolve(userState));
      this.fireUpdate();
    });
  }

  login(token: string) {
    this.cookies.set(Model.cookieName, token);
    this.loadUser();
    this.lastLoginAttempt = this.userStatePromise;
    this.lastLoginAttempt && this.lastLoginAttempt.pushObserver(this);
    this.fireUpdate();
  }

  logout() {
    if (!this.isLoggedIn()) throw Error("logout() should be called only if logged in");
    this.cookies.remove(Model.cookieName);
    delete this.userStatePromise;
    // TODO redirect to /
    this.fireUpdate();
  }

  getSubmissionPromise(id: string) {
    if (!id) throw Error();

    if (this.submissions[id] !== undefined) return this.submissions[id];
    return (this.submissions[id] = new ObservablePromise(
      client.api.get("/submission/" + id).then((response) => new SubmissionResult(response.data))
    ));
  }
}

class Output {
  error: any;
  uploadPromise: ObservablePromise;
  submission: any;
  file: any;

  constructor(file: any, submission: any) {
    this.file = file;
    this.submission = submission;

    this.uploadPromise = new ObservablePromise(this.doUpload());
  }

  doUpload() {
    const data = new FormData();

    data.append("input_id", this.submission.input.id);
    data.append("file", this.file);

    let id: string;

    return Promise.resolve()
      .then(() => {
        return client.api.post("/upload_output", data).then((response) => {
          id = response.data.id;
          delete this.error;
        });
      })
      .catch((response) => {
        notifyError(response);
      })
      .then(() => {
        return client.api.get("/output/" + id);
      });
  }

  isValidForSubmit() {
    return this.uploadPromise.isFulfilled();
  }
}

class Source {
  uploadPromise: ObservablePromise;
  submission: any;
  file: any;

  constructor(file: any, submission: any) {
    this.file = file;
    this.submission = submission;

    this.uploadPromise = new ObservablePromise(this.doUpload());
  }

  doUpload() {
    const data = new FormData();

    data.append("input_id", this.submission.input.id);
    data.append("file", this.file);

    return client.api.post("/upload_source", data);
  }

  isValidForSubmit() {
    return this.uploadPromise.isFulfilled();
  }
}

class UserState extends Observable {
  model: Model;
  data: any;
  userTaskState: any;
  tasks: any;

  constructor(model: Model, data: any) {
    super();
    this.model = model;
    this.data = data;

    if (data.contest.has_started) {
      this.userTaskState = {};
      for (const task of data.contest.tasks) {
        const state = new UserTaskState(this.model, this, task);
        this.userTaskState[task.name] = state;
      }

      this.tasks = this.data.contest.tasks.map((d: any) => new Task(this, d.name, d));
    }
  }

  getTask(taskName: string) {
    const byName: any = {};
    for (let task of this.tasks) {
      byName[task.name] = task;
    }
    return byName[taskName];
  }

  getTaskState(taskName: string) {
    return this.userTaskState[taskName];
  }
}

class Task extends Observable {
  contest: any;
  name: any;
  data: any;
  statementPromise: ObservablePromise;

  constructor(contest: any, name: string, data: any) {
    super();

    this.contest = contest;
    this.name = name;
    this.data = data;

    this.statementPromise = new ObservablePromise(
      client.statements.get(this.data.statement_path).then((response) => response.data)
    );
  }
}

class UserTaskState extends Observable {
  submissionListPromise?: ObservablePromise;
  inputGenerationPromise?: ObservablePromise;
  model: any;
  user: any;
  task: any;

  constructor(model: Model, user: any, task: any) {
    super();

    this.model = model;
    this.user = user;
    this.task = task;

    this.refreshSubmissionList();
  }

  doGetCurrentInput() {
    return this.user.data.tasks[this.task.name].current_input;
  }

  hasCurrentInput() {
    return this.doGetCurrentInput() !== null;
  }

  getCurrentInput() {
    if (!this.hasCurrentInput()) throw new Error();
    return this.doGetCurrentInput();
  }

  isGeneratingInput() {
    return this.inputGenerationPromise !== undefined;
  }

  generateInput() {
    if (this.isGeneratingInput()) throw new Error("already generating input");

    const data = new FormData();

    data.append("token", this.user.data.token);
    data.append("task", this.task.name);

    this.fireUpdate();

    this.inputGenerationPromise = new ObservablePromise(
      client.api
        .post("/generate_input", data)
        .then((response) =>
          Promise.resolve()
            .then(() => this.model.refreshUser())
            .then(() => response.data)
        )
        .catch((response) => {
          notifyError(response);
          this.inputGenerationPromise = undefined;
        })
    );
  }

  canSubmit(inputId: string) {
    return this.hasCurrentInput() && this.getCurrentInput().id === inputId;
  }

  createSubmission(inputId: string) {
    if (!this.canSubmit(inputId)) throw new Error();

    const input = this.getCurrentInput();
    return new Submission(input, this);
  }

  loadSubmissionList() {
    return client.api.get("/user/" + this.user.data.token + "/submissions/" + this.task.name).then((response) => {
      return response.data;
    });
  }

  refreshSubmissionList() {
    this.submissionListPromise = new ObservablePromise(this.loadSubmissionList());
    this.fireUpdate();
  }
}

export class Submission extends Observable {
  taskState: any;
  model: any;
  input: any;
  output?: Output;
  source?: Source;
  submitPromise?: ObservablePromise;

  constructor(input: any, taskState: any) {
    super();

    this.input = input;
    this.taskState = taskState;

    this.model = taskState.model;
    this.submitPromise = undefined;
  }

  setSource(file: any) {
    if (this.isSubmitted()) throw Error();
    if (this.source) throw Error("setSource called when hasSource is true");

    this.source = new Source(file, this);
    this.source.uploadPromise.pushObserver(this);
    this.source.uploadPromise.delegate.catch((response) => {
      notifyError(response);
    });
    this.fireUpdate();
  }

  resetSource() {
    if (this.isSubmitted()) throw Error();
    this.source && this.source.uploadPromise.popObserver(this);
    delete this.source;
    this.fireUpdate();
  }

  setOutput(file: any) {
    if (this.isSubmitted()) throw Error();
    if (this.hasOutput()) throw Error("setOutput called when hasOutput is true");

    this.output = new Output(file, this);
    this.output.uploadPromise.pushObserver(this);
    this.fireUpdate();
  }

  hasOutput() {
    return this.output !== undefined;
  }

  resetOutput() {
    if (this.isSubmitted()) throw Error();
    if (!this.output) throw Error();

    this.output.uploadPromise.popObserver(this);
    delete this.output;
    this.fireUpdate();
  }

  canSubmit() {
    return (
      !this.isSubmitted() &&
      this.hasOutput() &&
      this.output &&
      this.output.isValidForSubmit() &&
      this.source &&
      this.source.isValidForSubmit()
    );
  }

  isSubmitted() {
    return this.submitPromise != null;
  }

  submit() {
    if (!this.canSubmit()) throw new Error("called submit() but canSubmit() returns false");
    if (!this.source) throw new Error();
    if (!this.output) throw new Error();

    const data = new FormData();

    data.append("input_id", this.input.id);
    data.append("source_id", this.source.uploadPromise.value.data.id);
    data.append("output_id", this.output.uploadPromise.value.data.id);

    this.fireUpdate();

    return (this.submitPromise = new ObservablePromise(
      client.api.post("/submit", data).then((response) =>
        Promise.resolve()
          .then(() => this.model.refreshUser())
          .then(() => this.taskState.refreshSubmissionList())
          .then(() => new SubmissionResult(response.data))
      )
    ));
  }
}

class SubmissionResult extends Observable {
  data: any;

  constructor(data: any) {
    super();
    if (!data) throw Error();
    this.data = data;
  }
}
