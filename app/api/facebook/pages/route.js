import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Session data:", session); // Debug log

    const { accessToken } = await request.json();

    // Use the access token from the session if not provided
    const token = accessToken || session.accessToken;

    console.log("Access token available:", !!token); // Debug log

    if (!token) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 400 }
      );
    }

    // Fetch user's Facebook pages
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`
    );
    const data = await response.json();

    console.log("Facebook API response:", data); // Debug log

    if (data.error) {
      console.error("Facebook API error:", data.error);
      return NextResponse.json(
        { error: "Failed to fetch Facebook pages" },
        { status: 400 }
      );
    }

    // Transform the pages data
    const pages =
      data.data?.map((page) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
        tasks: page.tasks || [],
      })) || [];

    return NextResponse.json({
      success: true,
      pages,
    });
  } catch (error) {
    console.error("Facebook pages API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Facebook pages" },
      { status: 500 }
    );
  }
}
