// ─── Ambiance presets (24/7 YouTube streams) ──────────────────────────────────
const AMBIANCE_VIBES = [
    {
        id: 'lofi',
        label: 'Lofi Beats',
        subtitle: 'Lofi Girl · 24/7',
        url: 'https://www.youtube.com/watch?v=X4VbdwhkE10',
        icon: 'fa-compact-disc',
        thumb: 'https://i.ytimg.com/vi/X4VbdwhkE10/hqdefault.jpg'
    },
    {
        id: 'forest',
        label: 'Enchanted Forest',
        subtitle: 'Nature ambience · 24/7',
        url: 'https://www.youtube.com/watch?v=Tbca_a03UL8',
        icon: 'fa-tree',
        thumb: 'https://i.ytimg.com/vi/Tbca_a03UL8/hqdefault.jpg'
    },
    {
        id: 'cafe',
        label: 'Cafe',
        subtitle: 'Coffee shop · 24/7',
        url: 'https://www.youtube.com/watch?v=gUbNlN_SqpE',
        icon: 'fa-mug-hot',
        thumb: 'https://i.ytimg.com/vi/gUbNlN_SqpE/hqdefault.jpg'
    },
    {
        id: 'fireplace',
        label: 'Fireplace',
        subtitle: 'Cozy crackling · 24/7',
        url: 'https://www.youtube.com/watch?v=mSX3OyW9Rao',
        icon: 'fa-fire',
        thumb: 'https://i.ytimg.com/vi/mSX3OyW9Rao/hqdefault.jpg'
    },
    {
        id: 'iss',
        label: 'ISS Live',
        subtitle: 'Earth from space · NASA live',
        url: 'https://www.youtube.com/watch?v=awQzjn72bI0',
        icon: 'fa-satellite',
        thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=200&q=80'
    }
];

const GUIDE_CATEGORIES = {
    streaming: 'Streaming',
    livetv: 'Live TV',
    vibes: 'Vibes'
};

const GUIDE_CATEGORY_ORDER = { streaming: 0, livetv: 1, vibes: 2 };

const SORT_GROUP_LABELS = {
    'twitch-game-live': 'Twitch Games',
    'twitch-streamer': 'Twitch Streamers',
    'roku-linear': 'Linear TV',
    'pluto': 'Pluto TV',
    'youtube-247': '24/7 Streams',
    'youtube-live': 'YouTube Live',
    'direct-link': 'Direct Links'
};

const TAB_GROUP_ORDER = {
    streaming: ['twitch-game-live', 'twitch-streamer', 'direct-link'],
    livetv: ['roku-linear', 'pluto', 'youtube-live', 'youtube-247', 'direct-link'],
    vibes: ['youtube-247', 'youtube-live', 'direct-link']
};

const DEFAULT_CHANNELS = [
    {
        id: 'roku-cc',
        title: 'Comedy Central',
        platform: 'roku',
        linkType: 'roku-linear',
        guideCategory: 'livetv',
        url: 'https://therokuchannel.roku.com/watch/3d3f3113ff49ca22c3ad51ee00fe7e9d',
        thumbnail: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=200&q=80',
        isActive: true,
        rokuContentId: '3d3f3113ff49ca22c3ad51ee00fe7e9d'
    },
    {
        id: 'twitch-planet-zoo',
        title: 'Planet Zoo',
        platform: 'twitch',
        linkType: 'twitch-game-live',
        guideCategory: 'streaming',
        gameName: 'Planet Zoo',
        url: 'https://www.twitch.tv/directory/game/Planet%20Zoo',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
        isActive: true
    }
];

const LINK_TYPE_LABELS = {
    'ambiance': 'Ambiance Picker',
    'roku-linear': 'Roku Linear',
    'youtube-247': 'YouTube 24/7',
    'twitch-game-live': 'Twitch Game → 1st EN Live',
    'twitch-streamer': 'Twitch Streamer',
    'channel': 'Direct Link'
};

const PLATFORM_STYLES = {
    twitch: 'text-twitch bg-twitch/15 border-twitch/30',
    youtube: 'text-red-400 bg-youtube/15 border-youtube/30',
    pluto: 'text-pluto bg-pluto/15 border-pluto/30',
    roku: 'text-purple-300 bg-roku/15 border-roku/30'
};

const TWITCH_RESERVED = new Set([
    'directory', 'search', 'videos', 'settings', 'downloads', 'signup',
    'login', 'p', 'clip', 'collections', 'events', 'team', 'communities', 'popout'
]);

const STORAGE_KEY = 'omnistream_channels';
const STORAGE_VERSION_KEY = 'omnistream_storage_version';
const STORAGE_VERSION = 9;
const SITE_GUIDE_URL = 'channels.json';
const GUIDE_REVISION_KEY = 'omnistream_guide_revision';
const TWITCH_ID_KEY = 'omnistream_twitch_client_id';
const TWITCH_SECRET_KEY = 'omnistream_twitch_client_secret';
const YOUTUBE_API_KEY = 'omnistream_youtube_api_key';

const INNERTUBE_CLIENT = {
    clientName: 'WEB',
    clientVersion: '2.20250220.01.00',
    hl: 'en',
    gl: 'US'
};

let channels = [];
let activeFilter = 'streaming';
let searchQuery = '';
let isRefreshing = false;
let twitchAccessToken = null;
let twitchTokenExpiry = 0;
let rokuRefreshTimer = null;

const ROKU_CORS_PROXY = 'https://corsproxy.io/?';
// Roku homescreen path uses partially-encoded inner URLs — template keeps encoding exact.
const ROKU_HOMESCREEN_TEMPLATE =
    'https://therokuchannel.roku.com/api/v2/homescreen/content/https%3A%2F%2Fcontent.sr.roku.com%2Fcontent%2Fv1%2Froku-trc%2F__CONTENT_ID__%3Fexpand%3Dnext%252Ccredits%252Cnext.series%252CviewOptions%252CcategoryObjects%252CviewOptions.providerDetails%252Cseries%252Cseason%252Cepisodes%252Cseason.episodes%252Cseason.episodes.viewOptions.providerDetails%252Cseasons.episodes.viewOptions.providerDetails%26include%3Dtype%252Ctitle%252Cseries.title%252CepisodeNumber%252CseasonNumber%26filter%3DcategoryObjects%253AgenreAppropriate%252520eq%252520true%252Cseasons.episodes%253A%2528not%252520empty%2528viewOptions%2529%2529%253Aall%26featureInclude%3Dbookmark%252Cwatchlist%252ClinearSchedule';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_CHANNELS));
}

function extractRokuContentId(url) {
    const m = (url || '').match(/therokuchannel\.roku\.com\/watch\/([a-f0-9]+)/i);
    return m ? m[1] : '';
}

function extractTwitchLogin(url) {
    const m = (url || '').match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
    return m ? m[1] : '';
}

function isTwitchDirectUrl(url) {
    const login = extractTwitchLogin(url);
    if (!login) return false;
    return !TWITCH_RESERVED.has(login.toLowerCase());
}

function isTwitchLiveChannel(ch) {
    if (ch.linkType === 'twitch-streamer') return true;
    if (ch.linkType === 'channel' && isTwitchDirectUrl(ch.url)) return true;
    return false;
}

function supportsBroadcastMode(ch) {
    return isTwitchLiveChannel(ch);
}

function isTwitch247Channel(ch) {
    return supportsBroadcastMode(ch) && ch.broadcastMode === '247';
}

function shouldCheckTwitchLive(ch) {
    return isTwitchLiveChannel(ch) && !isTwitch247Channel(ch);
}

function getTwitchLogin(ch) {
    return (ch.twitchChannel || extractTwitchLogin(ch.url) || '').replace(/^@/, '');
}

