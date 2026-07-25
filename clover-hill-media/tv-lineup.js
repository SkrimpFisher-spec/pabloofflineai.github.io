const TV_STATUS_LABELS = {
    airing: 'English-language shows with new episodes this week',
    popular: 'most popular English-language shows right now',
    upcoming: 'anticipated English-language shows coming soon'
};

let currentTvMode = 'airing';

function tvEndpoint(mode) {
    switch (mode) {
        case 'airing':
            return tmdbUrl('/discover/tv', englishDiscoverParams({
                sort_by: 'popularity.desc',
                'air_date.gte': daysFromTodayISO(-7),
                'air_date.lte': daysFromTodayISO(7),
                page: '1'
            }));
        case 'popular':
            return tmdbUrl('/discover/tv', englishDiscoverParams({
                sort_by: 'popularity.desc',
                page: '1'
            }));
        case 'upcoming':
            return tmdbUrl('/discover/tv', englishDiscoverParams({
                sort_by: 'popularity.desc',
                'first_air_date.gte': todayISO(),
                page: '1'
            }));
        default:
            return tmdbUrl('/discover/tv', englishDiscoverParams({
                sort_by: 'popularity.desc',
                page: '1'
            }));
    }
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
        const res = await fetch(tvEndpoint(mode), { headers: TMDB_HEADERS });
        if (!res.ok) throw new Error('TMDB error');
        const data = await res.json();
        const shows = (data.results || []).slice(0, 12);
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
