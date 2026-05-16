/**
 * theattn.com — Cloudflare Worker
 * ─────────────────────────────────
 * Deploy this in Cloudflare Dashboard → Workers & Pages → Create Worker
 * Then add a route: theattn.com/*  →  this worker
 *
 * What it does:
 *  - Passes static asset requests through unchanged
 *  - For any clean URL like /alex or /nadia, rewrites to /index.html
 *    so the SPA router in app.js can handle it
 *  - Adds security headers to every response
 *
 * NOTE: If you use Cloudflare Pages instead of GitHub Pages, you
 * don't need this Worker at all — just add a _redirects file:
 *   /*   /index.html   200
 */

const GITHUB_PAGES_ORIGIN = 'https://YOUR-USERNAME.github.io'; // ← change this

// File extensions that should be served directly
const ASSET_REGEX = /\.(css|js|json|png|jpg|jpeg|svg|ico|webp|gif|woff2?|ttf|otf|eot|map)(\?.*)?$/i;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Always proxy assets directly
  if (ASSET_REGEX.test(path)) {
    return proxyToGithub(request, url);
  }

  // For root and profile routes, serve index.html
  // The JS router (app.js) reads window.location.pathname to decide what to show
  const indexUrl = new URL(url.toString());
  indexUrl.pathname = '/index.html';

  const response = await fetch(
    new Request(
      GITHUB_PAGES_ORIGIN + '/index.html',
      { headers: request.headers }
    )
  );

  // Clone with the correct URL so browser sees the original URL
  return addSecurityHeaders(
    new Response(response.body, {
      status: 200,
      headers: response.headers,
    })
  );
}

async function proxyToGithub(request, url) {
  const githubUrl = GITHUB_PAGES_ORIGIN + url.pathname + url.search;
  const response = await fetch(githubUrl, {
    method: request.method,
    headers: request.headers,
  });
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Cache static assets aggressively, pages conservatively
  if (ASSET_REGEX.test(new URL(response.url || '').pathname)) {
    newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    newHeaders.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