function extractYouTubeVideoId(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            return u.pathname.slice(1).split('/')[0] || '';
        }
        const v = u.searchParams.get('v');
        if (v) return v;
        const pathMatch = u.pathname.match(/\/(?:live|embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
        if (pathMatch) return pathMatch[1];
    } catch (_) { /* invalid url */ }
    const m = (url || '').match(/(?:v=|\/vi\/|youtu\.be\/|\/embed\/|\/live\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : '';
}

function isYouTubeLiveChannel(ch) {
    if (ch.linkType === 'youtube-247') return true;
    return !!extractYouTubeVideoId(ch.url);
}

function shouldCheckYouTubeLive(ch) {
    return isYouTubeLiveChannel(ch) && normalizeBroadcastMode(ch.broadcastMode, ch) !== '247';
}

function getYouTubeVideoId(ch) {
    return ch.youtubeVideoId || extractYouTubeVideoId(ch.url);
}

function extractGameName(url, fallbackTitle) {
    if (!url) return fallbackTitle || '';
    try {
        const u = new URL(url);
        const term = u.searchParams.get('term');
        if (term) return decodeURIComponent(term.replace(/\+/g, ' '));
        const parts = u.pathname.split('/').filter(Boolean);
        const idx = parts.findIndex(p => p === 'game' || p === 'category');
        if (idx >= 0 && parts[idx + 1]) {
            return decodeURIComponent(parts[idx + 1].replace(/-/g, ' '));
        }
    } catch (_) { /* invalid */ }
    return fallbackTitle || '';
}

function migrateLinkType(ch) {
    const t = ch.linkType;
    if (t === 'ambiance') return null;
    if (t === 'youtube-live') return 'channel';
    if (t === 'twitch-game') return 'twitch-game-live';
    return t || null;
}

function detectLinkType(ch) {
    const migrated = migrateLinkType(ch);
    if (migrated === null) return null;
    if (migrated) return migrated;
    if (ch.platform === 'roku' && extractRokuContentId(ch.url)) return 'roku-linear';
    if (ch.platform === 'youtube' && /youtube\.com\/watch/i.test(ch.url || '')) return 'youtube-247';
    if (ch.platform !== 'twitch') return 'channel';

    const url = ch.url || '';
    if (/directory\/(game|category)/i.test(url) || /search\?term=/i.test(url)) return 'twitch-game-live';
    const login = extractTwitchLogin(url);
    if (login && !TWITCH_RESERVED.has(login.toLowerCase())) return 'twitch-streamer';
    return 'channel';
}

function normalizeChannel(ch, index) {
    if (ch.linkType === 'ambiance') return null;
    const detected = detectLinkType(ch);
    if (detected === null) return null;
    const linkType = ch.linkType || detected;
    const normalized = {
        id: ch.id || `ch-${index}-${Date.now()}`,
        title: ch.title || 'Untitled',
        platform: ch.platform || 'youtube',
        linkType,
        url: ch.url || '',
        thumbnail: ch.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        isActive: ch.isActive !== false && ch.isActive !== 'false',
        twitchChannel: ch.twitchChannel || '',
        gameName: ch.gameName || '',
        nowPlaying: ch.nowPlaying || '',
        rokuContentId: ch.rokuContentId || extractRokuContentId(ch.url) || '',
        isLive: false,
        streamTitle: '',
        liveChecked: false,
        guideSubtitle: ch.guideSubtitle || '',
        resolvedTwitchLogin: ch.resolvedTwitchLogin || '',
        resolvedTwitchTitle: ch.resolvedTwitchTitle || '',
        guideCategory: '',
        sortOrder: typeof ch.sortOrder === 'number' ? ch.sortOrder : index
    };

    if (linkType === 'twitch-streamer' && !normalized.twitchChannel) {
        normalized.twitchChannel = extractTwitchLogin(normalized.url);
    }
    if (linkType === 'twitch-game-live' && !normalized.gameName) {
        normalized.gameName = extractGameName(normalized.url, normalized.title);
    }
    if (linkType === 'twitch-streamer' || linkType === 'twitch-game-live') {
        normalized.platform = 'twitch';
    } else if (linkType === 'roku-linear') {
        normalized.platform = 'roku';
    } else if (linkType === 'youtube-247') {
        normalized.platform = 'youtube';
    }
    if (linkType === 'youtube-247') {
        normalized.guideSubtitle = normalized.guideSubtitle || '24/7 stream';
    }

    normalized.guideCategory = normalizeGuideCategory(ch.guideCategory, normalized);
    normalized.broadcastMode = normalizeBroadcastMode(ch.broadcastMode, normalized);
    return normalized;
}

function normalizeBroadcastMode(value, ch) {
    if (value === '247' || value === 'always-on' || value === '24/7') return '247';
    if (value === 'live') return 'live';
    if (ch.linkType === 'youtube-247') return '247';
    return 'live';
}

function normalizeGuideCategory(value, ch) {
    if (value && GUIDE_CATEGORIES[value]) return value;
    return inferDefaultGuideCategory(ch);
}

/** Guess a tab only when guideCategory is missing (new/migrated channels) */
function inferDefaultGuideCategory(ch) {
    const linkType = ch.linkType || detectLinkType(ch) || 'channel';
    const url = (ch.url || '').toLowerCase();

    if (linkType === 'twitch-game-live' || linkType === 'twitch-streamer') return 'streaming';
    if (linkType === 'roku-linear') return 'livetv';
    if (linkType === 'youtube-247') return 'vibes';

    if (linkType === 'channel') {
        if (/twitch\.tv/i.test(url)) return 'streaming';
        if (/therokuchannel\.roku\.com|pluto\.tv/i.test(url)) return 'livetv';
        if (/youtube\.com|youtu\.be/i.test(url)) return 'vibes';
    }

    if (ch.platform === 'twitch') return 'streaming';
    if (ch.platform === 'roku' || ch.platform === 'pluto') return 'livetv';
    if (ch.platform === 'youtube') return 'vibes';

    if (/twitch\.tv/i.test(url)) return 'streaming';
    if (/therokuchannel|pluto\.tv/i.test(url)) return 'livetv';
    if (/youtube\.com|youtu\.be/i.test(url)) return 'vibes';

    return 'streaming';
}

/** Which guide tab a channel appears on — user-set guideCategory wins */
function getChannelCategory(ch) {
    if (ch.guideCategory && GUIDE_CATEGORIES[ch.guideCategory]) return ch.guideCategory;
    return inferDefaultGuideCategory(ch);
}

function getChannelSortGroup(ch) {
    const linkType = ch.linkType || 'channel';
    if (linkType === 'twitch-game-live') return 'twitch-game-live';
    if (linkType === 'twitch-streamer') return 'twitch-streamer';
    if (linkType === 'roku-linear') return 'roku-linear';
    if (linkType === 'youtube-247') return 'youtube-247';

    if (linkType === 'channel') {
        if (isTwitchDirectUrl(ch.url)) return 'twitch-streamer';
        if (extractYouTubeVideoId(ch.url)) return 'youtube-live';
        if (/pluto\.tv/i.test(ch.url || '')) return 'pluto';
        if (/therokuchannel/i.test(ch.url || '')) return 'roku-linear';
    }
    return 'direct-link';
}

function compareSortGroups(a, b, tab) {
    const order = TAB_GROUP_ORDER[tab] || TAB_GROUP_ORDER.streaming;
    const ga = getChannelSortGroup(a);
    const gb = getChannelSortGroup(b);
    const ia = order.indexOf(ga);
    const ib = order.indexOf(gb);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
}

function sortChannelsForGuide(list, tab) {
    return [...list].sort((a, b) => {
        const groupCmp = compareSortGroups(a, b, tab);
        if (groupCmp !== 0) return groupCmp;
        const orderCmp = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (orderCmp !== 0) return orderCmp;
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
    });
}

function sortChannelsForEditor(list) {
    return [...list].sort((a, b) => {
        const catA = GUIDE_CATEGORY_ORDER[getChannelCategory(a)] ?? 99;
        const catB = GUIDE_CATEGORY_ORDER[getChannelCategory(b)] ?? 99;
        if (catA !== catB) return catA - catB;
        const groupCmp = compareSortGroups(a, b, getChannelCategory(a));
        if (groupCmp !== 0) return groupCmp;
        const orderCmp = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (orderCmp !== 0) return orderCmp;
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
    });
}

function appendGuideGroupHeader(container, groupKey) {
    const label = SORT_GROUP_LABELS[groupKey] || groupKey;
    const header = document.createElement('div');
    header.className = 'px-4 sm:px-5 py-2 bg-gray-900/40 border-b border-gray-800/60';
    header.innerHTML = `<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">${escapeHtml(label)}</span>`;
    container.appendChild(header);
}

function canSwapChannelOrder(a, b) {
    if (!a || !b) return false;
    return getChannelCategory(a) === getChannelCategory(b)
        && getChannelSortGroup(a) === getChannelSortGroup(b);
}

function getNextSortOrder(ch) {
    const cat = getChannelCategory(ch);
    const group = getChannelSortGroup(ch);
    const peers = channels.filter(c =>
        getChannelCategory(c) === cat && getChannelSortGroup(c) === group
    );
    if (peers.length === 0) return 0;
    return Math.max(...peers.map(c => c.sortOrder ?? 0)) + 1;
}

function serializeChannel(ch) {
    return {
        id: ch.id,
        title: ch.title,
        platform: ch.platform,
        linkType: ch.linkType,
        url: ch.url,
        thumbnail: ch.thumbnail,
        isActive: ch.isActive !== false,
        twitchChannel: ch.twitchChannel || '',
        gameName: ch.gameName || '',
        nowPlaying: ch.nowPlaying || '',
        rokuContentId: ch.rokuContentId || '',
        guideSubtitle: ch.guideSubtitle || '',
        guideCategory: ch.guideCategory || inferDefaultGuideCategory(ch),
        sortOrder: typeof ch.sortOrder === 'number' ? ch.sortOrder : 0,
        broadcastMode: normalizeBroadcastMode(ch.broadcastMode, ch)
    };
}

function persistChannels() {
    try {
        const payload = channels.map(serializeChannel);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
        return true;
    } catch (e) {
        showToast('Could not save — storage blocked or full', 'error');
        return false;
    }
}

function readRowDraft(row) {
    const draft = {};
    row.querySelectorAll('input, select').forEach((input) => {
        const field = input.dataset.field;
        if (!field) return;
        if (input.type === 'checkbox') draft[field] = input.checked;
        else if (field === 'extra') draft._extra = input.value.trim();
        else draft[field] = input.value;
    });
    return draft;
}

function channelsFromRawList(list) {
    return list.map((ch, i) => normalizeChannel(ch, i)).filter(Boolean);
}

function isLikelyBuiltinDefaults(list) {
    if (!list || list.length === 0) return true;
    if (list.length > DEFAULT_CHANNELS.length) return false;
    const defaultIds = new Set(DEFAULT_CHANNELS.map(c => c.id));
    return list.every(ch => defaultIds.has(ch.id));
}

function loadLocalChannels() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        return channelsFromRawList(parsed);
    } catch (_) {
        return null;
    }
}

