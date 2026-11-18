
"use strict";

const cheerio = require("cheerio-without-node-native");

const PROVIDER = "VidSrc";
const BASE_URL = "https://vidsrc.sh";
const USER_AGENT =
    "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

async function safeFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "User-Agent": USER_AGENT,
            "Accept": "*/*",
            ...options.headers
        },
        signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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

function normalizeUrl(url, base = BASE_URL) {
    try {
        const parsed = new URL(url, base);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
}

function createStream(url, contentType = "", metadata = {}) {
    const normalized = normalizeUrl(url);

    if (!normalized) return null;

    const container = detectContainer(normalized, contentType);

    if (container === "UNKNOWN") return null;

    return {
        name: `${PROVIDER} | ${container}`,
        title: `${PROVIDER} - ${container}`,
        url: normalized,
        quality: metadata.quality || "",
        language: metadata.language || "",
        headers: {
            "User-Agent": USER_AGENT,
            "Referer": BASE_URL + "/"
        },
        subtitles: [],
        provider: PROVIDER,
        container
    };
}

// Educational parser for explicitly supplied, authorized
// HTML containing ordinary video source elements.
function parseAuthorizedSources(html, pageUrl = BASE_URL) {
    const $ = cheerio.load(html);
    const streams = [];

    $("video source, video[src]").each((_, element) => {
        const src =
            $(element).attr("src") ||
            $(element).attr("data-src");

        if (!src) return;

        const type = $(element).attr("type") || "";
        const stream = createStream(src, type);

        if (stream) streams.push(stream);
    });

    return streams;
}

function buildEmbedUrl(tmdbId, mediaType, season, episode) {
    const id = String(tmdbId || "").replace(/\D/g, "");

    if (!id) return null;

    if (mediaType === "movie") {
        return `${BASE_URL}/embed/movie/${id}`;
    }

    if (mediaType === "tv") {
        const s = Math.max(1, Number(season) || 1);
        const e = Math.max(1, Number(episode) || 1);

        return `${BASE_URL}/embed/tv/${id}/${s}/${e}`;
    }

    return null;
}

async function getStreams(
    tmdbId,
    mediaType,
    season,
    episode
) {
    try {
        const embedUrl = buildEmbedUrl(
            tmdbId,
            mediaType,
            season,
            episode
        );

        if (!embedUrl) return [];

        console.log(`[${PROVIDER}] Embed: ${embedUrl}`);

        // Do not automatically extract protected third-party
        // player endpoints. Parse only authorized sources.
        const response = await safeFetch(embedUrl);
        const html = await response.text();

        const streams = parseAuthorizedSources(
            html,
            embedUrl
        );

        console.log(
            `[${PROVIDER}] Compatible streams: ${streams.length}`
        );

        return streams;
    } catch (error) {
        console.error(
            `[${PROVIDER}] Error:`,
            error.message
        );

        return [];
    }
}

module.exports = {
    getStreams
};
