/* ===========================
   theattn.com — App Router
   =========================== */

const BASE_PATH = ''; // Set to '/repo-name' if using GitHub Pages subdirectory

// ── SVG icons ──────────────────────────────────────────────
const ICONS = {
  twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
};

// ── Router ──────────────────────────────────────────────────
class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('popstate', () => this.resolve());
    document.addEventListener('click', e => {
      const a = e.target.closest('a[data-route]');
      if (!a) return;
      e.preventDefault();
      this.navigate(a.getAttribute('href'));
    });
  }

  on(pattern, handler) {
    this.routes[pattern] = handler;
    return this;
  }

  navigate(path) {
    history.pushState({}, '', path);
    this.resolve();
  }

  resolve() {
    // Handle GitHub Pages SPA redirect
    const redirectPath = sessionStorage.getItem('_attn_redirect');
    if (redirectPath) {
      sessionStorage.removeItem('_attn_redirect');
      history.replaceState({}, '', redirectPath);
    }

    const path = window.location.pathname.replace(BASE_PATH, '') || '/';
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      this.routes['/'] && this.routes['/']();
    } else if (segments.length === 1) {
      const handle = segments[0].toLowerCase();
      this.routes[':user'] && this.routes[':user'](handle);
    } else {
      this.routes['*'] && this.routes['*']();
    }
  }
}

// ── Data ────────────────────────────────────────────────────
let usersCache = null;

async function loadUsers() {
  if (usersCache) return usersCache;
  const res = await fetch(`${BASE_PATH}/data/users.json`);
  if (!res.ok) throw new Error('Failed to load user data');
  const json = await res.json();
  usersCache = json.users;
  return usersCache;
}

// ── Render helpers ──────────────────────────────────────────
function getApp() { return document.getElementById('app'); }

function showLoader() {
  getApp().innerHTML = `
    <div class="loader">
      <div class="loader-ring"></div>
      <p>Loading…</p>
    </div>`;
}

function showError(code = 404, msg = 'Profile not found', sub = 'Check the URL and try again.') {
  getApp().innerHTML = `
    <div class="error-view">
      <div class="error-code">${code}</div>
      <h2>${msg}</h2>
      <p>${sub}</p>
      <a href="/" data-route class="social-pill glass" style="margin-top:1rem;">← Back home</a>
    </div>`;
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Views ────────────────────────────────────────────────────
async function renderHome() {
  showLoader();
  try {
    const users = await loadUsers();
    const list = Object.values(users);

    const chipsHtml = list.map(u => `
      <a href="/${u.handle}" data-route class="profile-chip glass">
        ${u.avatar
          ? `<img class="chip-avatar" src="${u.avatar}" alt="${u.name}" loading="lazy">`
          : `<div class="chip-avatar-placeholder">${initials(u.name)}</div>`}
        <div class="chip-info">
          <div class="chip-name">${u.name}</div>
          <div class="chip-title">${u.title}</div>
        </div>
      </a>
    `).join('');

    getApp().innerHTML = `
      <div class="home-view">
        <div class="home-hero">
          <h1>The <em>attention</em><br>is yours.</h1>
          <p>Beautifully simple profiles for the people worth knowing.</p>
        </div>
        <div class="profiles-grid">${chipsHtml}</div>
      </div>`;
  } catch {
    showError(500, 'Something went wrong', 'Could not load profiles.');
  }
}

async function renderProfile(handle) {
  showLoader();
  try {
    const users = await loadUsers();
    const user = users[handle];

    if (!user) {
      showError(404, 'Profile not found', `"${handle}" doesn't exist on theattn.`);
      return;
    }

    // Stats
    const statsHtml = (user.stats || []).map(s => `
      <div class="stat-card glass">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');

    // Social pills
    const socialHtml = (user.social || []).map(s => `
      <a href="${s.url}" target="_blank" rel="noopener" class="social-pill">
        ${ICONS[s.icon] || ICONS.website}
        ${s.label}
      </a>`).join('');

    // Links
    const linksHtml = (user.links || []).map(l => `
      <a href="${l.url}" target="_blank" rel="noopener" class="link-item">
        <div class="link-icon">${l.emoji}</div>
        <div class="link-meta">
          <div class="link-label">${l.label}</div>
          <div class="link-url">${l.url.replace(/^https?:\/\//, '')}</div>
        </div>
        <div class="link-arrow">${ICONS.arrow}</div>
      </a>`).join('');

    // Tags
    const tagsHtml = (user.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    // Avatar
    const avatarHtml = user.avatar
      ? `<img class="avatar-img" src="${user.avatar}" alt="${user.name}" loading="lazy">`
      : `<div class="avatar-placeholder">${initials(user.name)}</div>`;

    getApp().innerHTML = `
      <div class="profile-view">

        <div class="p-card p-hero glass">
          <div class="avatar-wrap">
            ${avatarHtml}
            <div class="avatar-ring"></div>
          </div>
          <div class="p-hero-info">
            <h1 class="p-name">${user.name}</h1>
            <div class="p-handle">@${user.handle}</div>
            ${user.title ? `<div class="p-title">${user.title}</div>` : ''}
            ${user.bio ? `<p class="p-bio">${user.bio}</p>` : ''}
            ${user.location ? `
              <div class="p-location">
                ${ICONS.location} ${user.location}
              </div>` : ''}
          </div>
        </div>

        ${statsHtml ? `<div class="p-stats">${statsHtml}</div>` : ''}

        ${socialHtml ? `
          <div class="p-card glass">
            <div class="section-label">Connect</div>
            <div class="social-grid">${socialHtml}</div>
          </div>` : ''}

        ${linksHtml ? `
          <div class="p-card glass">
            <div class="section-label">Links</div>
            <div class="links-list">${linksHtml}</div>
          </div>` : ''}

        ${tagsHtml ? `
          <div class="p-card glass">
            <div class="section-label">Interests</div>
            <div class="tags-wrap">${tagsHtml}</div>
          </div>` : ''}

        <div class="profile-footer">
          <a href="/" data-route>← theattn.com</a>
        </div>

      </div>`;

    // Update page title & meta
    document.title = `${user.name} — theattn`;
    setMeta('description', user.bio || `${user.name}'s profile on theattn.`);
    setMeta('og:title', `${user.name} — theattn`);
    setMeta('og:description', user.bio || '');
  } catch (err) {
    console.error(err);
    showError(500, 'Something went wrong', 'Could not load this profile.');
  }
}

function setMeta(name, content) {
  const sel = name.startsWith('og:') ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  const attr = name.startsWith('og:') ? 'property' : 'name';
  let el = document.querySelector(sel);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const router = new Router();

  router
    .on('/', () => {
      document.title = 'theattn — Your profile, your attention.';
      renderHome();
    })
    .on(':user', handle => renderProfile(handle))
    .on('*',    () => showError(404, 'Page not found', 'This URL doesn\'t exist.'));

  router.resolve();
});
