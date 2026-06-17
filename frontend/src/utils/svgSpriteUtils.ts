import { CachedSvgSprite } from "../types/svg-sprite";

const CACHE_KEY_PREFIX = "svg-sprite-cache-";
const CACHE_VERSION_KEY = "svg-sprite-version-";
const CACHE_EXPIRY_DAYS = 30;

// Track loading states to prevent duplicate requests
const loadingSprites = new Set<string>();

// Track loaded sprites to prevent duplicate loading across component re-mounts
const loadedSprites = new Set<string>();

/**
 * Generate cache key for SVG sprite
 */
export const getCacheKey = (url: string): string => {
  return `${CACHE_KEY_PREFIX}${btoa(url)}`;
};

/**
 * Generate version cache key for SVG sprite
 */
export const getVersionKey = (url: string): string => {
  return `${CACHE_VERSION_KEY}${btoa(url)}`;
};

/**
 * Check if cached data is still valid
 */
export const isCacheValid = (cachedData: CachedSvgSprite): boolean => {
  const now = Date.now();
  const cacheAge = now - cachedData.timestamp;
  const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  return cacheAge < maxAge;
};

/**
 * Get cached SVG sprite data
 */
export const getCachedSvgSprite = (url: string): CachedSvgSprite | null => {
  try {
    const cacheKey = getCacheKey(url);
    const versionKey = getVersionKey(url);

    const cachedData = localStorage.getItem(cacheKey);
    const cachedVersion = localStorage.getItem(versionKey);

    if (!cachedData || !cachedVersion) {
      return null;
    }

    const parsedData = JSON.parse(cachedData) as CachedSvgSprite;

    // Check if cache is still valid
    if (!isCacheValid(parsedData)) {
      // Remove expired cache
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(versionKey);
      return null;
    }

    return parsedData;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to retrieve cached SVG sprite:", error);
    }
    return null;
  }
};

/**
 * Cache SVG sprite data
 */
export const cacheSvgSprite = (
  url: string,
  data: string,
  version: string,
): void => {
  try {
    const cacheKey = getCacheKey(url);
    const versionKey = getVersionKey(url);

    const cacheData: CachedSvgSprite = {
      data,
      version,
      timestamp: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    localStorage.setItem(versionKey, version);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache SVG sprite:", error);
    }
  }
};

/**
 * Clear cached SVG sprite data
 */
export const clearCachedSvgSprite = (url: string): void => {
  try {
    const cacheKey = getCacheKey(url);
    const versionKey = getVersionKey(url);

    localStorage.removeItem(cacheKey);
    localStorage.removeItem(versionKey);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to clear cached SVG sprite:", error);
    }
  }
};

/**
 * Check if version has changed
 */
export const hasVersionChanged = (url: string, newVersion: string): boolean => {
  try {
    const versionKey = getVersionKey(url);
    const cachedVersion = localStorage.getItem(versionKey);

    return cachedVersion !== newVersion;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to check version:", error);
    }
    return true;
  }
};

/**
 * Load SVG sprite from URL
 */
export const loadSvgSprite = async (url: string): Promise<string> => {
  // Check if already loading
  if (loadingSprites.has(url)) {
    // Wait for the existing request to complete (max 5 s)
    return new Promise((resolve, reject) => {
      let retries = 0;
      const MAX_RETRIES = 100; // 100 × 50 ms = 5 s
      const checkLoading = () => {
        if (!loadingSprites.has(url)) {
          const cachedData = getCachedSvgSprite(url);
          if (cachedData) {
            resolve(cachedData.data);
          } else {
            reject(new Error("Sprite loading failed"));
          }
        } else if (retries >= MAX_RETRIES) {
          reject(new Error(`Timed out waiting for sprite: ${url}`));
        } else {
          retries++;
          setTimeout(checkLoading, 50);
        }
      };
      checkLoading();
    });
  }

  loadingSprites.add(url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load SVG sprite: ${response.status} ${response.statusText}`,
      );
    }

    const svgData = await response.text();

    // Validate that it's actually SVG content
    if (!svgData.includes("<svg") || !svgData.includes("</svg>")) {
      throw new Error("Invalid SVG content received");
    }

    return svgData;
  } catch (error) {
    throw new Error(
      `Failed to load SVG sprite from ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      { cause: error },
    );
  } finally {
    loadingSprites.delete(url);
  }
};

/**
 * Inject SVG sprite into DOM
 */
export const injectSvgSprite = (
  svgData: string,
  containerId: string = "svg-sprite-container",
): void => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style.display = "none";
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);
  }

  // Only inject if the content is different or empty
  if (container.innerHTML.trim() !== svgData.trim()) {
    container.innerHTML = svgData;
  }
};

/**
 * Check if SVG sprite is already injected
 */
export const isSvgSpriteInjected = (
  containerId: string = "svg-sprite-container",
): boolean => {
  const container = document.getElementById(containerId);
  if (!container) {
    return false;
  }

  // Check if container has SVG content with symbols
  const svgElement = container.querySelector("svg");
  const hasSymbols = container.querySelector("symbol");

  return svgElement !== null && hasSymbols !== null;
};

/**
 * Clear loading state for a specific sprite URL
 */
export const clearLoadingState = (url: string): void => {
  loadingSprites.delete(url);
};

/**
 * Get current loading sprites
 */
export const getLoadingSprites = (): string[] => {
  return Array.from(loadingSprites);
};

/**
 * Check if sprite is already loaded
 */
export const isSpriteLoaded = (url: string): boolean => {
  return loadedSprites.has(url);
};

/**
 * Mark sprite as loaded
 */
export const markSpriteAsLoaded = (url: string): void => {
  loadedSprites.add(url);
};

/**
 * Clear loaded sprite state
 */
export const clearLoadedSprite = (url: string): void => {
  loadedSprites.delete(url);
};

/**
 * Get all loaded sprites
 */
export const getLoadedSprites = (): string[] => {
  return Array.from(loadedSprites);
};
