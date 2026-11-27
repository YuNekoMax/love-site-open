const KEY = 'love-theme';
const MODES = ['auto', 'light', 'dark'];
const BAR = { light: '#F2EEE6', dark: '#16140F' };

export function readTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    return MODES.includes(saved) ? saved : 'auto';
  } catch (e) {
    return 'auto';
  }
}

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
  else root.removeAttribute('data-theme');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    meta.setAttribute('content', dark ? BAR.dark : BAR.light);
  }
}

export function saveTheme(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch (e) {
    /* 无痕模式里存不了，本次照样生效 */
  }
  applyTheme(mode);
}
