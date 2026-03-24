// Script to clean up duplicate phone numbers
import pool from "./db/connectDB.js";

async function cleanupDuplicates() {
  try {
    console.log("🧹 Cleaning up duplicate phone numbers...");
    
    // Find duplicates
    const [duplicates] = await pool.query(`
      SELECT phone, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM contacts 
      GROUP BY phone 
      HAVING COUNT(*) > 1
    `);
    
    console.log(`Found ${duplicates.length} duplicate phone numbers`);
    
    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(id => parseInt(id));
      const keepId = Math.min(...ids); // Keep the oldest record
      const deleteIds = ids.filter(id => id !== keepId);
      
      console.log(`Phone ${dup.phone}: Keeping ID ${keepId}, deleting IDs ${deleteIds.join(', ')}`);
      
      if (deleteIds.length > 0) {
        const placeholders = deleteIds.map(() => '?').join(', ');
        await pool.query(`DELETE FROM contacts WHERE id IN (${placeholders})`, deleteIds);
      }
    }
    
    console.log("✅ Cleanup completed!");
    
    // Show remaining contacts
    const [remaining] = await pool.query("SELECT COUNT(*) as count FROM contacts");
    console.log(`📊 Total contacts remaining: ${remaining[0].count}`);
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await pool.end();
  }
}

cleanupDuplicates();