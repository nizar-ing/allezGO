// src/utils/normalizeHotel.js

const FALLBACK_IMAGE = 'https://loremflickr.com/600/400/hotel,luxury?lock=42';

/**
 * Resolves Album entries to plain URL strings regardless of
 * whether the API returned string[] or {Url, Alt}[]
 */
const pickAlbumUrls = (album) => {
    if (!Array.isArray(album)) return [];
    return album
        .map(x => (typeof x === 'string' ? x : x?.Url ?? x?.url))
        .filter(Boolean);
};

/**
 * Normalizes any raw hotel object (from listHotelEnhanced, searchHotel,
 * getHotelsBatch…) into the single "HotelCard" contract consumed by
 * HotelLightCard, HotelsFiltering, and banner images.
 *
 * Contract:
 *   Id          → number
 *   Name        → string
 *   Category    → { Star?: number } | null
 *   City        → { Name?, Country?: { Name? } } | null
 *   Image       → string | null  (first usable URL)
 *   Album       → string[]       (always flat URL strings)
 *   Facilities  → any[]
 *   Theme       → any[]
 *   ShortDescription / Description → string
 */
export function normalizeHotelForCard(rawHotel) {
    const h = rawHotel ?? {};

    const albumUrls = pickAlbumUrls(h.Album);
    const imageUrl =
        (typeof h.Image === 'string' && h.Image.trim() ? h.Image.trim() : null) ??
        albumUrls[0] ??
        null;

    // Keep Album as a string[] — HotelLightCard does Album[0]
    const normalizedAlbum = albumUrls.length
        ? albumUrls
        : imageUrl ? [imageUrl] : [];

    if (import.meta.env.DEV) {
        if (normalizedAlbum.length && typeof normalizedAlbum[0] !== 'string')
            console.warn('[normalizeHotelForCard] Album[0] is not a string', h);
    }

    return {
        ...h,
        Id:               Number(h.Id),
        Name:             h.Name             ?? '',
        Category:         h.Category         ?? null,
        City:             h.City             ?? null,
        ShortDescription: h.ShortDescription ?? h.Description ?? '',
        Description:      h.Description      ?? h.ShortDescription ?? '',
        Adress:           h.Adress           ?? h.Address ?? '',
        Address:          h.Address          ?? h.Adress  ?? '',
        Image:            imageUrl,
        Album:            normalizedAlbum,
        Facilities:       Array.isArray(h.Facilities) ? h.Facilities : [],
        Theme:            Array.isArray(h.Theme)       ? h.Theme       : [],
    };
}