async function fetchSiteGuide() {
    try {
        const res = await fetch(`${SITE_GUIDE_URL}?v=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data)) {
            return { revision: 0, channels: channelsFromRawList(data) };
        }
        if (data && Array.isArray(data.channels)) {
            return {
                revision: Number(data.revision) || 0,
                channels: channelsFromRawList(data.channels)
            };
        }
    } catch (_) { /* missing file or offline */ }
    return null;
}

async function applySiteGuide(siteGuide, { persistRevision = true } = {}) {
    if (!siteGuide?.channels?.length) return false;
    channels = siteGuide.channels;
    if (persistRevision) {
        localStorage.setItem(GUIDE_REVISION_KEY, String(siteGuide.revision ?? 0));
    }
    persistChannels();
    return true;
}

async function bootstrapChannels() {
    const siteGuide = await fetchSiteGuide();
    const siteRevision = siteGuide?.revision ?? 0;
    const storedRevision = Number(localStorage.getItem(GUIDE_REVISION_KEY) || 0);
    const localChannels = loadLocalChannels();

    if (siteGuide?.channels?.length) {
        const siteIsNewer = siteRevision > storedRevision;
        const localIsStale = !localChannels || isLikelyBuiltinDefaults(localChannels);
        if (siteIsNewer || localIsStale) {
            await applySiteGuide(siteGuide);
            return siteIsNewer ? 'site-update' : 'site';
        }
    }

    if (localChannels?.length) {
        channels = localChannels;
        return 'local';
    }

    if (siteGuide?.channels?.length) {
        await applySiteGuide(siteGuide);
        return 'site';
    }

    channels = channelsFromRawList(cloneDefaults());
    persistChannels();
    return 'defaults';
}

function loadChannels() {
    const localChannels = loadLocalChannels();
    if (localChannels?.length) return localChannels;
    return channelsFromRawList(cloneDefaults());
}

function isChannelActive(ch) {
    return ch.isActive !== false && ch.isActive !== 'false';
}

function openChannelUrl(url) {
    if (!url) return;
    const tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (tab) tab.focus();
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Twitch API ─────────────────────────────────────────────────────────────
async function getTwitchAccessToken() {
    const clientId = localStorage.getItem(TWITCH_ID_KEY) || '';
    const clientSecret = localStorage.getItem(TWITCH_SECRET_KEY) || '';
    if (!clientId || !clientSecret) return null;

    if (twitchAccessToken && Date.now() < twitchTokenExpiry - 60000) {
        return { token: twitchAccessToken, clientId };
    }

    try {
        const res = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        twitchAccessToken = data.access_token;
        twitchTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
        return { token: twitchAccessToken, clientId };
    } catch (_) {
        return null;
    }
}

async function checkTwitchStreamerLive(channelName) {
    if (!channelName) return { isLive: false, title: '', checked: false };

    const login = channelName.replace(/^@/, '').trim();
    let helixOffline = false;

    const auth = await getTwitchAccessToken();
    if (auth) {
        try {
            const res = await fetch(
                `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`,
                { headers: { 'Client-ID': auth.clientId, Authorization: `Bearer ${auth.token}` } }
            );
            if (res.ok) {
                const stream = (await res.json()).data?.[0];
                if (stream) return { isLive: true, title: stream.title || '', checked: true };
                helixOffline = true;
            }
        } catch (_) { /* try public fallback */ }
    }

    const fallback = await checkTwitchStreamerLiveFallback(login);
    if (fallback.checked) return fallback;
    if (helixOffline) return { isLive: false, title: '', checked: true };
    return { isLive: false, title: '', checked: false };
}

async function checkTwitchStreamerLiveFallback(channelName) {
    const endpoints = [
        `https://decapi.me/twitch/uptime/${encodeURIComponent(channelName)}`,
        `https://corsproxy.io/?${encodeURIComponent(`https://decapi.me/twitch/uptime/${encodeURIComponent(channelName)}`)}`
    ];

    for (const uptimeUrl of endpoints) {
        try {
            const uptimeRes = await fetch(uptimeUrl, { cache: 'no-store' });
            if (!uptimeRes.ok) continue;

            const text = (await uptimeRes.text()).trim();
            if (!text || /\b(is offline|not live|does not exist|invalid|cannot find|error)\b/i.test(text)) {
                return { isLive: false, title: '', checked: true };
            }

            let title = '';
            try {
                const titleRes = await fetch(
                    `https://decapi.me/twitch/title/${encodeURIComponent(channelName)}`,
                    { cache: 'no-store' }
                );
                if (titleRes.ok) {
                    title = (await titleRes.text()).trim();
                    if (/\b(is offline|not found|error)\b/i.test(title)) title = '';
                }
            } catch (_) { /* optional title */ }

            return { isLive: true, title: title || 'Live now', checked: true };
        } catch (_) { /* try next endpoint */ }
    }

    return { isLive: false, title: '', checked: false };
}

async function findFirstEnglishStreamForGame(gameName, auth) {
    if (!auth || !gameName) return null;

    try {
        const gamesRes = await fetch(
            `https://api.twitch.tv/helix/games?name=${encodeURIComponent(gameName)}`,
            { headers: { 'Client-ID': auth.clientId, Authorization: `Bearer ${auth.token}` } }
        );
        if (!gamesRes.ok) return null;
        const gameId = (await gamesRes.json()).data?.[0]?.id;
        if (!gameId) return null;

        let cursor = null;
        let pages = 0;
        do {
            const url = new URL('https://api.twitch.tv/helix/streams');
            url.searchParams.set('game_id', gameId);
            url.searchParams.set('first', '100');
            if (cursor) url.searchParams.set('after', cursor);

            const streamsRes = await fetch(url, {
                headers: { 'Client-ID': auth.clientId, Authorization: `Bearer ${auth.token}` }
            });
            if (!streamsRes.ok) break;
            const data = await streamsRes.json();

            const english = (data.data || []).filter(s => (s.language || '').toLowerCase() === 'en');
            english.sort((a, b) => (b.viewer_count || 0) - (a.viewer_count || 0));
            if (english.length > 0) {
                const s = english[0];
                return {
                    login: s.user_login,
                    title: s.title,
                    url: `https://www.twitch.tv/${s.user_login}`
                };
            }
            cursor = data.pagination?.cursor;
            pages++;
        } while (cursor && pages < 5);
    } catch (_) { /* network */ }

    return null;
}

async function fetchYouTubePlayerResponse(videoId) {
    const payload = {
        context: { client: INNERTUBE_CLIENT },
        videoId
    };
    const endpoint = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
    } catch (_) { /* try proxy fallback */ }

    try {
        const proxyUrl = ROKU_CORS_PROXY + encodeURIComponent(endpoint);
        const res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
    } catch (_) { /* network */ }

    return null;
}

