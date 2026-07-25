const TV_STATUS_LABELS = {
    airing: 'English-language shows with new episodes this week',
    popular: 'most popular English-language shows right now',
    upcoming: 'highly anticipated English-language shows premiering soon'
};

const TV_LINEUP_TARGET = 12;
const TV_UPCOMING_MAX_DAYS = 180;
const TV_UPCOMING_MIN_POPULARITY = 5;
const TV_UPCOMING_MIN_OVERVIEW = 25;

// TMDB genre IDs — hardcoded exclusions at the API layer
const TV_API_EXCLUDED_GENRES = '10763|10767|10762|80|10766'; // News, Talk, Kids, Crime, Soap

// US TV content rating floor (TV-14 ≈ PG-13). Applied on every discover query.
const TV_MIN_US_CERT = 'TV-14';

// BET / OWN / Tyler Perry — hardcoded network & studio exclusions (TMDB IDs)
const TV_EXCLUDED_NETWORK_IDS = new Set([24, 827, 6891]); // BET, OWN, Bounce XL
const TV_EXCLUDED_COMPANY_IDS = new Set([3096, 89210, 210689, 11964]); // Tyler Perry Studios, BET Productions, BET+, BET TV
const TV_API_EXCLUDED_NETWORKS = '24|827|6891';
const TV_API_EXCLUDED_COMPANIES = '3096|89210|210689|11964';

// Hardcoded post-fetch exclusions (site policy, not user-configurable)
const TV_BLOCKED_GENRE_IDS = new Set([10763, 10767, 10762, 80, 10766]);
const TV_ANIME_ORIGIN_COUNTRIES = new Set(['JP', 'KR', 'CN', 'TW']);
const TV_ANIME_LANGUAGES = new Set(['ja', 'ko', 'zh', 'cn']);

