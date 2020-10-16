import React from "react";
import { Markdown } from "src/components/Markdown";
import { Section as SectionT } from "src/types/admin";

type Props = {
    section: SectionT;
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
