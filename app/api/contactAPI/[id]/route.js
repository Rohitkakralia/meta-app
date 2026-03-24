import { NextResponse } from "next/server";
import pool from "@/db/connectDB";

// GET /api/contactAPI/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log("[getContact] Fetching contact ID:", id);

    // ── Validation ────────────────────────────────────────────────────────
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: "Invalid contact ID" },
        { status: 400 }
      );
    }

    // ── SELECT ────────────────────────────────────────────────────────────
    const [rows] = await pool.query(
      `SELECT id, name, phone, source, created_at, updated_at
       FROM contacts
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Contact not found" },
        { status: 404 }
      );
    }

    console.log("[getContact] Found contact:", rows[0]);

    return NextResponse.json(
      {
        success: true,
        message: "Contact fetched successfully",
        data: rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[getContact] DB error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/contactAPI/[id]
// body: { name: string, phone: string, source?: string }
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, source } = body;

    console.log("[updateContact] Updating contact ID:", id, "with data:", {
      name,
      phone,
      source,
    });

    // ── Validation ────────────────────────────────────────────────────────
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: "Invalid contact ID" },
        { status: 400 }
      );
    }

    const errors = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!phone?.trim()) errors.phone = "Phone is required";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // ── UPDATE ────────────────────────────────────────────────────────────
    const [result] = await pool.query(
      `UPDATE contacts 
       SET name = ?, phone = ?, source = ?, updated_at = NOW()
       WHERE id = ?`,
      [name.trim(), phone.trim(), source?.trim() || "manual", id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Contact not found" },
        { status: 404 }
      );
    }

    // ── Fetch updated contact ─────────────────────────────────────────────
    const [rows] = await pool.query(
      `SELECT id, name, phone, source, created_at, updated_at
       FROM contacts
       WHERE id = ?`,
      [id]
    );

    console.log("[updateContact] Updated contact:", rows[0]);

    return NextResponse.json(
      {
        success: true,
        message: "Contact updated successfully",
        data: rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[updateContact] DB error:", error);

    // Handle duplicate phone number error
    if (error.code === "ER_DUP_ENTRY" && error.sqlMessage.includes("phone")) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number already exists",
          errors: { phone: "This phone number is already registered" },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contactAPI/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    console.log("[deleteContact] Deleting contact ID:", id);

    // ── Validation ────────────────────────────────────────────────────────
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: "Invalid contact ID" },
        { status: 400 }
      );
    }

    // ── Get contact info before deletion ──────────────────────────────────
    const [existingRows] = await pool.query(
      `SELECT name FROM contacts WHERE id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Contact not found" },
        { status: 404 }
      );
    }

    // ── DELETE ────────────────────────────────────────────────────────────
    const [result] = await pool.query(`DELETE FROM contacts WHERE id = ?`, [
      id,
    ]);

    console.log("[deleteContact] Deleted contact:", existingRows[0].name);

    return NextResponse.json(
      {
        success: true,
        message: `Contact "${existingRows[0].name}" deleted successfully`,
        deletedContact: existingRows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[deleteContact] DB error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
