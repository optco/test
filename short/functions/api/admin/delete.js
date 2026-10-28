export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Verify Admin Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_SECRET_TOKEN}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { shortCode } = await request.json();

    if (!shortCode || typeof shortCode !== 'string' || shortCode.length < 4) {
      return new Response(JSON.stringify({ error: 'Valid shortCode is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Check if it exists (optional, but good for logging)
    const existingUrl = await env.SHORT_LINKS.get(shortCode);
    if (!existingUrl) {
      return new Response(JSON.stringify({ error: 'Short code not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 3. Delete from KV
    await env.SHORT_LINKS.delete(shortCode);

    return new Response(JSON.stringify({ success: true, message: `Successfully deleted ${shortCode}` }), { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Admin delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}