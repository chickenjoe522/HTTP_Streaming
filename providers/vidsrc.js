
"use strict";

const cheerio = require("cheerio-without-node-native");

const PROVIDER = "VidSrc";

async function safeFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
    }

    return response;
}

function detectContainer(url, contentType = "") {
    const value = `${url} ${contentType}`.toLowerCase();

    if (
        value.includes(".m3u8") ||
        value.includes("application/vnd.apple.mpegurl") ||
        value.includes("application/x-mpegurl")
    ) return "HLS";

    if (
        value.includes(".mp4") ||
        value.includes("video/mp4")
    ) return "MP4";

    if (
        value.includes(".mkv") ||
        value.includes("matroska")
    ) return "MKV";

    if (
        value.includes(".mpd") ||
        value.includes("application/dash+xml")
    ) return "DASH";

    return "UNKNOWN";
}

function normalizeUrl(url, baseUrl) {
    try {
        const parsed = new URL(url, baseUrl);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
}

function createStream(url, contentType = "") {
    const container = detectContainer(url, contentType);

    if (container === "UNKNOWN") return null;

    return {
        name: `${PROVIDER} | ${container}`,
        title: `${PROVIDER} - ${container}`,
        url,
        quality: "",
        language: "",
        headers: {},
        subtitles: [],
        provider: PROVIDER,
        container
    };
}

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        console.log(`[${PROVIDER}] Request:`, {
            tmdbId,
            mediaType,
            season,
            episode
        });

        // Content lookup and authorized source resolution
        // should be implemented using the provider's
        // documented API and authorized media URLs.

        return [];
    } catch (error) {
        console.error(`[${PROVIDER}] Error:`, error.message);
        return [];
    }
}

module.exports = { getStreams };
