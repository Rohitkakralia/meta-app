// app/api/template-media/route.js
//
// Proxy endpoint to serve template media from Facebook CDN
// Facebook CDN URLs require authentication, so we proxy them through our server

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaUrl = searchParams.get('url');
    
    if (!mediaUrl) {
      return new Response('Missing media URL', { status: 400 });
    }

    const accessToken = process.env.ACCESS_TOKEN;
    if (!accessToken) {
      return new Response('Missing access token', { status: 500 });
    }

    // Fetch the media from Facebook CDN with authentication
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`[template-media] Failed to fetch media: ${response.status} ${response.statusText}`);
      return new Response('Failed to fetch media', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    // Return the media with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[template-media] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}