import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import moment from "moment";
import { i18n } from "./i18n";
import useTriggerUpdate from "./triggerUpdate.hook";

function useAutoRefresh(rate: number) {
  const [update, trigger] = useTriggerUpdate();
  useEffect(() => {
    const timer = setInterval(() => trigger(), rate);
    return () => clearInterval(timer);
  }, [rate, trigger, update]);
}

type DateViewProps = {
  date: DateTime;
  clock: () => DateTime;
};

export function DateComponent({ date, clock }: DateViewProps) {
  useAutoRefresh(30000);
  const lang = i18n.language || "en";
  const localDate = date.setLocale(lang);
  const localMoment = moment(date.toISO()).locale(lang);
  return (
    <abbr title={localDate.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}>
      {localMoment.from(moment(clock().toISO()))}
    </abbr>
  );
}

export function AbsoluteDateComponent({ date, clock }: DateViewProps) {
  useAutoRefresh(30000);
  const lang = i18n.language || "en";
  const localDate = date.setLocale(lang);
  const localMoment = moment(date.toISO()).locale(lang);
  return (
    <abbr title={localMoment.from(moment(clock().toISO()))}>
      {localDate.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
    </abbr>
  );
}

type CountdownProps = {
  end: DateTime;
  clock: () => DateTime;
  afterEnd: () => React.ReactNode;
};

export function CountdownComponent({ end, clock, afterEnd }: CountdownProps) {
  useAutoRefresh(1000);
  const ended = end.diff(clock()).as("milliseconds") < 0;
  return <React.Fragment>{ended ? afterEnd() : end.diff(clock()).toFormat("hh:mm:ss")}</React.Fragment>;
}