// Any of these words in the show title → blocked (judge/court/police daytime trash)
const TV_TITLE_KEYWORD_PATTERNS = [
    /\bjudge\b/i,
    /\bcourt\b/i,
    /\bcourts\b/i,
    /\bpolice\b/i,
    /\bcops\b/i,
    /\bcop\b/i,
    /\bsheriff\b/i,
    /\bpatrol\b/i,
    /\bbodycam\b/i,
    /\bbody cam\b/i,
    /\bdetectives\b/i,
    /\bhomicide\b/i,
    /\bforensic\b/i,
    /\bprosecutor\b/i,
    /\bdistrict attorney\b/i
];

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

    // Sports doc miniseries (upcoming filler)
    /^the dynasty:/i,

    // Kids & preschool (backup if TMDB rating/genre data is missing)
    /paw patrol/i,
    /peppa pig/i,
    /\bbluey\b/i,
    /cocomelon/i,
    /dora the explorer/i,
    /mickey mouse/i,
    /mickey and the roadster/i,
    /pj masks/i,
    /blippi/i,
    /thomas & friends/i,
    /thomas the tank engine/i,
    /sesame street/i,
    /barney & friends/i,
    /teletubbies/i,
    /caillou/i,
    /spidey and his amazing friends/i,
    /gabbys dollhouse/i,
    /baby shark/i,
    /ms\.?\s*rachel/i,
    /bubble guppies/i,
    /fireman sam/i,
    /postman pat/i,
    /curious george/i,
    /clifford the/i,
    /power rangers.*megaforce/i,

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
    /\broh\b/i,
    /honorclub/i,
    /honor club/i,
    /on honorclub/i,
    /glory by honor/i,
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
    /sports desk/i,

    // BET / Tyler Perry / Black-audience network programming
    /tyler perry/i,
    /house of payne/i,
    /meet the browns/i,
    /\bmadea\b/i,
    /tyler perry's sistas/i,
    /tyler perry's the oval/i,
    /\bthe oval\b/i,
    /haves and the have.?nots/i,
    /love & hip hop/i,
    /love and hip hop/i,
    /black ink crew/i,
    /106 & park/i,
    /bet awards/i,
    /bet presents/i,
    /if loving you is wrong/i,
    /the paynes/i,
    /ready to love/i,
    /all the queen's men/i,
    /\bzatima\b/i,
    /tyler perry's young dylan/i,
    /tyler perry's assisted living/i,
    /tyler perry's beauty in black/i,
    /tyler perry's ruthless/i,
    /tyler perry's the game/i,
    /for better or worse/i,
    /love thy neighbor/i,
    /greenleaf/i,
    /queen sugar/i,
    /tyler perry's bruised/i,
    /tyler perry's divorce in the black/i,
    /first wives club/i,
    /b\.e\.t\.?\b/i,
    /\bbet\+?\b/i,
    /oprah winfrey network/i,
    /\bown:\s/i,
    /centric\b/i,
    /bounce tv/i,
    /tv one originals/i,
    /\bthe chi\b/i,
    /^the chi$/i,

    // Law & Order franchise (every spin-off)
    /law & order/i,
    /law and order/i,
    /special victims unit/i,
    /\bsvu\b/i,
    /criminal intent/i,
    /organized crime/i,
    /trial by jury/i,

    // NCIS franchise
    /\bncis\b/i,

    // CSI franchise & forensics procedurals
    /^csi\b/i,
    /csi:\s/i,
    /csi cyber/i,
    /criminal minds/i,
    /criminal mind/i,
    /without a trace/i,
    /cold case/i,
    /forensic files/i,
    /forensics/i,
    /bones\b/i,
    /the mentalist/i,
    /the closer/i,
    /major crimes/i,
    /unforgettable/i,
    /prodigal son/i,
    /the profiler/i,
    /profiler\b/i,

    // FBI / federal / task-force procedurals
    /\bfbi\b/i,
    /fbi:/i,
    /most wanted/i,
    /fbi international/i,
    /quantico\b/i,
    /the blacklist/i,
    /person of interest/i,
    /the unit\b/i,
    /seal team/i,
    /ncis:?\s*origins/i,

    // Local PD / fire / EMS procedurals
    /blue bloods/i,
    /chicago pd/i,
    /chicago p\.d\./i,
    /chicago fire/i,
    /chicago med/i,
    /chicago justice/i,
    /nypd/i,
    /n\.y\.p\.d\./i,
    /hawaii five/i,
    /the rookie/i,
    /\bs\.?w\.?a\.?t\.?\b/i,
    /\bswat\b/i,
    /9-1-1/i,
    /\b911\b/i,
    /911:?\s*lone star/i,
    /the shield/i,
    /southland/i,
    /brooklyn nine-nine/i,
    /brooklyn 99/i,
    /the wire/i,
    /true detective/i,
    /line of duty/i,
    /the equalizer/i,
    /walker\b/i,
    /texas ranger/i,
    /castle\b/i,
    /monk\b/i,
    /\bpsych\b/i,
    /elementary\b/i,
    /sherlock\b/i,
    /luther\b/i,
    /dexter\b/i,
    /midsomer murders/i,
    /death in paradise/i,
    /silent witness/i,
    /inspector morse/i,
    /endeavour\b/i,
    /\bvera\b/i,
    /shetland/i,
    /broadchurch/i,
    /jag\b/i,
    /dragnet/i,
    /adam-12/i,
    /police story/i,
    /police squad/i,
    /hill street blues/i,
    /t\.j\. hooker/i,
    /kojak\b/i,
    /miami vice/i,
    /nash bridges/i,

    // Court / judge / justice-as-TV
    /judge judy/i,
    /judge mathis/i,
    /judge joe brown/i,
    /judge hatchett/i,
    /judge faith/i,
    /hot bench/i,
    /people'?s court/i,
    /divorce court/i,
    /court cam/i,
    /court tv/i,
    /jury duty/i,
    /paternity court/i,
    /traffic court/i,
    /supreme justice/i,
    /justice central/i,
    /legal justice/i,

    // Bodycam / ride-along / true-crime TV
    /live pd/i,
    /live p\.d\./i,
    /\bcops\b/i,
    /body cam/i,
    /bodycam/i,
    /police cam/i,
    /on patrol/i,
    /patrol live/i,
    /dateline\b/i,
    /48 hours/i,
    /20\/20\b/i,
    /first 48/i,
    /snapped\b/i,
    /deadly women/i,
    /forensic detectives/i,
    /i.?survived/i,
    /on the case/i,
    /american detective/i,
    /murder one/i,
    /murder, she wrote/i,

    // Medical soaps (Scrubs, The Pitt, House, ER-style stays)
    /grey'?s anatomy/i,
    /grays anatomy/i,
    /private practice/i,
    /station 19/i,
    /station nineteen/i,

    // Daytime & prime-time soap operas
    /general hospital/i,
    /days of our lives/i,
    /young and the restless/i,
    /bold and the beautiful/i,
    /all my children/i,
    /one life to live/i,
    /as the world turns/i,
    /guiding light/i,
    /passions\b/i,
    /port charles/i,
    /the bay\b/i,
    /beyond the gates/i,
    /beyond the gate/i,
    /dynasty\b/i,
    /dallas\b/i,
    /knots landing/i,
    /melrose place/i,
    /90210\b/i,
    /beverly hills, 90210/i,
    /peyton place/i,
    /dark shadows/i,
    /hollywood heights/i,
    /the haves and the have nots/i,  // already have variant
    /if loving you is wrong/i,       // already have
    /the secret life of the american teenager/i,
    /pretty little liars/i,
    /gossip girl/i,
    /riverdale\b/i,
    /emmerdale/i,
    /coronation street/i,
    /eastenders/i,
    /hollyoaks/i,
    /home and away/i,
    /neighbours\b/i,

    // Telenovelas
    /telenovela/i,
    /telenovelas/i,
    /novela\b/i,
    /la rosa de guadalupe/i,
    /rub[ií]?\s*icon/i
];

