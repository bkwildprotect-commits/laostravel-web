import { describe, expect, it } from 'vitest';
import { rankOrganic } from './organic-ranking';
describe('organic ranking boundary', () => {
  it('orders by quality even if a candidate also has a large ad budget', () => {
    const weak = { id: 'ads-buyer', searchRelevance: 0.3, verifiedReviewScore: 0.2, informationCompleteness: 0.5, serviceReliability: 0.2, adBudgetMinor: 100000000 };
    const strong = { id: 'small-partner', searchRelevance: 0.9, verifiedReviewScore: 0.9, informationCompleteness: 0.8, serviceReliability: 0.9, adBudgetMinor: 0 };
    expect(rankOrganic([weak, strong]).map(({ id }) => id)).toEqual(['small-partner', 'ads-buyer']);
  });
});
