// Theme manager for site: exportované funkce pro init/apply/get
// Valid modes: 'day' | 'night' | 'auto'
// Persist in localStorage under key 'site_theme_mode'

const STORAGE_KEY = 'site_theme_mode';

function _isSystemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
}

export function applyTheme(mode = 'auto') {
    // normalize
    const requested = (mode === 'day' || mode === 'night' || mode === 'auto') ? mode : 'auto';
    localStorage.setItem(STORAGE_KEY, requested);

    const body = document.body;
    // compute effective class
    const effective = (requested === 'auto') ? (_isSystemDark() ? 'night' : 'day') : requested;

    body.classList.remove('day', 'night');
    body.classList.add(effective);

    // emit event so UIs can sync
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { requested, effective } }));
}

export function initTheme({ listenSystem = true } = {}) {
    // apply stored or default
    const stored = getStoredTheme();
    applyTheme(stored);

    if (listenSystem && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const sysHandler = (e) => {
            // only react if user mode is 'auto'
            if (getStoredTheme() === 'auto') {
                applyTheme('auto'); // recompute effective
            }
        };
        // use addEventListener when available for consistency
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', sysHandler);
        } else if (typeof mq.addListener === 'function') {
            mq.addListener(sysHandler);
        }
    }
}

// convenience alias
export const setTheme = applyTheme;

// optional helper for external code to subscribe easily
export function onThemeChange(cb) {
    const handler = (ev) => cb(ev.detail);
    window.addEventListener('theme:changed', handler);
    return () => window.removeEventListener('theme:changed', handler);
}