/** Organic ordering accepts only service quality and relevance signals.
 * Ads are fetched and rendered in a separate zone; spend cannot enter this API.
 */
export type OrganicCandidate = {
  id: string;
  searchRelevance: number;
  verifiedReviewScore: number;
  informationCompleteness: number;
  serviceReliability: number;
};
export function rankOrganic<T extends OrganicCandidate>(candidates: readonly T[]): T[] {
  const score = (item: T) =>
    item.searchRelevance * 0.4 + item.verifiedReviewScore * 0.3 +
    item.informationCompleteness * 0.15 + item.serviceReliability * 0.15;
  return [...candidates].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
}
