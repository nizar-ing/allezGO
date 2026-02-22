// src/utils/pricingHelpers.js

/**
 * Pricing Helper Functions
 *
 * Centralizes all price extraction and formatting logic for destination cards
 * and hotel listings. No component-specific logic here — pure functions only.
 */

// ─── Price Extraction ──────────────────────────────────────────────────────────

/**
 * Extracts all available numeric prices from a destination's pricing object.
 * Handles all known pricing shapes: flat triple/double, hotel3Star, hotel4Star.
 * @param {Object} pricing - destination.pricing
 * @returns {number[]} Array of all valid prices found
 */
export const getAllPrices = (pricing) => {
    if (!pricing || typeof pricing !== "object") return [];

    const prices = [];

    // Flat pricing: { double: 15000, triple: 12000 }
    if (typeof pricing.double === "number") prices.push(pricing.double);
    if (typeof pricing.triple === "number") prices.push(pricing.triple);

    // Nested hotel-tier pricing: { hotel3Star: { double, triple }, hotel4Star: { double, triple } }
    const tiers = ["hotel3Star", "hotel4Star", "hotel5Star"];
    tiers.forEach((tier) => {
        if (pricing[tier] && typeof pricing[tier] === "object") {
            if (typeof pricing[tier].double === "number") prices.push(pricing[tier].double);
            if (typeof pricing[tier].triple === "number") prices.push(pricing[tier].triple);
        }
    });

    return prices.filter((p) => p > 0);
};

/**
 * Returns the lowest available starting price for a destination.
 * Works for any destination ID — no hardcoded ID checks.
 * Returns null if no valid pricing data is found.
 * @param {Object} destination - Full destination object with a .pricing property
 * @returns {number|null}
 */
export const getStartingPrice = (destination) => {
    if (!destination?.pricing) return null;
    const prices = getAllPrices(destination.pricing);
    if (prices.length === 0) return null;
    return Math.min(...prices);
};

// ─── Price Formatting ──────────────────────────────────────────────────────────

/**
 * Formats a numeric price for display with locale-aware thousand separators.
 * @param {number|null} price
 * @param {string} currency  Currency code, default "DZD"
 * @param {string} locale    BCP 47 locale tag, default "fr-DZ"
 * @returns {string} e.g. "15 000 DZD" or "—" if price is null
 */
export const formatPrice = (price, currency = "DZD", locale = "fr-DZ") => {
    if (price === null || price === undefined || isNaN(price)) return "—";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

/**
 * Returns a "À partir de X DZD" label for a destination.
 * Convenience wrapper used directly in card components.
 * @param {Object} destination
 * @param {string} currency
 * @returns {string}
 */
export const getStartingPriceLabel = (destination, currency = "DZD") => {
    const price = getStartingPrice(destination);
    if (price === null) return "Prix sur demande";
    return `À partir de ${formatPrice(price, currency)}`;
};
