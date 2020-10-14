import React from "react";
import RemarkMathPlugin from "remark-math";
import { BlockMath, InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";

import "katex/dist/katex.min.css";

type Props = {
  source: string;
  baseUri?: string;
};

export function Markdown({ baseUri, source }: Props) {
  const transformUri = (url: string) => {
    if (!baseUri) return url;
    return baseUri + url;
  };

  return (
    <ReactMarkdown
      source={source}
      transformImageUri={transformUri}
      transformLinkUri={transformUri}
      plugins={[RemarkMathPlugin]}
      renderers={{
        math: ({ value }: { value: string }) => <BlockMath>{value}</BlockMath>,
        inlineMath: ({ value }: { value: string }) => <InlineMath>{value}</InlineMath>,
      }}
    />
  );
}

Markdown.defaultProps = {
  baseUri: undefined,
};
