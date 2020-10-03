import React from "react";
import { DateTime } from "luxon";
import moment from "moment";
import { i18n } from "../i18n";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

type AbsoluteDateProps = {
  date: DateTime;
  clock: () => DateTime;
};

export function AbsoluteDate({ date, clock }: AbsoluteDateProps) {
  useAutoRefresh(30000);
  const lang = i18n.language || "en";
  const localDate = date.setLocale(lang).toLocal();
  const localMoment = moment(date.toISO()).locale(lang);
  return (
    <abbr title={localMoment.from(moment(clock().toISO()))}>
      {localDate.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
    </abbr>
  );
}