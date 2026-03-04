/* eslint-disable camelcase */

export type AlertSeverity =
  | "warning"
  | "danger"
  | "success";

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
  max_score: number;
  score: number;
  testcases: number[];
  labels?: string[];
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

export type SubmissionList = Submission[];

export type Alert = {
  message: string;
  severity: AlertSeverity;
  code?: string;
  blocking?: boolean;
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

export type TaskData = {
  name: string;
  title: string;
  max_score: number;
  statement_path: string;
  submission_timeout?: number;
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

export type ExtraMaterialSection = {
  name: string;
  url: string;
  page: string;
};

export type UserStatus = {
  token: string;
  name: string;
  surname: string;
  sso_user: number;
  contest_start_delay: number | null;
  tasks: { [name: string]: UserTaskData };
  role: string;
  total_score: number;
  extra_time: number;
};

export type ContestStatus = {
  has_started: boolean;
  time: { start: string; end: string };
  name: string;
  description: string;
  extra_material: ExtraMaterialSection[];
  tasks?: TaskData[];
  max_total_score?: number;
};

export type Status = {
  user?: UserStatus;
  contest: ContestStatus;
};

export type Announcement = {
  id: number;
  severity: string;
  title: string;
  content: string;
  date: string;
};

export type Answer = {
  date: string;
  content: string;
  answerer: string;
};

export type Question = {
  id: number;
  creator: string;
  content: string;
  date: string;
  answer: string | null;
  answerer: string | null;
  answer_date: string | null;
};

export type CommunicationData = {
  announcements: Announcement[];
  questions?: Question[];
};
