/* eslint-disable camelcase */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export type LogEntry = {
  date: string;
  category: string;
  level: LogLevel;
  message: string;
};

export type LogsData = {
  items: LogEntry[];
};

export type LogsOptions = {
  start_date: string;
  end_date: string;
  level: LogLevel;
  category?: string;
};

export type UserIp = {
  first_date: string;
  ip: string;
};

export type UserEntry = {
  name: string;
  surname: string;
  token: string;
  extra_time: number;
  ip: UserIp[];
};

export type UsersData = {
  items: UserEntry[];
};

export type StatusData = {
  loaded: boolean;
  start_time?: string;
  end_time?: string;
  extra_time?: number;
};

export type ZipData = {
  path: string;
};

export type Pack =
  | { uploaded: false }
  | {
      uploaded: true;
      deletable: boolean;
      name: string;
      description: string;
    };