async function checkYouTubeVideoLive(videoId) {
    if (!videoId) return { isLive: false, title: '', checked: false };

    const apiKey = localStorage.getItem(YOUTUBE_API_KEY) || '';
    if (apiKey) {
        try {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`
            );
            if (res.ok) {
                const item = (await res.json()).items?.[0];
                if (!item) return { isLive: false, title: '', checked: true };
                const isLive = item.snippet?.liveBroadcastContent === 'live';
                return { isLive, title: item.snippet?.title || '', checked: true };
            }
        } catch (_) { /* try innertube */ }
    }

    const data = await fetchYouTubePlayerResponse(videoId);
    if (data?.videoDetails) {
        const vd = data.videoDetails;
        const isLive = !!(vd.isLive || vd.isLiveContent);
        return { isLive, title: vd.title || '', checked: true };
    }

    const micro = data?.microformat?.playerMicroformatRenderer;
    if (micro?.liveBroadcastDetails?.isLiveNow) {
        return {
            isLive: true,
            title: micro.title?.simpleText || '',
            checked: true
        };
    }

    if (data) return { isLive: false, title: '', checked: true };
    return checkYouTubeVideoLiveViaPage(videoId);
}

async function checkYouTubeVideoLiveViaPage(videoId) {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const sources = [
        ROKU_CORS_PROXY + encodeURIComponent(watchUrl),
        `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`
    ];

    for (const source of sources) {
        try {
            const res = await fetch(source, { cache: 'no-store' });
            if (!res.ok) continue;
            const html = await res.text();
            if (/"isLive(?:Content)?":true|"isLiveNow":true/.test(html)) {
                const titleMatch = html.match(/"videoDetails":\{[^}]*"title":"([^"]+)"/)
                    || html.match(/"title":\{"simpleText":"([^"]+)"/);
                return { isLive: true, title: titleMatch?.[1] || '', checked: true };
            }
            if (/"isLive(?:Content)?":false|"isLiveNow":false/.test(html)) {
                return { isLive: false, title: '', checked: true };
            }
        } catch (_) { /* try next source */ }
    }

    return { isLive: false, title: '', checked: false };
}

async function refreshLiveStatuses() {
    if (isRefreshing) return;
    isRefreshing = true;
    document.getElementById('refresh-icon')?.classList.add('fa-spin');

    const auth = await getTwitchAccessToken();

    await Promise.all(channels.map(async (ch) => {
        if (!isChannelActive(ch)) return;

        if (shouldCheckTwitchLive(ch)) {
            const name = getTwitchLogin(ch);
            const { isLive, title, checked } = await checkTwitchStreamerLive(name);
            ch.liveChecked = checked;
            ch.isLive = isLive;
            ch.streamTitle = title;
            ch.guideSubtitle = isLive ? (title || 'Live now') : (checked ? '' : ch.guideSubtitle);
            if (!ch.twitchChannel && name) ch.twitchChannel = name;
        } else if (isTwitch247Channel(ch)) {
            ch.liveChecked = true;
            ch.isLive = false;
            ch.streamTitle = '';
            if (!ch.guideSubtitle) ch.guideSubtitle = '24/7 stream';
        }

        if (shouldCheckYouTubeLive(ch)) {
            const videoId = getYouTubeVideoId(ch);
            const { isLive, title, checked } = await checkYouTubeVideoLive(videoId);
            ch.youtubeVideoId = videoId;
            ch.liveChecked = checked;
            ch.isLive = isLive;
            ch.streamTitle = title;
            ch.guideSubtitle = isLive ? (title || 'Live now') : (checked ? '' : ch.guideSubtitle);
        } else if (isYouTubeLiveChannel(ch) && normalizeBroadcastMode(ch.broadcastMode, ch) === '247') {
            ch.liveChecked = true;
            ch.isLive = false;
            ch.streamTitle = '';
            if (!ch.guideSubtitle) ch.guideSubtitle = '24/7 stream';
        }

        if (ch.linkType === 'twitch-game-live') {
            ch.resolvedTwitchLogin = '';
            ch.resolvedTwitchTitle = '';
            const gameName = ch.gameName || ch.title;
            if (auth) {
                const hit = await findFirstEnglishStreamForGame(gameName, auth);
                if (hit) {
                    ch.resolvedTwitchLogin = hit.login;
                    ch.resolvedTwitchTitle = hit.title;
                    ch.guideSubtitle = `${hit.login} · ${hit.title}`;
                } else {
                    ch.guideSubtitle = 'No English streams live';
                }
            } else {
                ch.guideSubtitle = 'Opens game directory · add Twitch API keys to auto-pick';
            }
        }

        if (ch.linkType === 'roku-linear') {
            await applyRokuNowPlaying(ch);
        }
    }));

    isRefreshing = false;
    document.getElementById('refresh-icon')?.classList.remove('fa-spin');
    renderGuide();
    scheduleRokuRefresh();
}

function buildRokuScheduleApiUrl(contentId) {
    const homescreen = ROKU_HOMESCREEN_TEMPLATE.replace(/__CONTENT_ID__/g, contentId);
    return ROKU_CORS_PROXY + encodeURIComponent(homescreen);
}

function formatRokuProgramTitle(content) {
    if (!content) return '';
    if (content.series?.title && content.title && content.series.title !== content.title) {
        return `${content.series.title} · ${content.title}`;
    }
    return content.title || content.series?.title || '';
}

function parseRokuSchedule(data) {
    const schedule = data?.features?.linearSchedule ||
        (Array.isArray(data?.linearSchedule?.[0]) ? data.linearSchedule[0] : data?.linearSchedule) ||
        [];
    if (!Array.isArray(schedule) || schedule.length === 0) {
        return { title: '', endMs: 0 };
    }

    const now = Date.parse(data.currentTime || new Date().toISOString());
    const current = schedule.find((slot) => {
        const start = Date.parse(slot.date);
        return now >= start && now < start + slot.duration * 1000;
    });

    if (!current?.content) return { title: '', endMs: 0 };

    const endMs = Date.parse(current.date) + current.duration * 1000;
    return { title: formatRokuProgramTitle(current.content), endMs };
}

async function fetchRokuNowPlaying(ch) {
    const contentId = ch.rokuContentId || extractRokuContentId(ch.url);
    if (!contentId) return { title: ch.nowPlaying || '', endMs: 0 };

    try {
        const res = await fetch(buildRokuScheduleApiUrl(contentId), { cache: 'no-store' });
        if (!res.ok) return { title: ch.nowPlaying || '', endMs: 0 };
        const data = await res.json();
        const parsed = parseRokuSchedule(data);
        if (parsed.title) return parsed;
    } catch (_) { /* network / proxy */ }

    return { title: ch.nowPlaying || '', endMs: 0 };
}

async function applyRokuNowPlaying(ch) {
    const { title, endMs } = await fetchRokuNowPlaying(ch);
    ch.rokuProgramEndMs = endMs;
    if (title) {
        ch.nowPlaying = title;
        ch.guideSubtitle = title;
    } else if (ch.nowPlaying) {
        ch.guideSubtitle = ch.nowPlaying;
    } else {
        ch.guideSubtitle = 'Fetching now playing…';
    }
}

function scheduleRokuRefresh() {
    if (rokuRefreshTimer) clearTimeout(rokuRefreshTimer);

    const rokuChannels = channels.filter(c => isChannelActive(c) && c.linkType === 'roku-linear');
    if (rokuChannels.length === 0) return;

    let delayMs = 2 * 60 * 1000;
    const now = Date.now();
    for (const ch of rokuChannels) {
        if (ch.rokuProgramEndMs && ch.rokuProgramEndMs > now) {
            const untilEnd = ch.rokuProgramEndMs - now + 8000;
            if (untilEnd > 15000 && untilEnd < delayMs) delayMs = untilEnd;
        }
    }

    rokuRefreshTimer = setTimeout(async () => {
        await Promise.all(
            channels
                .filter(c => isChannelActive(c) && c.linkType === 'roku-linear')
                .map(applyRokuNowPlaying)
        );
        renderGuide();
        scheduleRokuRefresh();
    }, delayMs);
}

// ─── Channel actions ──────────────────────────────────────────────────────────
async function handleGuideClick(ch) {
    switch (ch.linkType) {
        case 'twitch-game-live':
            await openTwitchGameLive(ch);
            break;
        case 'twitch-streamer':
            openChannelUrl(ch.url || `https://www.twitch.tv/${getTwitchLogin(ch)}`);
            break;
        default:
            openChannelUrl(ch.url);
    }
}

async function openTwitchGameLive(ch) {
    const gameName = ch.gameName || ch.title;
    const auth = await getTwitchAccessToken();

    if (!auth) {
        showToast('Add Twitch Client ID + Secret in Edit for English auto-pick', 'error');
        openChannelUrl(ch.url || `https://www.twitch.tv/directory/game/${encodeURIComponent(gameName)}`);
        return;
    }

    showToast(`Finding English ${gameName} stream…`, 'info');
    let hit = ch.resolvedTwitchLogin
        ? { login: ch.resolvedTwitchLogin, title: ch.resolvedTwitchTitle, url: `https://www.twitch.tv/${ch.resolvedTwitchLogin}` }
        : await findFirstEnglishStreamForGame(gameName, auth);

    if (hit) {
        ch.resolvedTwitchLogin = hit.login;
        ch.resolvedTwitchTitle = hit.title;
        ch.guideSubtitle = `${hit.login} · ${hit.title}`;
        renderGuide();
        openChannelUrl(hit.url);
    } else {
        showToast(`No English live streams for ${gameName}`, 'error');
        openChannelUrl(`https://www.twitch.tv/directory/game/${encodeURIComponent(gameName)}`);
    }
}

function openAmbianceModal() {
    const modal = document.getElementById('ambiance-modal');
    const grid = document.getElementById('ambiance-options');
    grid.innerHTML = AMBIANCE_VIBES.map(v => `
        <button type="button" data-vibe-url="${escapeAttr(v.url)}"
                class="ambiance-option group flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-accent/50 hover:bg-accent/10 transition text-left w-full">
            <img src="${escapeAttr(v.thumb)}" alt="" class="w-16 h-16 rounded-lg object-cover shrink-0">
            <div class="min-w-0">
                <p class="font-semibold text-white flex items-center gap-2">
                    <i class="fa-solid ${v.icon} text-accent text-sm"></i>${escapeHtml(v.label)}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">${escapeHtml(v.subtitle)}</p>
            </div>
            <i class="fa-solid fa-arrow-up-right-from-square text-gray-600 group-hover:text-accent ml-auto shrink-0"></i>
        </button>
    `).join('');

    grid.querySelectorAll('[data-vibe-url]').forEach(btn => {
        btn.addEventListener('click', () => {
            openChannelUrl(btn.dataset.vibeUrl);
            closeAmbianceModal();
        });
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeAmbianceModal() {
    const modal = document.getElementById('ambiance-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

// ─── Guide rendering ────────────────────────────────────────────────────────
function channelMatchesFilter(ch) {
    if (ch.linkType === 'ambiance') return false;
    return getChannelCategory(ch) === activeFilter;
}

function countChannelsForFilter(filter) {
    return channels.filter(ch => isChannelActive(ch) && getChannelCategory(ch) === filter).length;
}

function updateFilterCounts() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        const filter = btn.dataset.filter;
        const n = countChannelsForFilter(filter);
        const badge = btn.querySelector('.filter-count');
        if (badge) badge.textContent = n > 0 ? `(${n})` : '';
    });
}

function suggestFilterForChannel(ch) {
    return getChannelCategory(ch) || 'streaming';
}

function setActiveFilter(filter, { openVibesModal = false } = {}) {
    activeFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    if (openVibesModal && filter === 'vibes') openAmbianceModal();
}

function shouldShowChannel(ch) {
    if (!isChannelActive(ch)) return false;
    if (!channelMatchesFilter(ch)) return false;
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = [ch.title, ch.platform, ch.gameName, ch.guideSubtitle, ch.nowPlaying, ch.twitchChannel]
            .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
    }
    return true;
}

function getYouTubeGuideStatus(ch) {
    if (normalizeBroadcastMode(ch.broadcastMode, ch) === '247') {
        return { label: '24/7', cls: 'bg-youtube/20 text-red-300 border-youtube/30' };
    }
    if (!ch.liveChecked) {
        return { label: '···', cls: 'bg-gray-800 text-gray-500 border-gray-700' };
    }
    return ch.isLive
        ? { label: 'LIVE', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
        : { label: 'OFFLINE', cls: 'bg-gray-800 text-gray-500 border-gray-700' };
}

function getTwitchGuideStatus(ch) {
    if (ch.broadcastMode === '247') {
        return { label: '24/7', cls: 'bg-twitch/20 text-twitch border-twitch/30' };
    }
    if (!ch.liveChecked) {
        return { label: '···', cls: 'bg-gray-800 text-gray-500 border-gray-700' };
    }
    return ch.isLive
        ? { label: 'LIVE', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
        : { label: 'OFFLINE', cls: 'bg-gray-800 text-gray-500 border-gray-700' };
}

function getGuideStatus(ch) {
    switch (ch.linkType) {
        case 'youtube-247':
            return getYouTubeGuideStatus(ch);
        case 'roku-linear': return { label: 'LINEAR', cls: 'bg-roku/20 text-purple-200 border-roku/30' };
        case 'twitch-game-live':
            return ch.resolvedTwitchLogin
                ? { label: 'LIVE', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
                : { label: 'GAME', cls: 'bg-twitch/20 text-twitch border-twitch/30' };
        case 'twitch-streamer':
            return getTwitchGuideStatus(ch);
        case 'channel':
            if (isTwitchDirectUrl(ch.url)) return getTwitchGuideStatus(ch);
            if (extractYouTubeVideoId(ch.url)) return getYouTubeGuideStatus(ch);
            return { label: 'LINK', cls: 'bg-gray-800 text-gray-400 border-gray-700' };
        default:
            if (isYouTubeLiveChannel(ch)) return getYouTubeGuideStatus(ch);
            return { label: 'LINK', cls: 'bg-gray-800 text-gray-400 border-gray-700' };
    }
}

function getYouTubeNowPlaying(ch) {
    if (normalizeBroadcastMode(ch.broadcastMode, ch) === '247') return ch.guideSubtitle || '24/7 stream';
    if (ch.streamTitle) return ch.streamTitle;
    if (!ch.liveChecked) return 'Checking YouTube…';
    if (ch.isLive) return ch.guideSubtitle || 'Live now';
    return 'Offline';
}

function getTwitchNowPlaying(ch) {
    if (ch.broadcastMode === '247') return ch.guideSubtitle || '24/7 stream';
    if (ch.streamTitle) return ch.streamTitle;
    if (!ch.liveChecked) return 'Checking Twitch…';
    if (!ch.isLive) {
        const login = getTwitchLogin(ch);
        return login ? `${login} · offline` : 'Offline';
    }
    return 'Live now';
}

function getGuideNowPlaying(ch) {
    if (ch.linkType === 'roku-linear' && ch.nowPlaying) return ch.nowPlaying;
    if (isTwitchLiveChannel(ch)) return getTwitchNowPlaying(ch);
    if (isYouTubeLiveChannel(ch)) return getYouTubeNowPlaying(ch);
    if (ch.linkType === 'twitch-game-live' && ch.resolvedTwitchTitle) return ch.resolvedTwitchTitle;
    if (ch.guideSubtitle) return ch.guideSubtitle;
    return '—';
}

function renderGuide() {
    const guide = document.getElementById('channel-guide');
    const rows = document.getElementById('guide-rows');
    const empty = document.getElementById('empty-state');
    const countBadge = document.getElementById('channel-count');
    const liveBadge = document.getElementById('live-count');

    const visible = sortChannelsForGuide(channels.filter(shouldShowChannel), activeFilter);
    const activeTotal = channels.filter(isChannelActive).length;
    const liveCount = channels.filter(c =>
        isChannelActive(c) && (
            (shouldCheckTwitchLive(c) && c.isLive) ||
            (shouldCheckYouTubeLive(c) && c.isLive) ||
            (c.linkType === 'twitch-game-live' && c.resolvedTwitchLogin)
        )
    ).length;

    countBadge.textContent = searchQuery
        ? `${visible.length} match · ${activeTotal} saved`
        : `${visible.length} on this tab · ${activeTotal} saved total`;
    updateFilterCounts();
    liveBadge.innerHTML = `<i class="fa-solid fa-circle text-[6px] mr-1"></i> ${liveCount} live`;

    rows.innerHTML = '';

    if (activeFilter === 'vibes' && visible.length === 0) {
        guide.classList.add('hidden');
        empty.classList.remove('hidden');
        empty.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles text-4xl text-accent/60 mb-4"></i>
            <p class="text-gray-400 text-sm">Built-in presets + any YouTube 24/7 channels you add in Edit</p>
            <p class="text-gray-600 text-xs mt-2">${countChannelsForFilter('streaming')} on Streaming · ${countChannelsForFilter('livetv')} on Live TV · ${countChannelsForFilter('vibes')} vibes here</p>
            <button type="button" onclick="openAmbianceModal()"
                    class="mt-4 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-xl text-sm font-medium transition">
                Pick Your Vibe
            </button>`;
        countBadge.textContent = `${AMBIANCE_VIBES.length} presets · ${activeTotal} saved total`;
        return;
    }

    if (activeFilter === 'vibes' && visible.length > 0) {
        const presetBtn = document.createElement('div');
        presetBtn.className = 'px-4 sm:px-5 py-3 border-b border-gray-800/80 bg-accent/5';
        presetBtn.innerHTML = `
            <button type="button" onclick="openAmbianceModal()"
                    class="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent text-sm font-medium transition">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Browse vibe presets (lofi, forest, cafe…)
            </button>`;
        rows.appendChild(presetBtn);
    }

    if (visible.length === 0) {
        guide.classList.add('hidden');
        empty.classList.remove('hidden');
        empty.innerHTML = `
            <svg class="mx-auto mb-4 text-emerald-500/40" width="44" height="44" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="6.5" r="4.25"/><circle cx="12" cy="17.5" r="4.25"/><circle cx="6.5" cy="12" r="4.25"/><circle cx="17.5" cy="12" r="4.25"/></svg>
            <p class="text-gray-500 text-sm">Nothing on ${activeFilter === 'streaming' ? 'Streaming' : activeFilter === 'livetv' ? 'Live TV' : 'Vibes'} yet.</p>
            <p class="text-gray-600 text-xs mt-1">${countChannelsForFilter('streaming')} streaming · ${countChannelsForFilter('livetv')} live TV · ${countChannelsForFilter('vibes')} vibes — check other tabs</p>
            <button type="button" onclick="openEditModal()" class="mt-4 text-accent text-sm hover:underline">Edit channel guide</button>`;
        return;
    }

    guide.classList.remove('hidden');
    empty.classList.add('hidden');

    let lastGroup = null;
    visible.forEach((ch, i) => {
        const group = getChannelSortGroup(ch);
        if (!searchQuery && group !== lastGroup) {
            appendGuideGroupHeader(rows, group);
            lastGroup = group;
        }

        const num = String(i + 1).padStart(2, '0');
        const status = getGuideStatus(ch);
        const platformCls = PLATFORM_STYLES[ch.platform] || 'text-gray-400 bg-gray-800 border-gray-700';
        const offlineStreamer = (shouldCheckTwitchLive(ch) || shouldCheckYouTubeLive(ch))
            && ch.liveChecked && !ch.isLive;
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `guide-row w-full grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3.5rem_2.5rem_1fr_8rem_5rem] gap-3 sm:gap-4 items-center px-4 sm:px-5 py-3 border-b border-gray-800/80 hover:bg-accent/5 transition text-left group${offlineStreamer ? ' opacity-60' : ''}`;
        row.innerHTML = `
            <span class="text-xs font-mono text-gray-500 group-hover:text-accent">${num}</span>
            <img src="${escapeAttr(ch.thumbnail)}" alt=""
                 class="hidden sm:block w-10 h-10 rounded-lg object-cover bg-gray-900 ring-1 ring-gray-800"
                 onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'">
            <div class="min-w-0 col-span-1 sm:col-span-1">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-gray-100 truncate">${escapeHtml(ch.title)}</span>
                    <span class="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${platformCls}">${escapeHtml(ch.platform)}</span>
                </div>
                <p class="text-xs text-gray-500 truncate mt-0.5">${escapeHtml(getGuideNowPlaying(ch))}</p>
            </div>
            <span class="hidden sm:inline text-[10px] text-gray-600 truncate">${escapeHtml(LINK_TYPE_LABELS[ch.linkType] || ch.linkType)}</span>
            <span class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border shrink-0 justify-self-end ${status.cls}">${status.label}</span>
        `;
        row.addEventListener('click', () => handleGuideClick(ch));
        rows.appendChild(row);
    });
}

// ─── Edit modal ───────────────────────────────────────────────────────────────
function getExtraFieldValue(ch) {
    if (ch.linkType === 'twitch-game-live') return ch.gameName || '';
    if (ch.linkType === 'twitch-streamer') return ch.twitchChannel || '';
    if (ch.linkType === 'roku-linear') return ch.nowPlaying || '';
    return ch.guideSubtitle || '';
}

function applyExtraField(ch, extra) {
    ch.gameName = '';
    ch.twitchChannel = '';
    ch.nowPlaying = '';
    if (!extra) return;
    if (ch.linkType === 'twitch-game-live') ch.gameName = extra;
    else if (ch.linkType === 'twitch-streamer') ch.twitchChannel = extra.replace(/^@/, '');
    else if (ch.linkType === 'roku-linear') ch.nowPlaying = extra;
    else ch.guideSubtitle = extra;
}

function openEditModal() {
    const editorList = document.getElementById('config-editor-list');
    document.getElementById('twitch-client-id').value = localStorage.getItem(TWITCH_ID_KEY) || '';
    document.getElementById('twitch-client-secret').value = localStorage.getItem(TWITCH_SECRET_KEY) || '';
    document.getElementById('youtube-api-key').value = localStorage.getItem(YOUTUBE_API_KEY) || '';
    editorList.innerHTML = '';

    const editorChannels = sortChannelsForEditor(channels);
    editorChannels.forEach((ch, idx) => {
        const prev = editorChannels[idx - 1];
        const next = editorChannels[idx + 1];
        const canMoveUp = canSwapChannelOrder(ch, prev);
        const canMoveDown = canSwapChannelOrder(ch, next);
        const groupLabel = SORT_GROUP_LABELS[getChannelSortGroup(ch)] || 'Channel';
        const showBroadcast = supportsBroadcastMode(ch);
        const broadcastMode = ch.broadcastMode || 'live';

        const row = document.createElement('div');
        row.className = 'channel-editor-row grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-900/60 border border-gray-800 rounded-xl items-start';
        row.dataset.channelId = ch.id;
        row.innerHTML = `
            <div class="md:col-span-2">
                <label class="text-[10px] text-gray-500 mb-1 block">Guide name</label>
                <input type="text" value="${escapeAttr(ch.title)}" data-field="title"
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-accent outline-none">
            </div>
            <div class="md:col-span-2">
                <label class="text-[10px] text-gray-500 mb-1 block">Guide tab</label>
                <select data-field="guideCategory"
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-1 py-1.5 text-xs text-white focus:border-accent outline-none">
                    <option value="streaming" ${getChannelCategory(ch) === 'streaming' ? 'selected' : ''}>Streaming</option>
                    <option value="livetv" ${getChannelCategory(ch) === 'livetv' ? 'selected' : ''}>Live TV</option>
                    <option value="vibes" ${getChannelCategory(ch) === 'vibes' ? 'selected' : ''}>Vibes</option>
                </select>
            </div>
            <div class="md:col-span-2">
                <label class="text-[10px] text-gray-500 mb-1 block">Type</label>
                <select data-field="linkType"
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-1 py-1.5 text-xs text-white focus:border-accent outline-none">
                    <option value="roku-linear" ${ch.linkType === 'roku-linear' ? 'selected' : ''}>Roku Linear</option>
                    <option value="youtube-247" ${ch.linkType === 'youtube-247' ? 'selected' : ''}>YouTube 24/7</option>
                    <option value="twitch-game-live" ${ch.linkType === 'twitch-game-live' ? 'selected' : ''}>Twitch Game → 1st EN</option>
                    <option value="twitch-streamer" ${ch.linkType === 'twitch-streamer' ? 'selected' : ''}>Twitch Streamer</option>
                    <option value="channel" ${ch.linkType === 'channel' ? 'selected' : ''}>Direct Link</option>
                </select>
                <p class="text-[9px] text-gray-600 mt-0.5">${escapeHtml(groupLabel)}</p>
                ${showBroadcast ? `
                <label class="text-[10px] text-gray-500 mb-1 block mt-1.5">Guide status</label>
                <select data-field="broadcastMode"
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-1 py-1.5 text-xs text-white focus:border-accent outline-none">
                    <option value="live" ${broadcastMode === 'live' ? 'selected' : ''}>Live — check if online</option>
                    <option value="247" ${broadcastMode === '247' ? 'selected' : ''}>24/7 — always on</option>
                </select>` : ''}
            </div>
            <div class="md:col-span-1">
                <label class="text-[10px] text-gray-500 mb-1 block">Platform</label>
                <select data-field="platform"
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-1 py-1.5 text-xs text-white focus:border-accent outline-none">
                    <option value="roku" ${ch.platform === 'roku' ? 'selected' : ''}>Roku</option>
                    <option value="youtube" ${ch.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
                    <option value="twitch" ${ch.platform === 'twitch' ? 'selected' : ''}>Twitch</option>
                    <option value="pluto" ${ch.platform === 'pluto' ? 'selected' : ''}>Pluto</option>
                </select>
            </div>
            <div class="md:col-span-2">
                <label class="text-[10px] text-gray-500 mb-1 block">URL (fallback / direct)</label>
                <input type="text" value="${escapeAttr(ch.url)}" data-field="url"
                       placeholder="https://..."
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-accent outline-none">
            </div>
            <div class="md:col-span-2">
                <label class="text-[10px] text-gray-500 mb-1 block">Game / user / fallback subtitle</label>
                <input type="text" value="${escapeAttr(getExtraFieldValue(ch))}" data-field="extra"
                       placeholder="${ch.linkType === 'roku-linear' ? 'Optional if auto now-playing fails' : ''}"
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-accent outline-none">
            </div>
            <div class="md:col-span-1 flex flex-col items-center gap-1.5 pt-4">
                <div class="flex gap-0.5">
                    <button type="button" data-move-up="${ch.id}" ${canMoveUp ? '' : 'disabled'}
                            class="text-gray-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up in group">
                        <i class="fa-solid fa-chevron-up text-xs"></i>
                    </button>
                    <button type="button" data-move-down="${ch.id}" ${canMoveDown ? '' : 'disabled'}
                            class="text-gray-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down in group">
                        <i class="fa-solid fa-chevron-down text-xs"></i>
                    </button>
                </div>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" data-field="isActive" ${ch.isActive !== false ? 'checked' : ''}
                           class="rounded border-gray-600 bg-gray-800 text-accent">
                    <span class="text-[10px] text-gray-500">On</span>
                </label>
                <button type="button" data-remove="${ch.id}" class="text-red-400 hover:text-red-300 p-1"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
        `;
        editorList.appendChild(row);
    });

    editorList.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => removeChannelRow(btn.dataset.remove));
    });
    editorList.querySelectorAll('[data-move-up]').forEach(btn => {
        btn.addEventListener('click', () => moveChannelRow(btn.dataset.moveUp, -1));
    });
    editorList.querySelectorAll('[data-move-down]').forEach(btn => {
        btn.addEventListener('click', () => moveChannelRow(btn.dataset.moveDown, 1));
    });

    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-modal').classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('flex');
    document.body.style.overflow = '';
}

function addNewChannelRow() {
    const template = activeFilter === 'livetv'
        ? {
            platform: 'roku',
            linkType: 'roku-linear',
            guideCategory: 'livetv',
            url: 'https://therokuchannel.roku.com/watch/',
            title: 'New Live TV Channel'
        }
        : activeFilter === 'vibes'
            ? {
                platform: 'youtube',
                linkType: 'youtube-247',
                guideCategory: 'vibes',
                url: 'https://www.youtube.com/watch?v=',
                title: 'New 24/7 Stream'
            }
            : {
                platform: 'twitch',
                linkType: 'twitch-game-live',
                guideCategory: 'streaming',
                url: 'https://www.twitch.tv/directory/game/',
                title: 'New Twitch Game',
                gameName: ''
            };

    const created = normalizeChannel({
        id: 'custom-' + Date.now(),
        isActive: true,
        ...template,
        sortOrder: getNextSortOrder({ ...template, guideCategory: template.guideCategory || activeFilter })
    }, channels.length);
    if (created) channels.push(created);
    openEditModal();
}

function removeChannelRow(channelId) {
    channels = channels.filter(ch => ch.id !== channelId);
    openEditModal();
}

function moveChannelRow(channelId, direction) {
    const list = sortChannelsForEditor(channels);
    const idx = list.findIndex(c => c.id === channelId);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;

    const current = channels.find(c => c.id === channelId);
    const target = channels.find(c => c.id === list[swapIdx].id);
    if (!canSwapChannelOrder(current, target)) return;

    const currentOrder = current.sortOrder ?? idx;
    const targetOrder = target.sortOrder ?? swapIdx;
    current.sortOrder = targetOrder;
    target.sortOrder = currentOrder;

    persistChannels();
    openEditModal();
}

function saveConfigurations() {
    const rows = document.getElementById('config-editor-list')?.querySelectorAll('.channel-editor-row');
    if (!rows || rows.length === 0) {
        showToast('Nothing to save — add a channel first', 'error');
        return;
    }

    const byId = new Map(channels.map(ch => [ch.id, ch]));
    const nextChannels = [];
    const groupCounters = {};

    rows.forEach((row, rowIndex) => {
        const draft = readRowDraft(row);
        const channelId = row.dataset.channelId;
        const base = (channelId && byId.get(channelId)) || {
            id: channelId || `ch-${Date.now()}-${rowIndex}`,
            title: 'Untitled',
            platform: 'youtube',
            linkType: 'channel',
            guideCategory: activeFilter,
            url: '',
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
            isActive: true
        };

        const merged = { ...base, ...draft };
        delete merged._extra;
        if (draft._extra !== undefined) applyExtraField(merged, draft._extra);

        const normalized = normalizeChannel(merged, rowIndex);
        if (!normalized) return;

        const cat = getChannelCategory(normalized);
        const group = getChannelSortGroup(normalized);
        const key = `${cat}:${group}`;
        normalized.sortOrder = groupCounters[key] ?? 0;
        groupCounters[key] = normalized.sortOrder + 1;
        nextChannels.push(normalized);
    });

    channels = nextChannels;

    const twitchId = document.getElementById('twitch-client-id').value.trim();
    const twitchSecret = document.getElementById('twitch-client-secret').value.trim();
    if (twitchId) localStorage.setItem(TWITCH_ID_KEY, twitchId);
    else localStorage.removeItem(TWITCH_ID_KEY);
    if (twitchSecret) localStorage.setItem(TWITCH_SECRET_KEY, twitchSecret);
    else localStorage.removeItem(TWITCH_SECRET_KEY);

    const youtubeKey = document.getElementById('youtube-api-key').value.trim();
    if (youtubeKey) localStorage.setItem(YOUTUBE_API_KEY, youtubeKey);
    else localStorage.removeItem(YOUTUBE_API_KEY);

    twitchAccessToken = null;

    if (!persistChannels()) return;

    const lastSaved = channels[channels.length - 1];
    if (lastSaved) setActiveFilter(suggestFilterForChannel(lastSaved));

    closeEditModal();
    renderGuide();
    refreshLiveStatuses();

    let msg = `Saved ${channels.length} channel${channels.length === 1 ? '' : 's'}`;
    if (lastSaved) {
        const tab = getChannelCategory(lastSaved);
        const tabLabel = GUIDE_CATEGORIES[tab] || tab;
        msg += ` · see ${tabLabel} tab`;
    }
    showToast(msg, 'success');
}

function resetDefaultConfig() {
    if (!confirm('Reload the published site guide from channels.json? Unsaved browser edits will be replaced.')) return;
    reloadSiteGuide().then((ok) => {
        if (ok) openEditModal();
        else {
            channels = channelsFromRawList(cloneDefaults());
            persistChannels();
            openEditModal();
            renderGuide();
            refreshLiveStatuses();
            showToast('Site guide missing — restored built-in defaults', 'info');
        }
    });
}

function exportConfig() {
    const blob = new Blob([JSON.stringify(channels.map(serializeChannel), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clover-hill-media-guide-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Exported backup', 'success');
}

function exportSiteGuide() {
    const revision = Number(localStorage.getItem(GUIDE_REVISION_KEY) || 0) + 1;
    const payload = {
        revision,
        updated: new Date().toISOString().slice(0, 10),
        channels: channels.map(serializeChannel)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'channels.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`Downloaded channels.json (rev ${revision}) — commit this file to publish`, 'success');
}

async function reloadSiteGuide({ quiet = false } = {}) {
    const siteGuide = await fetchSiteGuide();
    if (!siteGuide?.channels?.length) {
        if (!quiet) showToast('No site guide found (channels.json)', 'error');
        return false;
    }
    await applySiteGuide(siteGuide);
    renderGuide();
    refreshLiveStatuses();
    if (!quiet) showToast(`Loaded ${channels.length} channels from site guide`, 'success');
    return true;
}

function importConfig(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            const list = Array.isArray(parsed) ? parsed : parsed.channels;
            if (!Array.isArray(list)) throw new Error('invalid');
            channels = list.map((ch, i) => normalizeChannel(ch, i)).filter(Boolean);
            persistChannels();
            if (parsed.revision != null) {
                localStorage.setItem(GUIDE_REVISION_KEY, String(parsed.revision));
            } else {
                localStorage.setItem(GUIDE_REVISION_KEY, String(Number(localStorage.getItem(GUIDE_REVISION_KEY) || 0) + 1));
            }
            openEditModal();
            renderGuide();
            refreshLiveStatuses();
            showToast(`Imported ${channels.length} channels (saved in this browser)`, 'success');
        } catch (_) {
            showToast('Invalid JSON', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function showToast(message, type = 'info') {
    const colors = {
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        error: 'border-red-500/40 bg-red-500/10 text-red-300',
        info: 'border-accent/40 bg-accent/10 text-purple-300'
    };
    const toast = document.createElement('div');
    toast.className = `toast pointer-events-auto px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg ${colors[type] || colors.info}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupFilters() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            const openVibesModal = filter === 'vibes' && countChannelsForFilter('vibes') === 0;
            setActiveFilter(filter, { openVibesModal });
            renderGuide();
        });
    });
    let debounce;
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            searchQuery = e.target.value.trim();
            renderGuide();
        }, 200);
    });
}

