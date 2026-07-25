// TMDB — read-only credentials (client-side, public GitHub Pages site)
const TMDB_API_KEY = '4a5fa35a2462f5f79e737f9a08d5de12';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YTVmYTM1YTI0NjJmNWY3OWU3MzdmOWEwOGQ1ZGUxMiIsIm5iZiI6MTc4NTAwMDg5NS44MzMsInN1YiI6IjZhNjRmM2JmNmM1ZWFlNzVkODQyMzMzNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9nIjoxfQ.EOydDNFz540A-_25iZaAOIC0do6sHOl8YDYOiNnKsZA';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w342';
const TMDB_HEADERS = { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` };

function tmdbUrl(path, params = {}) {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
}

function posterUrl(movie) {
    if (movie.poster_path) return TMDB_IMG_BASE + movie.poster_path;
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

function renderTheaterCarousel(movies) {
    const carousel = document.getElementById('theaters-carousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    movies.forEach((movie, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'theater-ticket';
        card.innerHTML = `
            <span class="ticket-rank">#${index + 1}</span>
            <img src="${escapeAttr(posterUrl(movie))}" alt="${escapeAttr(movie.title)} poster" loading="lazy" />
            <div class="ticket-body">
                <p class="ticket-title">${escapeHtml(movie.title)}</p>
                <p class="ticket-meta">${(movie.release_date || '').slice(0, 4) || 'TBA'}</p>
            </div>`;
        card.addEventListener('click', () => openTheaterModal(movie));
        carousel.appendChild(card);
    });
}

async function openTheaterModal(movie) {
    const overlay = document.getElementById('theater-modal');
    const title = document.getElementById('theater-modal-title');
    const meta = document.getElementById('theater-modal-meta');
    const synopsis = document.getElementById('theater-modal-synopsis');
    const trailerSlot = document.getElementById('theater-trailer-slot');

    title.textContent = movie.title;
    meta.textContent = movie.release_date ? `Released ${movie.release_date}` : 'Release date TBA';
    synopsis.textContent = movie.overview || 'No synopsis available yet.';
    trailerSlot.innerHTML = '<div class="theater-no-trailer">Loading trailer…</div>';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';

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
    const overlay = document.getElementById('theater-modal');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.getElementById('theater-trailer-slot').innerHTML = '';
    document.body.style.overflow = '';
}

async function loadNowPlaying() {
    const statusLine = document.getElementById('theaters-status');
    if (!statusLine) return;

    statusLine.textContent = 'Loading current releases…';
    try {
        const res = await fetch(tmdbUrl('/movie/now_playing', { region: 'US', page: '1' }), { headers: TMDB_HEADERS });
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        const movies = (data.results || []).slice(0, 12);
        statusLine.textContent = `${movies.length} titles in theaters · updated ${new Date().toLocaleDateString()}`;
        renderTheaterCarousel(movies);
    } catch (_) {
        statusLine.textContent = 'Couldn\'t reach TMDB — try again later';
        renderTheaterCarousel([]);
    }
}

function setupTheaters() {
    document.getElementById('theaters-refresh')?.addEventListener('click', loadNowPlaying);
    document.getElementById('theater-modal-close')?.addEventListener('click', closeTheaterModal);
    document.getElementById('theater-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'theater-modal') closeTheaterModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTheaterModal();
    });
    loadNowPlaying();
}

document.addEventListener('DOMContentLoaded', setupTheaters);

window.closeTheaterModal = closeTheaterModal;
