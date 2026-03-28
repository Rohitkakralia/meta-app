// app/api/whatsapp-media/route.js
//
// Proxy endpoint to serve media from WhatsApp Media API
// WhatsApp media URLs require authentication, so we proxy them through our server

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');
    
    if (!mediaId) {
      return new Response('Missing media ID', { status: 400 });
    }

    const accessToken = process.env.ACCESS_TOKEN;
    if (!accessToken) {
      return new Response('Missing access token', { status: 500 });
    }

    // First, get the media URL from WhatsApp
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!mediaInfoResponse.ok) {
      console.error(`[whatsapp-media] Failed to get media info: ${mediaInfoResponse.status}`);
      return new Response('Failed to get media info', { status: mediaInfoResponse.status });
    }

    const mediaInfo = await mediaInfoResponse.json();
    const mediaUrl = mediaInfo.url;

    if (!mediaUrl) {
      return new Response('No media URL found', { status: 404 });
    }

    // Now fetch the actual media content
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!mediaResponse.ok) {
      console.error(`[whatsapp-media] Failed to fetch media: ${mediaResponse.status}`);
      return new Response('Failed to fetch media', { status: mediaResponse.status });
    }

    const contentType = mediaResponse.headers.get('content-type') || 'application/octet-stream';
    const buffer = await mediaResponse.arrayBuffer();

    // Return the media with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[whatsapp-media] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}