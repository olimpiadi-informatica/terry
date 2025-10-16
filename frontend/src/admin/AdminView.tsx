import React from "react";
import { Route, Routes } from "react-router-dom";
import { useStatus } from "src/contest/ContestContext";
import { NewAnnouncement } from "./AdminAnnouncementsView";
import { Questions } from "./AdminQuestionView";
import { ContestStatusView } from "./AdminContestStatus";

export function AdminView() {
  const status = useStatus();

  if (status.isLoading()) return <div>Loading...</div>;

  return (
    <main>
      <Routes>
        <Route path="status" element={<ContestStatusView />} />
        <Route path="questions" element={<Questions />} />
        <Route path="announcements" element={<NewAnnouncement />} />
      </Routes>
    </main>
  );
}