const tvDetailCache = new Map();

let currentTvMode = 'airing';

function tvDiscoverParams(mode, page) {
    const base = {
        sort_by: 'popularity.desc',
        without_genres: TV_API_EXCLUDED_GENRES,
        without_networks: TV_API_EXCLUDED_NETWORKS,
        without_companies: TV_API_EXCLUDED_COMPANIES,
        page: String(page)
    };

    if (mode !== 'upcoming') {
        base.certification_country = 'US';
        base['certification.gte'] = TV_MIN_US_CERT;
    }

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
                'first_air_date.gte': todayISO(),
                'first_air_date.lte': daysFromTodayISO(TV_UPCOMING_MAX_DAYS),
                include_null_first_air_dates: 'false'
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

function matchesExcludedPatterns(show) {
    const name = (show.name || '').trim();
    if (/^raw$/i.test(name)) return true;

    const titleHay = `${name} ${show.original_name || ''}`;
    if (TV_TITLE_KEYWORD_PATTERNS.some(pattern => pattern.test(titleHay))) return true;

    const hay = `${titleHay} ${show.overview || ''}`;
    return TV_EXCLUDED_PATTERNS.some(pattern => pattern.test(hay));
}

async function fetchTvDetail(showId) {
    if (tvDetailCache.has(showId)) return tvDetailCache.get(showId);
    const res = await fetch(
        tmdbUrl(`/tv/${showId}`, { append_to_response: 'credits' }),
        { headers: TMDB_HEADERS }
    );
    if (!res.ok) throw new Error('detail fetch failed');
    const detail = await res.json();
    tvDetailCache.set(showId, detail);
    return detail;
}

function detailHasExcludedAffiliation(detail) {
    if ((detail.networks || []).some(n => TV_EXCLUDED_NETWORK_IDS.has(n.id))) return true;
    if ((detail.production_companies || []).some(c => TV_EXCLUDED_COMPANY_IDS.has(c.id))) return true;

    const createdBy = detail.created_by || [];
    if (createdBy.some(p => /tyler perry/i.test(p.name || ''))) return true;

    const crew = detail.credits?.crew || [];
    if (crew.some(p => /tyler perry/i.test(p.name || '') && /creator|executive producer|writer|director/i.test(p.job || ''))) {
        return true;
    }

    return false;
}

function isExcludedTvShow(show, mode = currentTvMode) {
    if ((show.genre_ids || []).some(id => TV_BLOCKED_GENRE_IDS.has(id))) return true;
    if (mode === 'upcoming' && (show.genre_ids || []).includes(99)) return true;
    if (isAsianAnime(show)) return true;

    const genres = show.genre_ids || [];
    if (genres.includes(10751) && genres.includes(16) && !genres.includes(35)) {
        return true;
    }

    return matchesExcludedPatterns(show);
}

function isUpcomingQualityShow(show) {
    if (!show.poster_path) return false;
    if ((show.popularity || 0) < TV_UPCOMING_MIN_POPULARITY) return false;

    const overview = (show.overview || '').trim();
    if (overview.length < TV_UPCOMING_MIN_OVERVIEW) return false;
    if (!show.first_air_date) return false;

    const today = todayISO();
    if (show.first_air_date < today) return false;
    if (show.first_air_date > daysFromTodayISO(TV_UPCOMING_MAX_DAYS)) return false;

    const name = (show.name || '').trim();
    if (name.length < 2) return false;

    return true;
}

function formatTvDateMeta(show, mode) {
    const date = show.first_air_date || '';
    if (mode === 'upcoming') {
        if (!date) {
            return { short: 'Premiere TBA', aria: 'premiere date to be announced', modal: 'Premiere date TBA' };
        }
        const formatted = formatDisplayDate(date);
        return {
            short: formatted,
            aria: `premieres ${formatted}`,
            modal: `Premieres ${formatted}`
        };
    }

    const year = date.slice(0, 4) || 'TBA';
    if (!date) {
        return { short: year, aria: 'air date to be announced', modal: 'Air date TBA' };
    }
    return {
        short: year,
        aria: `first aired ${year}`,
        modal: `First aired ${formatDisplayDate(date)}`
    };
}

async function isExcludedTvShowAsync(show, mode = currentTvMode) {
    if (mode === 'upcoming' && !isUpcomingQualityShow(show)) return true;
    if (isExcludedTvShow(show, mode)) return true;
    try {
        const detail = await fetchTvDetail(show.id);
        if (detailHasExcludedAffiliation(detail)) return true;
        if (matchesExcludedPatterns(detail)) return true;
    } catch (_) {
        return mode !== 'upcoming';
    }
    return false;
}

async function tryCollectTvShow(show, mode, collected, seen, targetCount) {
    if (seen.has(show.id) || collected.length >= targetCount) return false;
    if (mode === 'upcoming' && !isUpcomingQualityShow(show)) return false;
    if (await isExcludedTvShowAsync(show, mode)) return false;
    seen.add(show.id);
    collected.push(show);
    return true;
}

async function fetchUpcomingTvShows(targetCount = TV_LINEUP_TARGET) {
    const collected = [];
    const seen = new Set();

    for (let page = 1; page <= 10 && collected.length < targetCount; page++) {
        const res = await fetch(tvEndpoint('upcoming', page), { headers: TMDB_HEADERS });
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        const batch = data.results || [];
        if (batch.length === 0) break;

        for (const show of batch) {
            await tryCollectTvShow(show, 'upcoming', collected, seen, targetCount);
            if (collected.length >= targetCount) break;
        }

        if (page >= (data.total_pages || 1)) break;
    }

    if (collected.length < targetCount) {
        const trendRes = await fetch(
            tmdbUrl('/trending/tv/week', { page: '1' }),
            { headers: TMDB_HEADERS }
        );
        if (trendRes.ok) {
            const trendData = await trendRes.json();
            const today = todayISO();
            const maxDate = daysFromTodayISO(TV_UPCOMING_MAX_DAYS);
            for (const show of trendData.results || []) {
                if (collected.length >= targetCount) break;
                if (!show.first_air_date || show.first_air_date < today || show.first_air_date > maxDate) continue;
                await tryCollectTvShow(show, 'upcoming', collected, seen, targetCount);
            }
        }
    }

    collected.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return collected.slice(0, targetCount);
}

async function fetchFilteredTvShows(mode, targetCount = TV_LINEUP_TARGET) {
    if (mode === 'upcoming') {
        return fetchUpcomingTvShows(targetCount);
    }

    const collected = [];
    const seen = new Set();

    for (let page = 1; page <= 5 && collected.length < targetCount; page++) {
        const res = await fetch(tvEndpoint(mode, page), { headers: TMDB_HEADERS });
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        const batch = data.results || [];

        if (batch.length === 0) break;

        for (const show of batch) {
            if (seen.has(show.id)) continue;
            if (await isExcludedTvShowAsync(show, mode)) continue;
            seen.add(show.id);
            collected.push(show);
            if (collected.length >= targetCount) break;
        }

        if (page >= (data.total_pages || 1)) break;
    }

    return collected;
}

function renderTvCarousel(shows, mode = currentTvMode) {
    const carousel = document.getElementById('tv-carousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    carousel.setAttribute('aria-label', mode === 'upcoming' ? 'Upcoming TV shows' : 'TV shows');

    shows.forEach((show, index) => {
        const meta = formatTvDateMeta(show, mode);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'theater-ticket';
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `${show.name}, ${meta.aria}. View details and trailer`);
        card.innerHTML = `
            <span class="ticket-rank" aria-hidden="true">#${index + 1}</span>
            <img src="${escapeAttr(posterUrl(show))}" alt="" aria-hidden="true" loading="lazy" />
            <div class="ticket-body">
                <p class="ticket-title">${escapeHtml(show.name)}</p>
                <p class="ticket-meta">${escapeHtml(meta.short)}</p>
            </div>`;
        card.addEventListener('click', () => openTvModal(show, mode));
        carousel.appendChild(card);
    });
}

async function openTvModal(show, mode = currentTvMode) {
    const title = document.getElementById('tv-modal-title');
    const meta = document.getElementById('tv-modal-meta');
    const synopsis = document.getElementById('tv-modal-synopsis');
    const trailerSlot = document.getElementById('tv-trailer-slot');
    const dateMeta = formatTvDateMeta(show, mode);

    title.textContent = show.name;
    meta.textContent = dateMeta.modal;
    synopsis.textContent = show.overview || 'No synopsis available yet.';
    trailerSlot.innerHTML = '<div class="theater-no-trailer">Loading trailer…</div>';
    A11y.openModal('tv-modal', '#tv-modal-close');

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
    document.getElementById('tv-trailer-slot').innerHTML = '';
    A11y.closeModal('tv-modal');
}

async function loadTvTab(mode) {
    currentTvMode = mode;
    const statusLine = document.getElementById('tv-status');
    if (!statusLine) return;

    document.querySelectorAll('.tv-tab').forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    const tabIds = { airing: 'tv-tab-airing', popular: 'tv-tab-popular', upcoming: 'tv-tab-upcoming' };
    document.getElementById('tv-carousel')?.setAttribute('aria-labelledby', tabIds[mode] || 'tv-tab-airing');

    statusLine.textContent = 'Loading…';
    try {
        const shows = await fetchFilteredTvShows(mode);
        statusLine.textContent = `${shows.length} ${TV_STATUS_LABELS[mode]} · updated ${new Date().toLocaleDateString()}`;
        renderTvCarousel(shows, mode);
    } catch (_) {
        statusLine.textContent = 'Couldn\'t reach TMDB — try again later';
        renderTvCarousel([], mode);
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
    loadTvTab(currentTvMode);
}

document.addEventListener('DOMContentLoaded', setupTvLineup);

window.closeTvModal = closeTvModal;