function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
            closeAmbianceModal();
        }
    });
    document.getElementById('edit-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') closeEditModal();
    });
    document.getElementById('ambiance-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'ambiance-modal') closeAmbianceModal();
    });
}

function setupMobileMenu() {
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const loadedFrom = await bootstrapChannels();

    const before = JSON.stringify(channels.map(serializeChannel));
    channels = channels.map((ch, i) => normalizeChannel(ch, i)).filter(Boolean);
    if (JSON.stringify(channels.map(serializeChannel)) !== before) {
        persistChannels();
    }

    setupFilters();
    setupKeyboard();
    setupMobileMenu();
    document.getElementById('refresh-btn')?.addEventListener('click', refreshLiveStatuses);
    renderGuide();
    refreshLiveStatuses();
    setInterval(refreshLiveStatuses, 5 * 60 * 1000);
    scheduleRokuRefresh();

    if (loadedFrom === 'site' || loadedFrom === 'site-update') {
        showToast(`Loaded ${channels.length} channels from site guide`, 'info');
    }
});

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openAmbianceModal = openAmbianceModal;
window.closeAmbianceModal = closeAmbianceModal;
window.addNewChannelRow = addNewChannelRow;
window.removeChannelRow = removeChannelRow;
window.saveConfigurations = saveConfigurations;
window.resetDefaultConfig = resetDefaultConfig;
window.exportConfig = exportConfig;
window.exportSiteGuide = exportSiteGuide;
window.reloadSiteGuide = reloadSiteGuide;
window.importConfig = importConfig;
