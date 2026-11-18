
"use strict";

const BASE_URL = "https://vidsrc.sh";

async function getStreams(tmdbId, type, season, episode) {
    try {
        if (!tmdbId) return [];

        const isTV =
            type === "tv" ||
            type === "series";

        let embedUrl;

        if (isTV) {
            if (!season || !episode) return [];

            embedUrl =
                `${BASE_URL}/embed/tv/` +
                `${encodeURIComponent(tmdbId)}/` +
                `${encodeURIComponent(season)}/` +
                `${encodeURIComponent(episode)}`;
        } else {
            embedUrl =
                `${BASE_URL}/embed/movie/` +
                encodeURIComponent(tmdbId);
        }

        console.log(
            `[HTTP Streaming] Embed: ${embedUrl}`
        );

        // VidSrc returns an HTML embed page.
        // Do not label it as MP4, HLS or DASH.
        // Native playback cannot decode this webpage.

        return [];

    } catch (error) {
        console.log(
            "[HTTP Streaming] Error:",
            error.message
        );

        return [];
    }
}

module.exports = { getStreams };
