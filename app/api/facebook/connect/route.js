import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, pageId, pageName } = await request.json();

    // For now, we'll just return success without storing in database
    // You can implement your preferred storage solution here
    console.log("Facebook integration data:", {
      accessToken,
      pageId,
      pageName,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Facebook integration connected successfully",
      data: {
        pageId,
        pageName,
        connected: true,
      },
    });
  } catch (error) {
    console.error("Facebook connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Facebook integration" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Since we removed database storage, return disconnected for now
    // You can implement your preferred storage solution here
    return NextResponse.json({ connected: false });
  } catch (error) {
    console.error("Facebook get integration error:", error);
    return NextResponse.json(
      { error: "Failed to get Facebook integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, we'll just return success without database operations
    // You can implement your preferred storage solution here
    console.log("Facebook integration disconnected for user:", session.user.id);

    return NextResponse.json({
      success: true,
      message: "Facebook integration disconnected successfully",
    });
  } catch (error) {
    console.error("Facebook disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Facebook integration" },
      { status: 500 }
    );
  }
}
