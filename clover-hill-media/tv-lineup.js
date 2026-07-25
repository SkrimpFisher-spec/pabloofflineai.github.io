const TV_STATUS_LABELS = {
    airing: 'English-language shows with new episodes this week',
    popular: 'most popular English-language shows right now',
    upcoming: 'anticipated English-language shows coming soon'
};

const TV_LINEUP_TARGET = 12;

// TMDB genre IDs — hardcoded exclusions at the API layer
const TV_API_EXCLUDED_GENRES = '10763|10767'; // News, Talk

// Hardcoded post-fetch exclusions (site policy, not user-configurable)
const TV_BLOCKED_GENRE_IDS = new Set([10763, 10767]);
const TV_ANIME_ORIGIN_COUNTRIES = new Set(['JP', 'KR', 'CN', 'TW']);
const TV_ANIME_LANGUAGES = new Set(['ja', 'ko', 'zh', 'cn']);

const TV_EXCLUDED_PATTERNS = [
    // Late night & talking-head formats
    /tonight show/i,
    /late night with/i,
    /late late show/i,
    /after midnight/i,
    /daily show/i,
    /watch what happens/i,
    /last week tonight/i,
    /real time with/i,
    /jimmy kimmel/i,
    /jimmy fallon/i,
    /seth meyers/i,
    /stephen colbert/i,
    /\bconan\b/i,
    /conan o.?brien/i,
    /trevor noah/i,
    /jon stewart/i,
    /john stewart/i,
    /larry king/i,
    /graham norton/i,
    /james corden/i,
    /chelsea handler/i,
    /andy cohen/i,
    /bill maher/i,
    /john oliver/i,
    /the view/i,
    /good morning america/i,
    /today show/i,
    /morning joe/i,
    /fox & friends/i,
    /meet the press/i,
    /face the nation/i,
    /state of the union/i,
    /political party live/i,
    /talking dead/i,
    /after.?show/i,
    /red table talk/i,
    /hot ones/i,

    // Wrestling
    /^wwe\b/i,
    /^aew\b/i,
    /\bwwe\b/i,
    /\baew\b/i,
    /\bnxt\b/i,
    /smackdown/i,
    /wrestlemania/i,
    /lucha libre/i,
    /impact wrestling/i,
    /ring of honor/i,
    /all elite wrestling/i,
    /professional wrestling/i,
    /\bwwf\b/i,
    /monday night raw/i,
    /friday night smackdown/i,
    /greek wrestling/i,

    // Sports
    /\bnfl\b/i,
    /\bnba\b/i,
    /\bmlb\b/i,
    /\bnhl\b/i,
    /\bespn\b/i,
    /sportscenter/i,
    /sports center/i,
    /monday night football/i,
    /thursday night football/i,
    /sunday night football/i,
    /inside the nba/i,
    /first take/i,
    /sportsnation/i,
    /mlb tonight/i,
    /nhl tonight/i,
    /premier league/i,
    /match of the day/i,
    /march madness/i,
    /super bowl/i,
    /olympic/i,
    /\bufc\b/i,
    /formula 1/i,
    /\bf1\b/i,
    /nascar/i,
    /pga tour/i,
    /college gameday/i,
    /sports illustrated/i,
    /monday night soccer/i,
    /football focus/i,
    /baseball tonight/i,
    /hockey central/i,
    /sports desk/i
];

let currentTvMode = 'airing';

function tvDiscoverParams(mode, page) {
    const base = {
        sort_by: 'popularity.desc',
        without_genres: TV_API_EXCLUDED_GENRES,
        page: String(page)
    };

    switch (mode) {
        case 'airing':
            return englishDiscoverParams({
                ...base,
                'air_date.gte': daysFromTodayISO(-7),
                'air_date.lte': daysFromTodayISO(7)
            });
        case 'popular':
            return englishDiscoverParams(base);
        case 'upcoming':
            return englishDiscoverParams({
                ...base,
                'first_air_date.gte': todayISO()
            });
        default:
            return englishDiscoverParams(base);
    }
}

function tvEndpoint(mode, page = 1) {
    return tmdbUrl('/discover/tv', tvDiscoverParams(mode, page));
}

function isAsianAnime(show) {
    const genres = show.genre_ids || [];
    if (!genres.includes(16)) return false;

    const lang = (show.original_language || '').toLowerCase();
    if (TV_ANIME_LANGUAGES.has(lang)) return true;

    const countries = show.origin_country || [];
    return countries.some(code => TV_ANIME_ORIGIN_COUNTRIES.has(code));
}

