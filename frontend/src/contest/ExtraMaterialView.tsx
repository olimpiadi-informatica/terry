import React from "react";
import { useParams } from "react-router-dom";
import { Markdown } from "src/components/Markdown";
import { useStatus } from "./ContestContext";

export function ExtraMaterialView() {
  const { sectionUrl } = useParams<{ sectionUrl: string }>();
  const status = useStatus();
  const section = status.isReady()
    ? status.value().contest.extra_material.find((s) => s.url === sectionUrl)
    : null;

  if (!section) {
    return <div>Section not found</div>;
  }

  return (
    <>
      <h1>{section.name}</h1>
      <Markdown source={section.page} />
    </>
  );
}
