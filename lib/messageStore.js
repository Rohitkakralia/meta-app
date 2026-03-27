// lib/messageStore.js
//
// Global singleton store — survives across requests in the same
// Node.js process (Next.js dev server or a single serverless instance).
//
// In production replace the Maps with Redis / a real DB.

const store    = new Map(); // phone → Message[]
const idIndex  = new Map(); // messageId → phone

export const messageStore = {

  // ── Save a new message (call this from send route AND webhook) ──
  save(message) {
    // The "other party" phone number is the conversation key
    const phone = message.direction === "outbound" ? message.to : message.from;
    if (!phone) {
      console.warn("[messageStore] save() called with no phone, skipping", message);
      return null;
    }

    // Deduplicate by id — don't push the same wamid twice
    const existing = store.get(phone) ?? [];
    if (message.id && existing.some((m) => m.id === message.id)) {
      console.log(`[messageStore] duplicate id ${message.id} — skipped`);
      return existing.find((m) => m.id === message.id);
    }

    existing.push(message);
    store.set(phone, existing);

    if (message.id) {
      idIndex.set(message.id, phone);
      console.log(`[messageStore] saved ${message.direction} | id=${message.id} | phone=${phone}`);
    }

    return message;
  },

  // ── Update status of an outbound message by its wamid ──
  updateStatus(messageId, status) {
    const phone = idIndex.get(messageId);
    if (!phone) {
      // Message wasn't saved at send-time — store a skeleton so
      // future status updates (delivered, read) can still be tracked
      console.warn(`[messageStore] updateStatus: id ${messageId} not in index`);
      return null;
    }

    const messages = store.get(phone) ?? [];
    const msg      = messages.find((m) => m.id === messageId);
    if (!msg) return null;

    msg.status    = status;
    msg.updatedAt = Date.now();
    store.set(phone, messages);

    console.log(`[messageStore] ${messageId} → ${status} (phone=${phone})`);
    return msg;
  },

  // ── Get full conversation sorted oldest → newest ──
  getConversation(phone) {
    // Normalize phone: strip leading + or spaces so "919915082305"
    // matches "+919915082305" etc.
    const key = normalizePhone(phone);

    // Try exact match first, then normalized match
    let messages = store.get(phone) ?? store.get(key) ?? [];

    // Also check all keys that normalize to the same number
    if (messages.length === 0) {
      for (const [k, v] of store.entries()) {
        if (normalizePhone(k) === key) { messages = v; break; }
      }
    }

    return [...messages].sort((a, b) => a.timestamp - b.timestamp);
  },

  // ── Get all conversations for sidebar ──
  getAllConversations() {
    const result = [];
    for (const [phone, messages] of store.entries()) {
      if (!messages.length) continue;
      const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
      result.push({
        phone,
        lastMessage: sorted[sorted.length - 1],
        unread: sorted.filter(
          (m) => m.direction === "inbound" && m.status !== "read"
        ).length,
        total: sorted.length,
      });
    }
    return result.sort(
      (a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp
    );
  },

  // ── Debug helper ──
  dump() {
    const out = {};
    for (const [k, v] of store.entries()) out[k] = v;
    return { store: out, idIndex: Object.fromEntries(idIndex) };
  },
};

function normalizePhone(phone) {
  return String(phone).replace(/[\s\-()+]/g, "");
}