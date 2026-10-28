export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Extract the path (e.g., "/aB3x9Z" becomes "aB3x9Z")
  const path = url.pathname.substring(1);

  // Ignore requests to the root or known static assets
  if (!path || path.includes('.')) {
    return context.next(); // Let Cloudflare Pages serve the static file
  }

  // Look up the short code in KV
  const longUrl = await env.SHORT_LINKS.get(path);

  if (longUrl) {
    return Response.redirect(longUrl, 302); // 302 Temporary Redirect is safer for analytics and changes
  }

  return new Response('Link not found', { status: 404 });
}