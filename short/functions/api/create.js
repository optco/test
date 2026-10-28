export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { url, token } = await request.json();
    
    if (!url || !token) {
      return new Response(JSON.stringify({ error: 'URL and CAPTCHA token are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify Turnstile CAPTCHA (Replace 'your-secret-key' with your Cloudflare Turnstile Secret Key)
    const formData = new FormData();
    formData.append('secret', 'your-secret-key');
    formData.append('response', token);
    
    const captchaRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const captchaData = await captchaRes.json();
    
    if (!captchaData.success) {
      return new Response(JSON.stringify({ error: 'CAPTCHA verification failed' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate random 6-character alphanumeric string
    const shortCode = Math.random().toString(36).substring(2, 8);
    
    // Store in Cloudflare KV (Namespace must be bound as 'SHORT_LINKS' in Cloudflare dashboard)
    await env.SHORT_LINKS.put(shortCode, url);

    return new Response(JSON.stringify({ shortUrl: `https://gbps.me/${shortCode}` }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}