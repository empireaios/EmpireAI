/** R4-12 — Loyalty registry. */

import type {
  LoyaltyAbuseAlert,
  LoyaltyMember,
  LoyaltyProgramme,
  LoyaltyRecord,
  LoyaltyReward,
} from "./types.js";

export class LoyaltyRegistry {
  private readonly programmes = new Map<string, LoyaltyProgramme>();
  private readonly members = new Map<string, LoyaltyMember>();
  private readonly records = new Map<string, LoyaltyRecord>();
  private readonly rewards = new Map<string, LoyaltyReward>();
  private readonly alerts = new Map<string, LoyaltyAbuseAlert>();
  private readonly redemptionKeys = new Set<string>();

  storeProgramme(programme: LoyaltyProgramme): void {
    this.programmes.set(programme.loyaltyProgrammeId, programme);
  }

  storeMember(member: LoyaltyMember): void {
    this.members.set(`${member.customerId}:${member.loyaltyProgrammeId}`, member);
  }

  storeRecord(record: LoyaltyRecord, redemptionKey?: string): void {
    this.records.set(record.loyaltyRecordId, record);
    if (redemptionKey) this.redemptionKeys.add(redemptionKey);
  }

  storeReward(reward: LoyaltyReward): void {
    this.rewards.set(reward.rewardId, reward);
  }

  storeAlert(alert: LoyaltyAbuseAlert): void {
    this.alerts.set(alert.alertId, alert);
  }

  getProgramme(id: string): LoyaltyProgramme | null {
    return this.programmes.get(id) ?? null;
  }

  getMember(customerId: string, programmeId: string): LoyaltyMember | null {
    return this.members.get(`${customerId}:${programmeId}`) ?? null;
  }

  getRecord(id: string): LoyaltyRecord | null {
    return this.records.get(id) ?? null;
  }

  listProgrammes(): LoyaltyProgramme[] {
    return [...this.programmes.values()];
  }

  listMembers(): LoyaltyMember[] {
    return [...this.members.values()];
  }

  listRecords(): LoyaltyRecord[] {
    return [...this.records.values()];
  }

  listRewards(): LoyaltyReward[] {
    return [...this.rewards.values()];
  }

  listAlerts(): LoyaltyAbuseAlert[] {
    return [...this.alerts.values()];
  }

  hasRedemptionKey(key: string): boolean {
    return this.redemptionKeys.has(key);
  }

  resetForTesting(): void {
    this.programmes.clear();
    this.members.clear();
    this.records.clear();
    this.rewards.clear();
    this.alerts.clear();
    this.redemptionKeys.clear();
  }
}
