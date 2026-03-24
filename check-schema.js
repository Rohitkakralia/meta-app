// Check current database schema
import pool from "./db/connectDB.js";

async function checkSchema() {
  try {
    console.log("📋 Checking database schema...");
    
    // Show table structure
    const [structure] = await pool.query("DESCRIBE contacts");
    console.log("\n📊 Table structure:");
    console.table(structure);
    
    // Show indexes
    const [indexes] = await pool.query("SHOW INDEX FROM contacts");
    console.log("\n🔑 Indexes:");
    console.table(indexes);
    
    // Show sample data
    const [sample] = await pool.query("SELECT * FROM contacts LIMIT 5");
    console.log("\n📝 Sample data:");
    console.table(sample);
    
  } catch (error) {
    console.error("❌ Schema check failed:", error);
  } finally {
    await pool.end();
  }
}

checkSchema();