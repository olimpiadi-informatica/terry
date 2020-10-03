import React from 'react';

interface Props {
  children?: React.ReactNode;
}

export function Test({ children }: Props) {
  return <h1>Test {children}</h1>;
}