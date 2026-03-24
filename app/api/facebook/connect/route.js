import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken, pageId, pageName } = await request.json();

    // Store Facebook integration data using Prisma
    const integration = await prisma.facebookIntegration.upsert({
      where: { userId: session.user.id },
      update: {
        accessToken,
        pageId,
        pageName,
        connected: true,
        lastSync: new Date(),
      },
      create: {
        userId: session.user.id,
        accessToken,
        pageId,
        pageName,
        connected: true,
        connectedAt: new Date(),
        lastSync: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Facebook integration connected successfully",
      data: {
        pageId: integration.pageId,
        pageName: integration.pageName,
        connected: integration.connected,
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

    // Get user's Facebook integration using Prisma
    const integration = await prisma.facebookIntegration.findUnique({
      where: { userId: session.user.id },
    });

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: integration.connected,
      pageId: integration.pageId,
      pageName: integration.pageName,
      connectedAt: integration.connectedAt,
      lastSync: integration.lastSync,
    });
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

    // Remove Facebook integration using Prisma
    await prisma.facebookIntegration.delete({
      where: { userId: session.user.id },
    });

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
