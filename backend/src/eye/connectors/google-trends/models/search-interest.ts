/** Search interest timeline snapshot from Google Trends. */
export type SearchInterestPoint = {
  date: string;
  value: number;
};

export type SearchInterest = {
  keyword: string;
  region: string;
  interestScore: number;
  timeline: SearchInterestPoint[];
  observedAt: string;
};
