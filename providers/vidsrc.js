
"use strict";

const PROVIDER = "VidSrc";

const DEFAULT_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36",
    "Referer": "https://vidsrc.sh/"
};

const TIMEOUT = 12000;

async function safeFetch(url, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        TIMEOUT
    );

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...DEFAULT_HEADERS,
                ...(options.headers || {})
            },
            signal: controller.signal,
            redirect: "follow"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response;
    } finally {
        clearTimeout(timeout);
    }
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

function detectContainer(url, contentType = "") {
    const path = String(url)
        .split("?")[0]
        .split("#")[0]
        .toLowerCase();

    const mime = String(contentType)
        .split(";")[0]
        .trim()
        .toLowerCase();

    if (
        path.endsWith(".m3u8") ||
        mime.includes("mpegurl")
    ) {
        return "HLS";
    }

    if (
        path.endsWith(".mpd") ||
        mime === "application/dash+xml"
    ) {
        return "DASH";
    }

    if (
        path.endsWith(".mp4") ||
        mime === "video/mp4"
    ) {
        return "MP4";
    }

    if (
        path.endsWith(".mkv") ||
        mime.includes("matroska")
    ) {
        return "MKV";
    }

    return "UNKNOWN";
}

function isHtmlResponse(contentType = "") {
    const type = String(contentType).toLowerCase();

    return (
        type.includes("text/html") ||
        type.includes("application/xhtml")
    );
}

function createStream(url, container, headers = {}) {
    return {
        name: `${PROVIDER} | ${container}`,
        title: `${PROVIDER} - ${container}`,
        url,
        quality: "",
        language: "",
        headers: {
            ...DEFAULT_HEADERS,
            ...headers
        },
        subtitles: [],
        provider: PROVIDER
    };
}

async function validateStream(url, headers = {}) {
    try {
        const response = await safeFetch(url, {
            method: "HEAD",
            headers
        });

        const contentType =
            response.headers.get("content-type") || "";

        if (isHtmlResponse(contentType)) {
            return null;
        }

        const container = detectContainer(
            response.url || url,
            contentType
        );

        if (container === "UNKNOWN") {
            return null;
        }

        return createStream(
            response.url || url,
            container,
            headers
        );
    } catch (error) {
        console.warn(
            `[${PROVIDER}] Validation failed:`,
            error.message
        );

        return null;
    }
}

async function getStreams(
    tmdbId,
    mediaType,
    season,
    episode
) {
    try {
        console.log(`[${PROVIDER}] Request`, {
            tmdbId,
            mediaType,
            season,
            episode
        });

        /*
         * SOURCE EXTRACTION INTEGRATION
         *
         * This is where the authorized VidSrc
         * source resolver must provide media URLs.
         *
         * Expected source format:
         *
         * [
         *   {
         *     url: "https://example.com/video.mp4",
         *     headers: {}
         *   }
         * ]
         */

        const resolvedSources = [];

        const streams = [];

        for (const source of resolvedSources) {
            if (!source || !source.url) continue;

            const url = normalizeUrl(
                source.url,
                "https://vidsrc.sh/"
            );

            if (!url) continue;

            const stream = await validateStream(
                url,
                source.headers || {}
            );

            if (stream) {
                streams.push(stream);
            }
        }

        console.log(
            `[${PROVIDER}] Streams found:`,
            streams.length
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
