import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getCacheKey,
  getVersionKey,
  isCacheValid,
  isSpriteLoaded,
  markSpriteAsLoaded,
  clearLoadedSprite,
  getCachedSvgSprite,
  cacheSvgSprite,
  clearCachedSvgSprite,
  hasVersionChanged,
} from "./svgSpriteUtils";
import type { CachedSvgSprite } from "types/svg-sprite";

const TEST_URL = "https://example.com/sprites.svg";

describe("getCacheKey", () => {
  it("produces a stable, prefixed key for a given URL", () => {
    const key = getCacheKey(TEST_URL);
    expect(key).toContain("svg-sprite-cache-");
    expect(getCacheKey(TEST_URL)).toBe(key);
  });

  it("produces different keys for different URLs", () => {
    expect(getCacheKey("https://a.com/a.svg")).not.toBe(
      getCacheKey("https://b.com/b.svg"),
    );
  });
});

describe("getVersionKey", () => {
  it("produces a stable, prefixed version key", () => {
    const key = getVersionKey(TEST_URL);
    expect(key).toContain("svg-sprite-version-");
    expect(getVersionKey(TEST_URL)).toBe(key);
  });
});

describe("isCacheValid", () => {
  it("returns true for a recent timestamp", () => {
    const cached: CachedSvgSprite = {
      data: "<svg/>",
      version: "1.0.0",
      timestamp: Date.now() - 1000,
    };
    expect(isCacheValid(cached)).toBe(true);
  });

  it("returns false for a timestamp older than 30 days", () => {
    const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;
    const cached: CachedSvgSprite = {
      data: "<svg/>",
      version: "1.0.0",
      timestamp: Date.now() - thirtyOneDays,
    };
    expect(isCacheValid(cached)).toBe(false);
  });
});

describe("loaded sprite registry", () => {
  beforeEach(() => {
    clearLoadedSprite(TEST_URL);
  });

  it("returns false before a sprite is marked as loaded", () => {
    expect(isSpriteLoaded(TEST_URL)).toBe(false);
  });

  it("returns true after markSpriteAsLoaded", () => {
    markSpriteAsLoaded(TEST_URL);
    expect(isSpriteLoaded(TEST_URL)).toBe(true);
  });

  it("returns false again after clearLoadedSprite", () => {
    markSpriteAsLoaded(TEST_URL);
    clearLoadedSprite(TEST_URL);
    expect(isSpriteLoaded(TEST_URL)).toBe(false);
  });
});

describe("localStorage cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns null when nothing is cached", () => {
    expect(getCachedSvgSprite(TEST_URL)).toBeNull();
  });

  it("round-trips data through cache and retrieval", () => {
    cacheSvgSprite(TEST_URL, '<svg><symbol id="a"/></svg>', "1.0.0");
    const result = getCachedSvgSprite(TEST_URL);
    expect(result).not.toBeNull();
    expect(result?.data).toBe('<svg><symbol id="a"/></svg>');
    expect(result?.version).toBe("1.0.0");
  });

  it("returns null after clearCachedSvgSprite", () => {
    cacheSvgSprite(TEST_URL, "<svg/>", "1.0.0");
    clearCachedSvgSprite(TEST_URL);
    expect(getCachedSvgSprite(TEST_URL)).toBeNull();
  });

  it("returns null for an expired cache entry", () => {
    const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;
    const expired: CachedSvgSprite = {
      data: "<svg/>",
      version: "1.0.0",
      timestamp: Date.now() - thirtyOneDays,
    };
    localStorage.setItem(getCacheKey(TEST_URL), JSON.stringify(expired));
    localStorage.setItem(getVersionKey(TEST_URL), "1.0.0");
    expect(getCachedSvgSprite(TEST_URL)).toBeNull();
  });
});

describe("hasVersionChanged", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns true when nothing is cached", () => {
    expect(hasVersionChanged(TEST_URL, "2.0.0")).toBe(true);
  });

  it("returns false when cached version matches", () => {
    cacheSvgSprite(TEST_URL, "<svg/>", "1.0.0");
    expect(hasVersionChanged(TEST_URL, "1.0.0")).toBe(false);
  });

  it("returns true when cached version differs", () => {
    cacheSvgSprite(TEST_URL, "<svg/>", "1.0.0");
    expect(hasVersionChanged(TEST_URL, "2.0.0")).toBe(true);
  });
});
