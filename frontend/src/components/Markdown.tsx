import React, { useCallback } from "react";
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

  const math = useCallback((props: { value: string }) => <BlockMath>{props.value}</BlockMath>, []);
  const inlineMath = useCallback((props: { value: string }) => <InlineMath>{props.value}</InlineMath>, []);

  return (
    <ReactMarkdown
      transformImageUri={transformUri}
      transformLinkUri={transformUri}
      remarkPlugins={[RemarkMathPlugin]}
      components={{
        /* TODO: I don't know why this is necessary. */
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /*
        // @ts-ignore */
        math,
        inlineMath,
      }}
    >
      {source ?? ""}
    </ReactMarkdown>
  );
}

Markdown.defaultProps = {
  baseUri: undefined,
};
