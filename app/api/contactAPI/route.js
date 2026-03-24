import { NextResponse } from "next/server";
import pool from "@/db/connectDB";

// GET /api/contactAPI
export async function GET() {
  try {
    console.log("[getAllContacts] Fetching all contacts...");
    
    const [rows] = await pool.query(
      `SELECT id, name, phone, source, created_at, updated_at
       FROM contacts
       ORDER BY created_at DESC`
    );

    console.log("[getAllContacts] Found contacts:", rows.length);

    return NextResponse.json(
      {
        success: true,
        message: "Contacts fetched successfully",
        data: rows,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[getAllContacts] DB error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contactAPI - Bulk delete
// body: { ids: number[] }
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { ids } = body;

    console.log("[bulkDelete] Deleting contacts:", ids);

    // ── Validation ────────────────────────────────────────────────────────
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No contact IDs provided" },
        { status: 400 }
      );
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    const placeholders = ids.map(() => "?").join(", ");
    const [result] = await pool.query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids
    );

    console.log("[bulkDelete] Deleted contacts:", result.affectedRows);

    return NextResponse.json(
      {
        success: true,
        message: `${result.affectedRows} contact(s) deleted successfully`,
        deletedCount: result.affectedRows,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[bulkDelete] DB error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}