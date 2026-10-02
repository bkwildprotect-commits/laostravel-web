import { describe, expect, it, vi } from 'vitest';
import { PostgresBookingRepository } from '../postgres-repository';
import type { TransactionContext } from '../../infrastructure/transaction';

describe('partner booking approval gate', () => {
  it('requires both approved verification and active business status in the authoritative query', async () => {
    const query = vi.fn().mockResolvedValue([{ partner_id: 'partner-1' }]);
    const tx = { query } as unknown as TransactionContext;
    const repo = new PostgresBookingRepository();
    await expect(repo.resolveBookingOwnership(tx, { serviceId: 'service-1', availabilityId: 'slot-1' }))
      .resolves.toEqual({ partnerId: 'partner-1' });
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain("p.verification_status='APPROVED'");
    expect(sql).toContain("p.business_status='ACTIVE'");
    expect(sql).toContain('FOR SHARE OF a,s,p');
  });
  it('fails closed when the database finds no eligible partner', async () => {
    const tx = { query: vi.fn().mockResolvedValue([]) } as unknown as TransactionContext;
    await expect(new PostgresBookingRepository().resolveBookingOwnership(tx, {
      serviceId: 'service-1', availabilityId: 'slot-1'
    })).rejects.toThrow('BOOKING_TARGET_NOT_FOUND');
  });
});
