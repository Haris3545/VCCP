// YouTube Data API v3 — views, subscribers, video metadata. Free API key
// from Google Cloud Console (enable "YouTube Data API v3").
// Env: YOUTUBE_API_KEY
import { fetchJson, memoize, live, unavailable } from './http';
import { artistIdentifiers } from '../artist.identifiers';

const BASE = 'https://www.googleapis.com/youtube/v3';

function hasCredentials() {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

async function resolveChannelId() {
  if (artistIdentifiers.youtubeChannelId) return artistIdentifiers.youtubeChannelId;
  return memoize('youtube:channelId', 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/search?part=snippet&q=${encodeURIComponent(
      artistIdentifiers.name
    )}&type=channel&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`;
    const data = await fetchJson(url);
    const best = data.items?.[0];
    if (!best) throw new Error('no YouTube channel match');
    return best.id.channelId;
  });
}

export async function getChannelOverview() {
  if (!hasCredentials()) return unavailable('missing YOUTUBE_API_KEY');
  try {
    const channelId = await resolveChannelId();
    return await memoize(`youtube:overview:${channelId}`, 30 * 60 * 1000, async () => {
      const channelUrl = `${BASE}/channels?part=statistics,snippet,contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`;
      const channelData = await fetchJson(channelUrl);
      const channel = channelData.items?.[0];
      if (!channel) throw new Error('channel not found');

      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      let recentVideos = [];
      if (uploadsPlaylistId) {
        const playlistUrl = `${BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`;
        const playlistData = await fetchJson(playlistUrl);
        const videoIds = (playlistData.items || [])
          .map((item) => item.snippet?.resourceId?.videoId)
          .filter(Boolean);
        if (videoIds.length) {
          const videosUrl = `${BASE}/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${process.env.YOUTUBE_API_KEY}`;
          const videosData = await fetchJson(videosUrl);
          recentVideos = (videosData.items || []).map((v) => ({
            id: v.id,
            title: v.snippet?.title,
            publishedAt: v.snippet?.publishedAt,
            viewCount: Number(v.statistics?.viewCount ?? 0),
            likeCount: Number(v.statistics?.likeCount ?? 0),
            commentCount: Number(v.statistics?.commentCount ?? 0),
            thumbnailUrl: v.snippet?.thumbnails?.medium?.url || null,
          }));
        }
      }

      return live({
        channelId,
        title: channel.snippet?.title,
        subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
        viewCount: Number(channel.statistics?.viewCount ?? 0),
        videoCount: Number(channel.statistics?.videoCount ?? 0),
        recentVideos,
      });
    });
  } catch (err) {
    return unavailable(`YouTube fetch failed: ${err.message}`);
  }
}
