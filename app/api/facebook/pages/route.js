import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken } = await request.json();

    // Fetch user's Facebook pages
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,category,tasks`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Facebook pages");
    }

    const data = await response.json();

    // Filter pages that have manage_pages permission
    const pages =
      data.data?.filter(
        (page) => page.tasks && page.tasks.includes("MANAGE")
      ) || [];

    return NextResponse.json({
      success: true,
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        accessToken: page.access_token,
      })),
    });
  } catch (error) {
    console.error("Facebook pages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Facebook pages" },
      { status: 500 }
    );
  }
}
