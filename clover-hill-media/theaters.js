// TMDB — read-only credentials (client-side, public GitHub Pages site)
const TMDB_API_KEY = '4a5fa35a2462f5f79e737f9a08d5de12';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YTVmYTM1YTI0NjJmNWY3OWU3MzdmOWEwOGQ1ZGUxMiIsIm5iZiI6MTc4NTAwMDg5NS44MzMsInN1YiI6IjZhNjRmM2JmNmM1ZWFlNzVkODQyMzMzNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.EOydDNFz540A-_25iZaAOIC0do6sHOl8YDYOiNnKsZA';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w342';
const TMDB_HEADERS = { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` };

// Hardcoded English/Western scope for all lineup queries (US, UK, AU, CA, NZ, IE)
const TMDB_ENGLISH_ORIGIN_COUNTRIES = 'US|GB|AU|CA|NZ|IE';

const MOVIE_LINEUP_TARGET = 12;
const MOVIE_STATUS_LABELS = {
    now: 'English-language titles in theaters',
    upcoming: 'highly anticipated English-language movies coming soon'
};

const MOVIE_MIN_US_CERT = 'PG-13';
const MOVIE_UPCOMING_MAX_DAYS = 120;
const MOVIE_UPCOMING_MIN_POPULARITY = 8;
const MOVIE_UPCOMING_MIN_OVERVIEW = 25;

const MOVIE_BOLLYWOOD_LANGS = new Set(['hi', 'bn', 'ta', 'te', 'ml', 'kn', 'mr', 'pa', 'gu', 'ur']);
const MOVIE_ANIME_ORIGINS = new Set(['JP', 'KR', 'CN', 'TW']);
const MOVIE_ANIME_LANGS = new Set(['ja', 'ko', 'zh', 'cn']);

const MOVIE_KIDS_TITLE_PATTERNS = [
    /paw patrol/i,
    /peppa pig/i,
    /cocomelon/i,
    /\bbluey\b/i,
    /minions/i,
    /thomas & friends/i,
    /baby shark/i,
    /spidey and his amazing friends/i,
    /gabbys dollhouse/i,
    /blippi/i,
    /sesame street/i,
    /barney\b/i,
    /teletubbies/i
];

const MOVIE_EXCLUDED_TITLE_PATTERNS = [
    /tyler perry/i,
    /\bmadea\b/i,
    /house of payne/i,
    /think like a man/i,
    /diary of a mad black woman/i,
    /why did i get married/i,
    /acrimony\b/i,
    /a fall from grace/i
];

let currentMovieMode = 'now';

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function daysFromTodayISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function englishDiscoverParams(extra = {}) {
    return {
        with_original_language: 'en',
        with_origin_country: TMDB_ENGLISH_ORIGIN_COUNTRIES,
        region: 'US',
        ...extra
    };
}

function tmdbUrl(path, params = {}) {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
}

function formatDisplayDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function posterUrl(item) {
    if (item.poster_path) return TMDB_IMG_BASE + item.poster_path;
    return "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='170' height='250'>
           <rect width='170' height='250' fill='#2a2218'/>
           <text x='50%' y='50%' fill='#c4b8a4' font-family='sans-serif' font-size='12'
                 text-anchor='middle' dominant-baseline='middle'>No poster</text>
         </svg>`
    );
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function isAsianAnimeMovie(movie) {
    const genres = movie.genre_ids || [];
    if (!genres.includes(16)) return false;

    const lang = (movie.original_language || '').toLowerCase();
    if (MOVIE_ANIME_LANGS.has(lang)) return true;

    return (movie.origin_country || []).some(code => MOVIE_ANIME_ORIGINS.has(code));
}

function isBollywoodMovie(movie) {
    const lang = (movie.original_language || '').toLowerCase();
    if (MOVIE_BOLLYWOOD_LANGS.has(lang)) return true;

    const countries = movie.origin_country || [];
    return countries.includes('IN') && lang !== 'en';
}

function isKidsMovie(movie) {
    const genres = movie.genre_ids || [];
    if (genres.includes(10751) && genres.includes(16)
        && !genres.some(id => [28, 12, 878, 14, 35, 18, 53].includes(id))) {
        return true;
    }

    const hay = `${movie.title || ''} ${movie.original_title || ''}`;
    return MOVIE_KIDS_TITLE_PATTERNS.some(pattern => pattern.test(hay));
}

