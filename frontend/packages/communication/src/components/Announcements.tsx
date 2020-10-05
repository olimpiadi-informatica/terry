import { DateTime } from "luxon";
import React from "react";
import { useAnnouncements } from "@terry/shared/_/hooks/useCommunication";
import { Loading } from "@terry/shared/_/components/Loading";
import { Announcement } from "@terry/shared/_/components/Announcement";
import { NewAnnouncement } from "./NewAnnouncement";

export function Announcements() {
  const announcements = useAnnouncements();
  return (
    <>
      <h1>Announcements</h1>
      { announcements.isLoading() && <Loading /> }
      { announcements.isReady()
      && announcements.value().map((ann) => <Announcement key={ann.id} title={ann.title} content={ann.content} severity={ann.severity} date={DateTime.fromSQL(ann.date, { zone: "utc" })} />) }
      <NewAnnouncement />
    </>
  );
}
