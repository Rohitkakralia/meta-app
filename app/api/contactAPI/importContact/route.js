import { NextResponse } from "next/server";
import pool from "@/db/connectDB";

// POST /api/contactAPI/importContact
// body: { contacts: { name, phone, source }[] }
export async function POST(request) {
  try {
    const body = await request.json();
    const { contacts } = body;
    console.log("body:", body);

    // ── Validation ────────────────────────────────────────────────────────
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: "No contacts provided" },
        { status: 400 }
      );
    }

    // Filter out rows missing name or phone
    const valid = contacts.filter((c) => c.name?.trim() && c.phone?.trim());

    if (valid.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid contacts (name + phone required)" },
        { status: 400 }
      );
    }

    // ── Check for existing phone numbers ──────────────────────────────────
    const phoneNumbers = valid.map(c => c.phone.trim());
    const placeholders = phoneNumbers.map(() => "?").join(", ");
    
    const [existingContacts] = await pool.query(
      `SELECT phone FROM contacts WHERE phone IN (${placeholders})`,
      phoneNumbers
    );
    
    const existingPhones = new Set(existingContacts.map(c => c.phone));
    
    // Split contacts into new and duplicate
    const newContacts = valid.filter(c => !existingPhones.has(c.phone.trim()));
    const duplicateContacts = valid.filter(c => existingPhones.has(c.phone.trim()));
    
    console.log(`Found ${newContacts.length} new contacts, ${duplicateContacts.length} duplicates`);

    let insertedContacts = [];
    
    // ── Bulk INSERT only new contacts ─────────────────────────────────────
    if (newContacts.length > 0) {
      const placeholders = newContacts.map(() => "(?, ?, ?, NOW(), NOW())").join(", ");
      const values = newContacts.flatMap((c) => [
        c.name.trim(),
        c.phone.trim(),
        c.source?.trim() || "csv",
      ]);

      const [result] = await pool.query(
        `INSERT INTO contacts (name, phone, source, created_at, updated_at)
         VALUES ${placeholders}`,
        values
      );

      // ── Fetch all inserted rows ───────────────────────────────────────────
      const firstId = result.insertId;
      const count = result.affectedRows;

      const [rows] = await pool.query(
        `SELECT id, name, phone, source, created_at, updated_at
         FROM contacts
         WHERE id >= ? AND id < ?`,
        [firstId, firstId + count]
      );
      
      insertedContacts = rows;
    }

    // ── Return results with summary ───────────────────────────────────────
    const message = newContacts.length > 0 
      ? `${newContacts.length} contact(s) imported successfully${duplicateContacts.length > 0 ? `, ${duplicateContacts.length} duplicates skipped` : ''}`
      : `No new contacts imported - all ${duplicateContacts.length} contacts already exist`;

    return NextResponse.json(
      {
        success: true,
        message,
        data: insertedContacts,
        summary: {
          total: valid.length,
          imported: newContacts.length,
          duplicates: duplicateContacts.length,
          duplicatePhones: duplicateContacts.map(c => c.phone.trim())
        }
      },
      { status: newContacts.length > 0 ? 201 : 200 }
    );

  } catch (error) {
    console.error("[importContact] DB error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}