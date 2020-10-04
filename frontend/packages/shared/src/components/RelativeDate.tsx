import { DateTime } from "luxon";
import moment from "moment";
import React from "react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { i18n } from "../i18n";

type RelativeDateProps = {
  date: DateTime;
  clock: () => DateTime;
};

export function RelativeDate({ date, clock }: RelativeDateProps) {
  useAutoRefresh(30000);
  const lang = i18n.language || "en";
  const localDate = date.setLocale(lang).toLocal();
  const localMoment = moment(date.toISO()).locale(lang);
  return (
    <abbr title={localDate.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}>
      {localMoment.from(moment(clock().toISO()))}
    </abbr>
  );
}
