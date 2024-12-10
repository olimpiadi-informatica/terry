/* eslint-disable camelcase */

export type ValidationCaseInfo =
  | {
      status: "missing";
    }
  | { status: "parsed"; message: string }
  | { status: "invalid"; message: string };

export type FeedbackCaseInfo = {
  correct: boolean;
  message?: string;
};

type FeedbackData = {
  alerts: Alert[];
  cases: FeedbackCaseInfo[];
};

export type Subtask = {
  score: number;
  testcases: number[];
};

export type Submission = {
  id: string;
  date: string;
  score: number;
  task: string;
  token: string;
  input: InputData;
  output: UploadedOutput;
  source: UploadedSource;
  subtasks: Subtask[];
  feedback: FeedbackData;
};

export type SubmissionList = {
  items: Submission[];
};

export type Alert = {
  message: string;
  severity: "warning" | "danger" | "success";
  code?: string;
};

export type UploadedFile = {
  date: string;
  id: string;
  input: string;
  path: string;
  size: number;
};

export type UploadedOutput = UploadedFile & {
  validation: {
    alerts: Alert[];
    cases: ValidationCaseInfo[];
  };
};

export type UploadedSource = UploadedFile & {
  validation: {
    alerts: Alert[];
  };
};

export type NotStartedContestData = {
  name: string;
  description: string;
  has_started: false;
  start_time: string | null;
};

export type TaskData = {
  name: string;
  title: string;
  max_score: number;
  statement_path: string;
};

export type StartedContestData = {
  name: string;
  description: string;
  has_started: true;
  start_time: string;
  max_total_score: number;
  tasks: TaskData[];
};

export type UserData = {
  name: string;
  surname: string;
  token: string;
  sso_user: number;
  contest_start_delay: number | null;
};

export type InputData = {
  id: string;
  attempt: number;
  date: string;
  path: string;
  size: number;
  task: string;
  token: string;
  expiry_date: string | null;
};

export type UserTaskData = {
  name: string;
  score: number;
  current_input: InputData | null;
};

export type NotStartedContest = {
  contest: NotStartedContestData;
} & UserData;

export type StartedContest = {
  contest: StartedContestData;
  end_time: string;
  total_score: number;
  tasks: { [name: string]: UserTaskData };
} & UserData;

export type ContestData = NotStartedContest | StartedContest;

export type Announcement = {
  id: number;
  severity: string;
  title: string;
  content: string;
  date: string;
}

export type Answer = {
  date: string;
  content: string;
}

export type Question = {
  id: number;
  creator: string;
  content: string;
  date: string;
  answer: Answer | null;
}

export type CommunicationData = {
  announcements: Announcement[];
  questions?: Question[];
}
