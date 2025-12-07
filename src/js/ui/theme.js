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
    console.info(`[theme] applyTheme requested=${requested}`);
    if (requested === 'auto') {
        // helpful debug: show call stack when 'auto' is applied
        try { console.debug('[theme] applyTheme caller stack:\n' + (new Error().stack || 'no stack')); } catch (e) {}
    }

    const body = document.body;
    // compute effective class
    const effective = (requested === 'auto') ? (_isSystemDark() ? 'night' : 'day') : requested;

    body.classList.remove('day', 'night');
    body.classList.add(effective);
    console.info(`[theme] applied effective=${effective}`);

    // emit event so UIs can sync
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { requested, effective } }));
}

export function initTheme({ listenSystem = true } = {}) {
    // apply stored or default
    const stored = getStoredTheme();
    console.info(`[theme] initTheme stored=${stored}`);
    applyTheme(stored);

    if (listenSystem && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const sysHandler = (e) => {
            // only react if user mode is 'auto'
            console.debug('[theme] system color scheme change event', e && e.matches);
            if (getStoredTheme() === 'auto') {
                console.debug('[theme] user preference is auto — reapplying');
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

// Ensure language changes don't inadvertently flip theme: re-apply stored theme
// Provide a safe refresh that reapplies the stored theme without mutating storage
function refreshThemeFromStored() {
    try {
        const stored = getStoredTheme();
        const effective = (stored === 'auto') ? (_isSystemDark() ? 'night' : 'day') : stored;
        document.body.classList.remove('day', 'night');
        document.body.classList.add(effective);
        console.debug(`[theme] refreshThemeFromStored applied requested=${stored} effective=${effective}`);
        window.dispatchEvent(new CustomEvent('theme:changed', { detail: { requested: stored, effective } }));
    } catch (e) {
        console.warn('[theme] refreshThemeFromStored failed', e);
    }
}

if (typeof window !== 'undefined') {
    const _langChanged = () => {
        // Re-apply stored theme for display only; avoid calling applyTheme()
        // which would write to localStorage and may change user's explicit choice.
        refreshThemeFromStored();
    };
    window.addEventListener('wt:setLang', _langChanged);
    window.addEventListener('wt:lang:changed', _langChanged);
}

// convenience alias
export const setTheme = applyTheme;

// optional helper for external code to subscribe easily
export function onThemeChange(cb) {
    const handler = (ev) => cb(ev.detail);
    window.addEventListener('theme:changed', handler);
    return () => window.removeEventListener('theme:changed', handler);
}
