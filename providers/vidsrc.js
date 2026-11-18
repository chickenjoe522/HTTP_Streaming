
"use strict";

const BASE_URL = "https://vidsrc.sh";

async function getStreams(tmdbId, type, season, episode) {
    try {
        if (!tmdbId || !type) {
            return [];
        }

        const isTV = type === "tv" || type === "series";

        let embedUrl;

        if (isTV) {
            if (!season || !episode) {
                return [];
            }

            embedUrl =
                `${BASE_URL}/embed/tv/` +
                `${encodeURIComponent(tmdbId)}/` +
                `${encodeURIComponent(season)}/` +
                `${encodeURIComponent(episode)}`;
        } else {
            embedUrl =
                `${BASE_URL}/embed/movie/` +
                `${encodeURIComponent(tmdbId)}`;
        }

        console.log(
            `[HTTP Streaming] ${type}: ${tmdbId}`
        );

        // Return the provider's public embed page.
        // No hidden stream extraction or token decoding.

        return [
            {
                name: "VidSrc",
                title: isTV
                    ? `Season ${season} Episode ${episode}`
                    : "VidSrc",
                url: embedUrl,
                behaviorHints: {
                    bingeGroup: "http-streaming-vidsrc"
                }
            }
        ];

    } catch (error) {
        console.log(
            "[HTTP Streaming] Error:",
            error.message
        );

        return [];
    }
}

module.exports = {
    getStreams
};
