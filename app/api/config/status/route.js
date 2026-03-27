import { NextResponse } from "next/server";

// Get configuration status
export async function GET() {
  try {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const webhookToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    const nodeEnv = process.env.NODE_ENV;

    const config = {
      environment: nodeEnv || "development",
      whatsappApi: {
        phoneNumberId: phoneNumberId ? "✅ Configured" : "❌ Missing",
        accessToken: accessToken ? "✅ Configured" : "❌ Missing",
        webhookToken: webhookToken ? "✅ Configured" : "❌ Missing"
      },
      developmentMode: nodeEnv === "development" && (!phoneNumberId || !accessToken),
      ready: !!(phoneNumberId && accessToken && webhookToken),
      webhookUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhook`
    };

    return NextResponse.json({
      success: true,
      config,
      message: config.ready 
        ? "✅ WhatsApp API is fully configured" 
        : config.developmentMode 
          ? "🧪 Running in development mode - messages will be simulated"
          : "⚠️ WhatsApp API configuration incomplete"
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}