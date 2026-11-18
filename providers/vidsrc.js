
"use strict";

const BASE_URL = "https://vidsrc.sh";

async function getStreams(tmdbId, type, season, episode) {
    try {
        if (!tmdbId) return [];

        const isTV = type === "tv" || type === "series";

        let infoUrl;
        let embedUrl;

        if (isTV) {
            infoUrl = season && episode
                ? `${BASE_URL}/info/tv/${tmdbId}/${season}/${episode}.json`
                : `${BASE_URL}/info/tv/${tmdbId}.json`;

            embedUrl = season && episode
                ? `${BASE_URL}/embed/tv/${tmdbId}/${season}/${episode}`
                : `${BASE_URL}/embed/tv/${tmdbId}`;
        } else {
            infoUrl = `${BASE_URL}/info/movie/${tmdbId}.json`;
            embedUrl = `${BASE_URL}/embed/movie/${tmdbId}`;
        }

        const response = await fetch(infoUrl);

        if (!response.ok) {
            console.log("[HTTP Streaming] Title unavailable:", response.status);
            return [];
        }

        const info = await response.json();

        if (info.status_code !== 200 || !info.embed_url) {
            return [];
        }

        return [{
            name: "VidSrc",
            title: info.title || "VidSrc",
            url: embedUrl,
            externalUrl: embedUrl,
            description: info.quality || "External player",
            behaviorHints: {
                bingeGroup: "http-streaming-vidsrc"
            }
        }];

    } catch (error) {
        console.log("[HTTP Streaming]", error.message);
        return [];
    }
}

module.exports = { getStreams };
