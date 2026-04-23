/**
 * @jest-environment node
 */
import { describe, it, expect } from "@jest/globals";
import {
  analyzeUsedProperties,
  AnalyzableElement,
} from "../../src/misc/used-properties-analyzer.ts";
import {
  UsedPropertyElementOperation,
  UsedPropertySource,
} from "../../src/api/apiTypes.ts";

describe("analyzeUsedProperties", () => {
  it("returns empty list for no elements", () => {
    expect(analyzeUsedProperties([])).toEqual([]);
  });

  it("finds simple exchange property and header references in string properties", () => {
    const el: AnalyzableElement = {
      id: "e1",
      name: "A",
      type: "any-type",
      properties: {
        body: "ref ${exchangeProperty.outId} and ${header.authToken} end",
      },
    };
    const r = analyzeUsedProperties([el]);
    const names = r.map((p) => `${p.source}:${p.name}`).sort();
    expect(names).toContain("EXCHANGE_PROPERTY:outId");
    expect(names).toContain("HEADER:authToken");
    for (const p of r) {
      expect(p.relatedElements.e1).toEqual(
        expect.objectContaining({
          id: "e1",
          operations: [UsedPropertyElementOperation.GET],
        }),
      );
    }
  });

  it("parses nested property objects and arrays", () => {
    const el: AnalyzableElement = {
      id: "e2",
      name: "B",
      type: "filter",
      properties: {
        nested: {
          deep: "${exchangeProperty.nestedName}",
        },
        arr: ["${header.inArray}"],
      },
    };
    const r = analyzeUsedProperties([el]);
    const byName = Object.fromEntries(r.map((p) => [p.name, p.source]));
    expect(byName.nestedName).toBe(UsedPropertySource.EXCHANGE_PROPERTY);
    expect(byName.inArray).toBe(UsedPropertySource.HEADER);
  });

  it("detects Groovy get/set in script element", () => {
    const groovy = [
      'exchange.getMessage().headers["x1"]',
      "exchange.getMessage().setHeader('h2', v)",
      "exchange.properties.p1 = 1",
      "exchange.setProperty('p2', 2)",
    ].join("\n");
    const el: AnalyzableElement = {
      id: "s1",
      name: "Script",
      type: "script",
      properties: { script: groovy },
    };
    const r = analyzeUsedProperties([el]);
    const byKey = (source: UsedPropertySource, name: string) =>
      r.find(
        (p) => p.source === source && p.name === name && p.relatedElements.s1,
      );
    expect(
      byKey(UsedPropertySource.HEADER, "x1")?.relatedElements.s1?.operations,
    ).toEqual(expect.arrayContaining([UsedPropertyElementOperation.GET]));
    expect(
      byKey(UsedPropertySource.HEADER, "h2")?.relatedElements.s1?.operations,
    ).toEqual(expect.arrayContaining([UsedPropertyElementOperation.SET]));
  });

  it("collects scripts from service-call after/before and Groovy", () => {
    const el: AnalyzableElement = {
      id: "sc1",
      name: "Call",
      type: "service-call",
      properties: {
        after: [
          { script: 'exchange.getMessage().headers["svcAfter"]' },
          { notScript: 1 },
        ],
        before: { script: "exchange.properties.svcBefore" },
      },
    };
    const r = analyzeUsedProperties([el]);
    const headerGet = r.filter(
      (p) => p.name === "svcAfter" && p.source === UsedPropertySource.HEADER,
    );
    expect(headerGet.length).toBeGreaterThan(0);
    const propGet = r.filter(
      (p) =>
        p.name === "svcBefore" &&
        p.source === UsedPropertySource.EXCHANGE_PROPERTY,
    );
    expect(propGet.length).toBeGreaterThan(0);
  });

  it("collects script from http-trigger handler", () => {
    const el: AnalyzableElement = {
      id: "h1",
      name: "HTTP",
      type: "http-trigger",
      properties: {
        handlerContainer: {
          script: 'exchange.getMessage().headers["httpHdr"]',
        },
      },
    };
    const r = analyzeUsedProperties([el]);
    expect(
      r.some(
        (p) => p.name === "httpHdr" && p.source === UsedPropertySource.HEADER,
      ),
    ).toBe(true);
  });

  it("maps mapper-2 mappingDescription headers and properties", () => {
    const el: AnalyzableElement = {
      id: "m1",
      name: "Mapper2",
      type: "mapper-2",
      properties: {
        mappingDescription: {
          source: {
            headers: [
              { name: "HIn", type: { name: "string" } },
              { name: "HBad", notType: 1 },
            ],
            properties: [
              { name: "PIn", type: { name: "number" } },
              { name: "", type: { name: "string" } },
            ],
          },
          target: {
            headers: [{ name: "HOut", type: { name: "boolean" } }],
            properties: [{ name: "POut", type: { name: "object" } }],
          },
        },
      },
    };
    const r = analyzeUsedProperties([el]);
    const names = (source: UsedPropertySource) =>
      r.filter((p) => p.source === source).map((p) => p.name);
    expect(names(UsedPropertySource.HEADER)).toEqual(
      expect.arrayContaining(["HIn", "HOut"]),
    );
    expect(names(UsedPropertySource.EXCHANGE_PROPERTY)).toEqual(
      expect.arrayContaining(["PIn", "POut"]),
    );
  });

  it("maps array-typed fields in mapping descriptions", () => {
    const el: AnalyzableElement = {
      id: "m2",
      name: "Mapper2",
      type: "mapper-2",
      properties: {
        mappingDescription: {
          source: {
            properties: [
              {
                name: "arrP",
                type: {
                  name: "array",
                  itemType: { name: "string" },
                },
              },
            ],
          },
        },
      },
    };
    const r = analyzeUsedProperties([el]);
    const arrP = r.find(
      (p) =>
        p.name === "arrP" && p.source === UsedPropertySource.EXCHANGE_PROPERTY,
    );
    expect(arrP).toBeDefined();
    expect(arrP?.isArray).toBe(true);
  });

  it("merges service-call mappingDescription from after/before/handler paths", () => {
    const md = {
      source: {
        headers: [{ name: "HH", type: { name: "string" } }],
        properties: [],
      },
      target: { headers: [], properties: [] },
    };
    const el: AnalyzableElement = {
      id: "m3",
      name: "SC",
      type: "service-call",
      properties: {
        after: [{ mappingDescription: md }],
        before: { mappingDescription: { ...md, name: "ignored" } },
        handlerContainer: { mappingDescription: md },
      },
    };
    const r = analyzeUsedProperties([el]);
    const hh = r.filter(
      (p) => p.name === "HH" && p.source === UsedPropertySource.HEADER,
    );
    expect(hh.length).toBeGreaterThanOrEqual(1);
  });

  it("reads http-trigger mappingDescription in handler", () => {
    const md = {
      source: {
        headers: [{ name: "HTH", type: { name: "string" } }],
        properties: [],
      },
      target: { headers: [], properties: [] },
    };
    const el: AnalyzableElement = {
      id: "h2",
      name: "Htt",
      type: "http-trigger",
      properties: { handlerContainer: { mappingDescription: md } },
    };
    const r = analyzeUsedProperties([el]);
    expect(
      r.some((p) => p.name === "HTH" && p.source === UsedPropertySource.HEADER),
    ).toBe(true);
  });

  it("adds and removes header modification keys", () => {
    const el: AnalyzableElement = {
      id: "hm",
      name: "HM",
      type: "header-modification",
      properties: {
        headerModificationToAdd: { a: 1, b: 2 },
        headerModificationToRemove: ["x", 5, "y"] as unknown as string[],
      },
    };
    const r = analyzeUsedProperties([el]);
    const headerNames = r
      .filter(
        (p) =>
          p.source === UsedPropertySource.HEADER &&
          p.relatedElements.hm?.operations?.includes(
            UsedPropertyElementOperation.SET,
          ),
      )
      .map((p) => p.name);
    expect(headerNames).toEqual(expect.arrayContaining(["a", "b", "x", "y"]));
  });

  it("skips mappingDescription property subtree for service-call in direct property scan (still analyses other keys)", () => {
    const el: AnalyzableElement = {
      id: "skip1",
      name: "S",
      type: "service-call",
      properties: {
        mappingDescription: { willNotMatchSimplePatterns: "x" },
        other: "${header.stillScanned}",
      },
    };
    const r = analyzeUsedProperties([el]);
    expect(r.some((p) => p.name === "stillScanned")).toBe(true);
  });

  it("traverses nested arrays in service-call after mapping paths", () => {
    const md = {
      source: {
        headers: [{ name: "NestedH", type: { name: "string" } }],
        properties: [],
      },
      target: { headers: [], properties: [] },
    };
    const el: AnalyzableElement = {
      id: "arrPath",
      name: "A",
      type: "service-call",
      properties: {
        after: [
          [
            {
              mappingDescription: md,
            },
          ],
        ],
      },
    };
    const r = analyzeUsedProperties([el]);
    expect(
      r.some(
        (p) => p.name === "NestedH" && p.source === UsedPropertySource.HEADER,
      ),
    ).toBe(true);
  });

  it("merges operations for the same key from the same element", () => {
    const groovy = 'exchange.getMessage().headers["hg"]\n';
    const groovy2 = "exchange.getMessage().setHeader('hg', 1)\n";
    const el: AnalyzableElement = {
      id: "e3",
      name: "E",
      type: "script",
      properties: { script: `${groovy}${groovy2}` },
    };
    const r = analyzeUsedProperties([el]);
    const hg = r.find(
      (p) => p.name === "hg" && p.source === UsedPropertySource.HEADER,
    );
    expect(hg?.relatedElements.e3?.operations?.sort()).toEqual(
      [
        UsedPropertyElementOperation.GET,
        UsedPropertyElementOperation.SET,
      ].sort(),
    );
  });
});
