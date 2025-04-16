export type TestResults = Record<
  string,
  { passedTests: string[]; failedTests: string[]; newBaselines: string[] }
>;
