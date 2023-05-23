import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

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
      transformImageUri={transformUri}
      transformLinkUri={transformUri}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {source ?? ""}
    </ReactMarkdown>
  );
}

Markdown.defaultProps = {
  baseUri: undefined,
};
