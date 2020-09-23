export type TestCase = {
  status: "parsed" | "missing";
  message: string;
  correct: boolean;
};
