import type {
  AowInput,
  CommissionFixture,
  CompetitionFixture,
  DemandSignalFixture,
  EvidenceMode,
  NicheFixture,
  ProductFixture,
  ProgrammeFixture,
} from "./types.js";

/** Internal fixture payload assembled from AowInput fixture arrays only. Never invents data. */
export type OpportunityFixturePayload = {
  programmes: ProgrammeFixture[] | null;
  products: ProductFixture[] | null;
  niches: NicheFixture[] | null;
  commissionData: CommissionFixture[] | null;
  demandSignals: DemandSignalFixture[] | null;
  competition: CompetitionFixture[] | null;
  evidenceMode: EvidenceMode;
};

export function normalizeEvidenceMode(value: unknown): EvidenceMode {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "fixture" || raw === "sandbox" || raw === "cached" || raw === "live") {
    return raw;
  }
  return "fixture";
}

export function normalizeNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Build the internal fixture payload from flat AowInput fixture arrays only. Never invents data. */
export function resolveFixtureFromInput(input: AowInput): OpportunityFixturePayload | null {
  const hasAny =
    (input.fixtureProgrammes && input.fixtureProgrammes.length) ||
    (input.fixtureProducts && input.fixtureProducts.length) ||
    (input.fixtureNiches && input.fixtureNiches.length) ||
    (input.fixtureCommissionData && input.fixtureCommissionData.length) ||
    (input.fixtureDemandSignals && input.fixtureDemandSignals.length) ||
    (input.fixtureCompetition && input.fixtureCompetition.length) ||
    input.evidenceMode;
  if (!hasAny) return null;
  return {
    programmes: input.fixtureProgrammes ?? null,
    products: input.fixtureProducts ?? null,
    niches: input.fixtureNiches ?? null,
    commissionData: input.fixtureCommissionData ?? null,
    demandSignals: input.fixtureDemandSignals ?? null,
    competition: input.fixtureCompetition ?? null,
    evidenceMode: normalizeEvidenceMode(input.evidenceMode ?? "fixture"),
  };
}

export function hasObservableFixtureContent(fixture: OpportunityFixturePayload | null): boolean {
  if (!fixture) return false;
  return Boolean(
    (fixture.programmes && fixture.programmes.length) ||
      (fixture.products && fixture.products.length) ||
      (fixture.niches && fixture.niches.length) ||
      (fixture.commissionData && fixture.commissionData.length) ||
      (fixture.demandSignals && fixture.demandSignals.length) ||
      (fixture.competition && fixture.competition.length),
  );
}
