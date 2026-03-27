// Debug endpoint to test WhatsApp API credentials
export async function GET() {
  try {
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("[debug] Environment variables:", {
      phoneNumberId: phoneNumberId ? "✅ Set" : "❌ Missing",
      accessToken: accessToken ? "✅ Set" : "❌ Missing"
    });

    if (!phoneNumberId || !accessToken) {
      return Response.json({
        error: "Missing environment variables",
        phoneNumberId: !!phoneNumberId,
        accessToken: !!accessToken
      }, { status: 500 });
    }

    // Test API connection by getting phone number info
    const testUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name`;
    
    const res = await fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({
        error: "WhatsApp API test failed",
        status: res.status,
        response: data
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "WhatsApp API credentials are working",
      phoneInfo: data
    });

  } catch (err) {
    console.error("[debug] WhatsApp test error:", err);
    return Response.json({
      error: "Test failed",
      message: err.message
    }, { status: 500 });
  }
}