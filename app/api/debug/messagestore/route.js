// Debug endpoint to inspect messageStore contents
import { messageStore } from "@/lib/messageStore";

export async function GET() {
  try {
    const dump = messageStore.dump();
    return Response.json(dump, null, 2);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}