import { NextResponse } from "next/server";
import pool from "@/db/connectDB";

// POST /api/contactAPI/addManually
// body: { name: string, phone: string, source?: string }
export async function POST(request) {
  try {

    const body = await request.json();
    const { name, phone, source } = body;

    console.log("[addManually] Received data:", { name, phone, source });

    // ── Validation ────────────────────────────────────────────────────────
    const errors = {};
    if (!name?.trim())  errors.name  = "Name is required";
    if (!phone?.trim()) errors.phone = "Phone is required";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // ── INSERT ────────────────────────────────────────────────────────────
    console.log("[addManually] Attempting to insert contact...");
    const [result] = await pool.query(
      `INSERT INTO contacts (name, phone, source, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [
        name.trim(),
        phone.trim(),
        source?.trim() || "manual",
      ]
    );

    console.log("[addManually] Insert result:", result);

    // ── Fetch the newly created row ───────────────────────────────────────
    const [rows] = await pool.query(
      `SELECT id, name, phone, source, created_at, updated_at
       FROM contacts
       WHERE id = ?`,
      [result.insertId]
    );

    console.log("[addManually] Created contact:", rows[0]);

    return NextResponse.json(
      {
        success: true,
        message: "Contact added successfully",
        data: rows[0],
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[addManually] DB error:", error);
    
    // Handle duplicate phone number error
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('phone')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Phone number already exists", 
          errors: { phone: "This phone number is already registered" }
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