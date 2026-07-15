import artistConfig from './artist.config';

// Cross-platform IDs for the current artist. Every integration resolves its
// own ID by searching the upstream API for `artistConfig.artistName` and
// caches the result in-process — we deliberately don't hardcode IDs here,
// since a wrong hardcoded ID fails silently forever while a search-based
// lookup self-corrects if the artist name ever changes.
//
// If auto-resolution ever picks the wrong entity (common names, disambig
// pages), pin the exact ID with these env vars to skip the search step.
export const artistIdentifiers = {
  name: artistConfig.artistName,
  musicbrainzMbid: process.env.CHARLI_MUSICBRAINZ_MBID || null,
  wikidataQid: process.env.CHARLI_WIKIDATA_QID || null,
  spotifyArtistId: process.env.CHARLI_SPOTIFY_ARTIST_ID || null,
  youtubeChannelId: process.env.CHARLI_YOUTUBE_CHANNEL_ID || null,
  geniusArtistId: process.env.CHARLI_GENIUS_ARTIST_ID || null,
  discogsArtistId: process.env.CHARLI_DISCOGS_ARTIST_ID || null,
  subreddit: process.env.CHARLI_SUBREDDIT || 'charlixcx',
};
