import React from "react";
import { Markdown } from "src/components/Markdown";
import { ExtraMaterialSection } from "src/types/contest";

type Props = {
  section: ExtraMaterialSection;
};

export function Section({ section }: Props) {
  return (
    <>
      <h1>{section.name}</h1>
      <hr />
      <Markdown source={section.page} />
    </>
  );
}