function isExcludedMovie(movie) {
    if (isAsianAnimeMovie(movie)) return true;
    if (isBollywoodMovie(movie)) return true;
    if (isKidsMovie(movie)) return true;

    const hay = `${movie.title || ''} ${movie.original_title || ''} ${movie.overview || ''}`;
    return MOVIE_EXCLUDED_TITLE_PATTERNS.some(pattern => pattern.test(hay));
}

function isUpcomingQualityMovie(movie) {
    if (!movie.poster_path) return false;
    if ((movie.popularity || 0) < MOVIE_UPCOMING_MIN_POPULARITY) return false;

    const overview = (movie.overview || '').trim();
    if (overview.length < MOVIE_UPCOMING_MIN_OVERVIEW) return false;
    if (!movie.release_date) return false;

    const today = todayISO();
    if (movie.release_date < today) return false;
    if (movie.release_date > daysFromTodayISO(MOVIE_UPCOMING_MAX_DAYS)) return false;

    return true;
}

function movieDiscoverParams(mode, page) {
    const base = {
        sort_by: 'popularity.desc',
        with_release_type: '2|3',
        page: String(page)
    };

    if (mode === 'upcoming') {
        return englishDiscoverParams({
            ...base,
            'release_date.gte': todayISO(),
            'release_date.lte': daysFromTodayISO(MOVIE_UPCOMING_MAX_DAYS),
            certification_country: 'US',
            'certification.gte': MOVIE_MIN_US_CERT
        });
    }

    return englishDiscoverParams({
        ...base,
        'release_date.lte': todayISO(),
        'release_date.gte': daysFromTodayISO(-90)
    });
}

async function fetchUpcomingMovies(targetCount = MOVIE_LINEUP_TARGET) {
    const collected = [];
    const seen = new Set();

    for (let page = 1; page <= 5 && collected.length < targetCount; page++) {
        const res = await fetch(
            tmdbUrl('/movie/upcoming', { region: 'US', page: String(page) }),
            { headers: TMDB_HEADERS }
        );
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        const batch = data.results || [];
        if (batch.length === 0) break;

        for (const movie of batch) {
            if (seen.has(movie.id)) continue;
            if ((movie.original_language || '').toLowerCase() !== 'en') continue;
            if (!isUpcomingQualityMovie(movie)) continue;
            if (isExcludedMovie(movie)) continue;
            seen.add(movie.id);
            collected.push(movie);
            if (collected.length >= targetCount) break;
        }

        if (page >= (data.total_pages || 1)) break;
    }

    if (collected.length < targetCount) {
        for (let page = 1; page <= 5 && collected.length < targetCount; page++) {
            const res = await fetch(tmdbUrl('/discover/movie', movieDiscoverParams('upcoming', page)), { headers: TMDB_HEADERS });
            if (!res.ok) break;
            const data = await res.json();
            for (const movie of data.results || []) {
                if (seen.has(movie.id)) continue;
                if (!isUpcomingQualityMovie(movie)) continue;
                if (isExcludedMovie(movie)) continue;
                seen.add(movie.id);
                collected.push(movie);
                if (collected.length >= targetCount) break;
            }
            if (page >= (data.total_pages || 1)) break;
        }
    }

    collected.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return collected.slice(0, targetCount);
}

async function fetchFilteredMovies(mode, targetCount = MOVIE_LINEUP_TARGET) {
    if (mode === 'now') {
        const res = await fetch(tmdbUrl('/discover/movie', movieDiscoverParams('now', 1)), { headers: TMDB_HEADERS });
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        return (data.results || [])
            .filter(movie => !isExcludedMovie(movie))
            .slice(0, targetCount);
    }

    return fetchUpcomingMovies(targetCount);
}

function formatMovieDateMeta(movie, mode) {
    const date = movie.release_date || '';
    if (mode === 'upcoming') {
        if (!date) {
            return { short: 'Opens TBA', aria: 'release date to be announced', modal: 'Release date TBA' };
        }
        const formatted = formatDisplayDate(date);
        return {
            short: formatted,
            aria: `opens ${formatted}`,
            modal: `Opens ${formatted}`
        };
    }

    const year = date.slice(0, 4) || 'TBA';
    if (!date) {
        return { short: year, aria: 'release date to be announced', modal: 'Release date TBA' };
    }
    return {
        short: year,
        aria: `released ${year}`,
        modal: `Released ${formatDisplayDate(date)}`
    };
}

