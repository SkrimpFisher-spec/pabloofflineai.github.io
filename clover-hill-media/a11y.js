// Keyboard focus, modal traps, and screen-reader announcements
const A11Y_FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

let a11yLastFocus = null;

function a11yGetFocusable(container) {
    return Array.from(container.querySelectorAll(A11Y_FOCUSABLE))
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
}

function a11yAnyModalOpen() {
    return !!document.querySelector('.retro-modal.flex');
}

function a11yOpenModal(modalId, focusSelector) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (!a11yAnyModalOpen()) {
        a11yLastFocus = document.activeElement;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    const panel = modal.querySelector('.modal-panel, .theater-modal-panel') || modal;
    const focusTarget = focusSelector
        ? panel.querySelector(focusSelector)
        : a11yGetFocusable(panel)[0];

    requestAnimationFrame(() => focusTarget?.focus());
}

function a11yCloseModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    if (!a11yAnyModalOpen()) {
        document.body.style.overflow = '';
        if (a11yLastFocus?.focus) {
            a11yLastFocus.focus();
            a11yLastFocus = null;
        }
    }
}

function a11yTrapFocus(modal, event) {
    if (event.key !== 'Tab') return;

    const focusable = a11yGetFocusable(modal);
    if (focusable.length === 0) {
        event.preventDefault();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function a11ySetupModal(modalId, closeFn) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('flex')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeFn();
            return;
        }

        a11yTrapFocus(modal, event);
    });
}

function a11ySetupTabList(tablistSelector, onActivate) {
    document.querySelectorAll(tablistSelector).forEach(tablist => {
        const getTabs = () => Array.from(tablist.querySelectorAll('[role="tab"]'));

        tablist.addEventListener('keydown', (event) => {
            const tabs = getTabs();
            const currentIndex = tabs.indexOf(document.activeElement);
            if (currentIndex === -1) return;

            let nextIndex = currentIndex;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                nextIndex = (currentIndex + 1) % tabs.length;
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            } else if (event.key === 'Home') {
                event.preventDefault();
                nextIndex = 0;
            } else if (event.key === 'End') {
                event.preventDefault();
                nextIndex = tabs.length - 1;
            } else {
                return;
            }

            tabs[nextIndex].focus();
            if (onActivate) onActivate(tabs[nextIndex]);
            else tabs[nextIndex].click();
        });
    });
}

function a11ySyncTabs(tablistSelector, activeValue, valueAttr = 'data-filter') {
    const tablist = document.querySelector(tablistSelector);
    if (!tablist) return;

    tablist.querySelectorAll('[role="tab"]').forEach(tab => {
        const isActive = tab.getAttribute(valueAttr) === activeValue;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
}

function a11yAnnounce(message, priority = 'polite') {
    let region = document.getElementById('a11y-live-region');
    if (!region) return;

    region.setAttribute('aria-live', priority);
    region.textContent = '';
    requestAnimationFrame(() => {
        region.textContent = message;
    });
}

function a11yInit() {
    a11ySetupModal('edit-modal', () => window.closeEditModal?.());
    a11ySetupModal('ambiance-modal', () => window.closeAmbianceModal?.());
    a11ySetupModal('theater-modal', () => window.closeTheaterModal?.());
    a11ySetupModal('tv-modal', () => window.closeTvModal?.());

    a11ySetupTabList('#platform-filters');
    a11ySetupTabList('#theaters-section .movie-tabs');
    a11ySetupTabList('#tv-section .tv-tabs');
}

document.addEventListener('DOMContentLoaded', a11yInit);

window.A11y = {
    openModal: a11yOpenModal,
    closeModal: a11yCloseModal,
    announce: a11yAnnounce,
    syncTabs: a11ySyncTabs
};
