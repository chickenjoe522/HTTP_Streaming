const PROVIDER_NAME = "VidSrc";

/**
 * HTTP Streaming - VidSrc
 *
 * Nuvio provider interface.
 * Playback integration is intentionally left
 * for an authorized stream source.
 */

function getStreams(tmdbId, mediaType, season, episode) {
    console.log(
        `[${PROVIDER_NAME}] Request:`,
        mediaType,
        tmdbId,
        season,
        episode
    );

    // No third-party stream extraction here.
    // Connect an authorized playback API here.

    return Promise.resolve([]);
}

module.exports = {
    getStreams
};