function renderTheaterCarousel(movies, mode = currentMovieMode) {
    const carousel = document.getElementById('theaters-carousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    carousel.setAttribute('aria-label', mode === 'upcoming' ? 'Upcoming movies' : 'Movies in theaters');

    movies.forEach((movie, index) => {
        const meta = formatMovieDateMeta(movie, mode);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'theater-ticket';
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `${movie.title}, ${meta.aria}. View details and trailer`);
        card.innerHTML = `
            <span class="ticket-rank" aria-hidden="true">#${index + 1}</span>
            <img src="${escapeAttr(posterUrl(movie))}" alt="" aria-hidden="true" loading="lazy" />
            <div class="ticket-body">
                <p class="ticket-title">${escapeHtml(movie.title)}</p>
                <p class="ticket-meta">${escapeHtml(meta.short)}</p>
            </div>`;
        card.addEventListener('click', () => openTheaterModal(movie, mode));
        carousel.appendChild(card);
    });
}

async function openTheaterModal(movie, mode = currentMovieMode) {
    const title = document.getElementById('theater-modal-title');
    const meta = document.getElementById('theater-modal-meta');
    const synopsis = document.getElementById('theater-modal-synopsis');
    const trailerSlot = document.getElementById('theater-trailer-slot');
    const dateMeta = formatMovieDateMeta(movie, mode);

    title.textContent = movie.title;
    meta.textContent = dateMeta.modal;
    synopsis.textContent = movie.overview || 'No synopsis available yet.';
    trailerSlot.innerHTML = '<div class="theater-no-trailer">Loading trailer…</div>';
    A11y.openModal('theater-modal', '#theater-modal-close');

    try {
        const res = await fetch(tmdbUrl(`/movie/${movie.id}/videos`), { headers: TMDB_HEADERS });
        const data = await res.json();
        const trailer = (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
            || (data.results || []).find(v => v.site === 'YouTube');
        if (trailer) {
            trailerSlot.innerHTML = `<iframe class="theater-trailer-frame" src="https://www.youtube.com/embed/${escapeAttr(trailer.key)}" allow="autoplay; encrypted-media" allowfullscreen title="${escapeAttr(movie.title)} trailer"></iframe>`;
        } else {
            trailerSlot.innerHTML = '<div class="theater-no-trailer">No trailer found for this title</div>';
        }
    } catch (_) {
        trailerSlot.innerHTML = '<div class="theater-no-trailer">Couldn\'t load trailer</div>';
    }
}

function closeTheaterModal() {
    document.getElementById('theater-trailer-slot').innerHTML = '';
    A11y.closeModal('theater-modal');
}

async function loadMovieTab(mode) {
    currentMovieMode = mode;
    const statusLine = document.getElementById('theaters-status');
    if (!statusLine) return;

    document.querySelectorAll('#theaters-section .movie-tab').forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    const tabIds = { now: 'movie-tab-now', upcoming: 'movie-tab-upcoming' };
    document.getElementById('theaters-carousel')?.setAttribute('aria-labelledby', tabIds[mode] || 'movie-tab-now');

    statusLine.textContent = mode === 'upcoming' ? 'Loading upcoming releases…' : 'Loading current releases…';
    try {
        const movies = await fetchFilteredMovies(mode);
        statusLine.textContent = `${movies.length} ${MOVIE_STATUS_LABELS[mode]} · updated ${new Date().toLocaleDateString()}`;
        renderTheaterCarousel(movies, mode);
    } catch (_) {
        statusLine.textContent = 'Couldn\'t reach TMDB — try again later';
        renderTheaterCarousel([], mode);
    }
}

function setupTheaters() {
    document.querySelectorAll('#theaters-section .movie-tab').forEach(btn => {
        btn.addEventListener('click', () => loadMovieTab(btn.dataset.mode));
    });
    document.getElementById('theaters-refresh')?.addEventListener('click', () => loadMovieTab(currentMovieMode));
    document.getElementById('theater-modal-close')?.addEventListener('click', closeTheaterModal);
    document.getElementById('theater-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'theater-modal') closeTheaterModal();
    });
    loadMovieTab(currentMovieMode);
}

document.addEventListener('DOMContentLoaded', setupTheaters);

window.closeTheaterModal = closeTheaterModal;
