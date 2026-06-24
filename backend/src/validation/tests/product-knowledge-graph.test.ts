import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  KnowledgeGraphMapper,
  createInMemoryKnowledgeGraphRepository,
  createKnowledgeGraphModule,
  normalizeProductAlias,
} from "../../intelligence/product-knowledge-graph/index.js";

const WORKSPACE_ID = "ws-m024";

describe("Mission 024 Product Knowledge Graph", () => {
  const mapper = new KnowledgeGraphMapper();

  it("normalizes alias text for lookup", () => {
    assert.equal(normalizeProductAlias("  Portable USB Blender! "), "portable usb blender");
    assert.equal(mapper.normalizeAlias("USB smoothie blender"), "usb smoothie blender");
  });

  it("generates canonical slug from multiple aliases", () => {
    const aliases = [
      "Portable USB Blender",
      "portable usb blender",
      "USB smoothie blender",
      "mini portable blender",
    ];

    assert.equal(mapper.generateCanonicalSlug(aliases, "Portable USB Blender"), "portable-usb-blender");
  });

  it("maps aliases to a canonical product entity", async () => {
    const repository = createInMemoryKnowledgeGraphRepository();
    const module = createKnowledgeGraphModule(repository);

    const result = await module.upsertProductFromAliases(WORKSPACE_ID, {
      displayName: "Portable USB Blender",
      aliases: [
        "Portable USB Blender",
        "portable usb blender",
        "USB smoothie blender",
        "mini portable blender",
      ],
      targetBuyerPersonaIds: ["persona:moderate:kitchen-dining:25-44"],
      supplierRefs: [{ supplierId: "supplier-001", supplierSku: "USB-BLND-01", isPrimary: true }],
      sourceObservationIds: ["obs-m024-1"],
      confidence: 78,
      tags: ["kitchen", "portable"],
    });

    assert.equal(result.entity.canonicalSlug, "portable-usb-blender");
    assert.equal(result.entity.displayName, "Portable USB Blender");
    assert.equal(result.aliases.length, 4);
    assert.ok(result.entity.targetBuyerPersonaIds.includes("persona:moderate:kitchen-dining:25-44"));
    assert.equal(result.entity.supplierRefs[0]?.supplierId, "supplier-001");
  });

  it("resolves products by normalized alias", async () => {
    const repository = createInMemoryKnowledgeGraphRepository();
    const module = createKnowledgeGraphModule(repository);

    await module.upsertProductFromAliases(WORKSPACE_ID, {
      displayName: "Portable USB Blender",
      aliases: ["Portable USB Blender", "USB smoothie blender"],
    });

    const resolved = await module.resolveProductByAlias(WORKSPACE_ID, "usb smoothie blender");
    assert.ok(resolved);
    assert.equal(resolved.entity.canonicalSlug, "portable-usb-blender");
    assert.equal(resolved.matchedAlias.normalizedAlias, "usb smoothie blender");
  });

  it("persists entities, aliases, and relationships in repository", async () => {
    const repository = createInMemoryKnowledgeGraphRepository();
    const module = createKnowledgeGraphModule(repository);

    const blender = await module.upsertProductFromAliases(WORKSPACE_ID, {
      displayName: "Portable USB Blender",
      aliases: ["Portable USB Blender"],
    });

    const bottle = await module.upsertProductFromAliases(WORKSPACE_ID, {
      displayName: "Travel Protein Shaker",
      aliases: ["Travel Protein Shaker"],
    });

    const related = await module.createRelationship(WORKSPACE_ID, {
      sourceProductId: blender.entity.id,
      targetProductId: bottle.entity.id,
      relationshipType: "complementary",
      strength: 82,
    });

    const substitute = await module.createRelationship(WORKSPACE_ID, {
      sourceProductId: blender.entity.id,
      targetProductId: bottle.entity.id,
      relationshipType: "substitute",
      strength: 45,
    });

    const storedEntity = await repository.entities.getById(WORKSPACE_ID, blender.entity.id);
    const storedAliases = await repository.aliases.list({
      workspaceId: WORKSPACE_ID,
      productEntityId: blender.entity.id,
    });
    const complementary = await module.listComplementaryProducts(WORKSPACE_ID, blender.entity.id);
    const substitutes = await module.listSubstituteProducts(WORKSPACE_ID, blender.entity.id);

    assert.ok(storedEntity);
    assert.equal(storedAliases.length, 1);
    assert.equal(related.relationshipType, "complementary");
    assert.equal(substitute.relationshipType, "substitute");
    assert.equal(complementary.length, 1);
    assert.equal(substitutes.length, 1);
  });

  it("builds category hierarchy paths", async () => {
    const repository = createInMemoryKnowledgeGraphRepository();
    const module = createKnowledgeGraphModule(repository);

    const home = await module.upsertCategory(WORKSPACE_ID, {
      name: "Home",
      slug: "home",
    });

    const kitchen = await module.upsertCategory(WORKSPACE_ID, {
      name: "Kitchen",
      slug: "kitchen",
      parentCategoryId: home.id,
    });

    const appliances = await module.upsertCategory(WORKSPACE_ID, {
      name: "Appliances",
      slug: "appliances",
      parentCategoryId: kitchen.id,
    });

    const hierarchy = await module.getCategoryHierarchy(WORKSPACE_ID, appliances.id);

    assert.deepEqual(
      hierarchy.map((category) => category.slug),
      ["home", "kitchen", "appliances"],
    );
    assert.deepEqual(appliances.path, ["home", "kitchen", "appliances"]);
  });
});
