import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configureValidationEnvironment } from "../harness.js";
import { seedDomainData } from "../../domain/seed.js";
import { companies } from "../../domain/services/module-views.js";
import { CompanyRepository } from "../../domain/repositories/company-repository.js";

configureValidationEnvironment();

describe("Domain layer", () => {
  it("seeds workspace portfolio data idempotently", () => {
    seedDomainData("ws_domain_test");
    seedDomainData("ws_domain_test");
    const repo = new CompanyRepository();
    const rows = repo.listByWorkspace("ws_domain_test");
    assert.ok(rows.length >= 4);
  });

  it("creates companies with build pipeline stages", () => {
    const company = companies.create({
      workspaceId: "ws_domain_test",
      name: "Test Venture",
      category: "SaaS",
      status: "building",
    });

    const stages = companies.getBuildStages(company.id);
    assert.equal(stages.length, 5);
    assert.equal(company.status, "building");
  });
});
