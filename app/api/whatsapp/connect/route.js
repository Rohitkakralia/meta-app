// app/api/whatsapp/connect/route.js

export async function GET() {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!accessToken) {
      return Response.json(
        { success: false, error: "Missing access token in env" },
        { status: 500 }
      );
    }

    // 🔥 Call Meta Graph API
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/businesses?access_token=${accessToken}`
    );

    const data = await res.json();

    if (data.error) {
      console.error("Meta API error:", data.error);
      return Response.json(
        { success: false, error: data.error.message },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      businesses: data.data,
    });

  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/connect (get WABA)
export async function POST(req) {
  try {
    const { businessId } = await req.json();
    const token = process.env.FACEBOOK_ACCESS_TOKEN;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${businessId}/owned_whatsapp_business_accounts?access_token=${token}`
    );

    const data = await res.json();

    return Response.json({ success: true, wabas: data.data });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}


// PUT /api/whatsapp/connect (get phone numbers)
export async function PUT(req) {
  try {
    const { wabaId } = await req.json();
    const token = process.env.FACEBOOK_ACCESS_TOKEN;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${token}`
    );

    const data = await res.json();

    return Response.json({ success: true, phones: data.data });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}