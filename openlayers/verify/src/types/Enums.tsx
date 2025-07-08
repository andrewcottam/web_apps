export const CheckStatus = {
  Valid: "Valid",
  NeedsReview: "Needs Review",
  Invalid: "Invalid",
} as const;

export type CheckStatus = typeof CheckStatus[keyof typeof CheckStatus];
