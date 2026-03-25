// app/api/whatsapp/getTemplates/route.js
// Next.js App Router API Route

export async function GET(request) {
  try {
    const wabaId = process.env.WABA_ID;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("[getTemplates] Fetching templates with WABA_ID:", wabaId);
    console.log("aceessToken:", accessToken ? "****" + accessToken.slice(-4) : "MISSING");

    if (!wabaId || !accessToken) {
      return Response.json(
        { error: "Missing WABA_ID or ACCESS_TOKEN environment variables" },
        { status: 500 }
      );
    }

    // Optional query params forwarded from client
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";
    const status = searchParams.get("status"); // e.g. APPROVED, PENDING, REJECTED

    // Build query string
    const params = new URLSearchParams({
      limit,
      fields: "id,name,status,category,language,components",
    });
    if (status) params.set("status", status);

    const url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      // Revalidate every 60 seconds (Next.js fetch cache)
      next: { revalidate: 60 },
    });

    const data = await response.json();
    console.log("[getTemplates] Facebook API response:", data);

    if (!response.ok) {
      // Forward Facebook's error message
      const fbError =
        data?.error?.message || "Failed to fetch templates from Facebook";
      console.error("[getTemplates] Facebook API error:", data?.error);
      return Response.json({ error: fbError }, { status: response.status });
    }

    // data.data is the array of templates from Facebook Graph API
    return Response.json(
      {
        templates: data.data || [],
        paging: data.paging || null,
        total: data.data?.length || 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[getTemplates] Unexpected error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}