function isExcludedTvShow(show) {
    if ((show.genre_ids || []).some(id => TV_BLOCKED_GENRE_IDS.has(id))) return true;
    if (isAsianAnime(show)) return true;

    const name = (show.name || '').trim();
    if (/^raw$/i.test(name)) return true;

    const hay = `${name} ${show.original_name || ''} ${show.overview || ''}`;
    return TV_EXCLUDED_PATTERNS.some(pattern => pattern.test(hay));
}

async function fetchFilteredTvShows(mode, targetCount = TV_LINEUP_TARGET) {
    const collected = [];
    const seen = new Set();

    for (let page = 1; page <= 5 && collected.length < targetCount; page++) {
        const res = await fetch(tvEndpoint(mode, page), { headers: TMDB_HEADERS });
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        const batch = data.results || [];

        if (batch.length === 0) break;

        for (const show of batch) {
            if (seen.has(show.id) || isExcludedTvShow(show)) continue;
            seen.add(show.id);
            collected.push(show);
            if (collected.length >= targetCount) break;
        }

        if (page >= (data.total_pages || 1)) break;
    }

    return collected;
}

function renderTvCarousel(shows) {
    const carousel = document.getElementById('tv-carousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    shows.forEach((show, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'theater-ticket';
        const airYear = (show.first_air_date || '').slice(0, 4) || 'TBA';
        card.innerHTML = `
            <span class="ticket-rank">#${index + 1}</span>
            <img src="${escapeAttr(posterUrl(show))}" alt="${escapeAttr(show.name)} poster" loading="lazy" />
            <div class="ticket-body">
                <p class="ticket-title">${escapeHtml(show.name)}</p>
                <p class="ticket-meta">${airYear}</p>
            </div>`;
        card.addEventListener('click', () => openTvModal(show));
        carousel.appendChild(card);
    });
}

async function openTvModal(show) {
    const overlay = document.getElementById('tv-modal');
    const title = document.getElementById('tv-modal-title');
    const meta = document.getElementById('tv-modal-meta');
    const synopsis = document.getElementById('tv-modal-synopsis');
    const trailerSlot = document.getElementById('tv-trailer-slot');

    title.textContent = show.name;
    meta.textContent = show.first_air_date ? `First aired ${show.first_air_date}` : 'Air date TBA';
    synopsis.textContent = show.overview || 'No synopsis available yet.';
    trailerSlot.innerHTML = '<div class="theater-no-trailer">Loading trailer…</div>';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch(tmdbUrl(`/tv/${show.id}/videos`), { headers: TMDB_HEADERS });
        const data = await res.json();
        const trailer = (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
            || (data.results || []).find(v => v.site === 'YouTube');
        if (trailer) {
            trailerSlot.innerHTML = `<iframe class="theater-trailer-frame" src="https://www.youtube.com/embed/${escapeAttr(trailer.key)}" allow="autoplay; encrypted-media" allowfullscreen title="${escapeAttr(show.name)} trailer"></iframe>`;
        } else {
            trailerSlot.innerHTML = '<div class="theater-no-trailer">No trailer found for this title</div>';
        }
    } catch (_) {
        trailerSlot.innerHTML = '<div class="theater-no-trailer">Couldn\'t load trailer</div>';
    }
}

function closeTvModal() {
    const overlay = document.getElementById('tv-modal');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.getElementById('tv-trailer-slot').innerHTML = '';
    if (!document.getElementById('theater-modal')?.classList.contains('flex')) {
        document.body.style.overflow = '';
    }
}

async function loadTvTab(mode) {
    currentTvMode = mode;
    const statusLine = document.getElementById('tv-status');
    if (!statusLine) return;

    document.querySelectorAll('.tv-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
        btn.setAttribute('aria-selected', btn.dataset.mode === mode ? 'true' : 'false');
    });

    statusLine.textContent = 'Loading…';
    try {
        const shows = await fetchFilteredTvShows(mode);
        statusLine.textContent = `${shows.length} ${TV_STATUS_LABELS[mode]} · updated ${new Date().toLocaleDateString()}`;
        renderTvCarousel(shows);
    } catch (_) {
        statusLine.textContent = 'Couldn\'t reach TMDB — try again later';
        renderTvCarousel([]);
    }
}

function setupTvLineup() {
    document.querySelectorAll('.tv-tab').forEach(btn => {
        btn.addEventListener('click', () => loadTvTab(btn.dataset.mode));
    });
    document.getElementById('tv-modal-close')?.addEventListener('click', closeTvModal);
    document.getElementById('tv-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'tv-modal') closeTvModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTvModal();
    });
    loadTvTab(currentTvMode);
}

document.addEventListener('DOMContentLoaded', setupTvLineup);

window.closeTvModal = closeTvModal;
