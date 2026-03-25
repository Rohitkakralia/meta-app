// app/api/whatsapp/send/route.js
//
// How media headers work (fully automatic — no URL input from user needed):
//
//  1. getTemplates returns comp.example.header_handle[0] for IMAGE/VIDEO/DOCUMENT templates
//     This is a Facebook CDN URL that requires your ACCESS_TOKEN to download.
//  2. We download the media from that CDN URL using the access token.
//  3. We re-upload it to WhatsApp's Media Upload API → get a fresh media_id.
//  4. We use that media_id in the send payload components.
//
// Media is uploaded ONCE and the same media_id is reused for all contacts.
//
// Frontend only needs to send: { contacts, template }
// (template = the full object from getTemplates, no extra fields needed)

function normalizePhone(phone) {
  // Strip spaces, dashes, parens, plus sign — Facebook wants plain digits
  return phone.replace(/[\s\-()+]/g, "");
}

// ── Download media from Facebook CDN (requires auth) ─────────────────────────
async function downloadMediaFromCDN(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(
      `CDN download failed for ${url}: HTTP ${res.status} ${res.statusText}`
    );
  }

  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = await res.arrayBuffer();
  return { buffer, contentType };
}

// ── Upload media to WhatsApp → returns media_id ───────────────────────────────
async function uploadToWhatsApp(buffer, contentType, phoneNumberId, accessToken) {
  // Derive file extension from content-type, e.g. "image/jpeg" → "jpeg"
  const ext = contentType.split("/")[1]?.split(";")[0]?.trim() || "bin";
  const filename = `upload.${ext}`;

  const blob = new Blob([buffer], { type: contentType });
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", contentType);
  form.append("file", blob, filename);

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  const data = await res.json();

  if (!res.ok || !data.id) {
    const msg = data?.error?.message || `Media upload failed: HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data.id; // WhatsApp media_id — valid for ~30 days
}

// ── Build WhatsApp API components from template data ─────────────────────────
// Handles: IMAGE/VIDEO/DOCUMENT headers (auto-upload), TEXT headers with vars,
//          BODY with vars, dynamic URL buttons, COPY_CODE buttons.
async function buildComponents(template, phoneNumberId, accessToken) {
  const components = [];

  for (const comp of template.components || []) {
    switch (comp.type) {

      case "HEADER": {
        const fmt = comp.format; // "IMAGE" | "VIDEO" | "DOCUMENT" | "TEXT" | "LOCATION"

        if (["IMAGE", "VIDEO", "DOCUMENT"].includes(fmt)) {
          const handleUrl = comp.example?.header_handle?.[0];

          if (!handleUrl) {
            console.warn(
              `[whatsapp/send] ${fmt} header has no example.header_handle — header component skipped`
            );
            break;
          }

          console.log(`[whatsapp/send] Downloading ${fmt} from Facebook CDN…`);
          const { buffer, contentType } = await downloadMediaFromCDN(handleUrl, accessToken);

          console.log(`[whatsapp/send] Uploading ${fmt} to WhatsApp media API…`);
          const mediaId = await uploadToWhatsApp(buffer, contentType, phoneNumberId, accessToken);
          console.log(`[whatsapp/send] ${fmt} media_id: ${mediaId}`);

          const mediaKey = fmt.toLowerCase(); // "image" | "video" | "document"
          const mediaObj = { id: mediaId };

          // For documents, pass filename from the template example if available
          if (fmt === "DOCUMENT" && comp.example?.header_text?.[0]) {
            mediaObj.filename = comp.example.header_text[0];
          }

          components.push({
            type: "header",
            parameters: [{ type: mediaKey, [mediaKey]: mediaObj }],
          });
        } else if (fmt === "TEXT" && comp.text?.includes("{{")) {
          // Dynamic TEXT header — values passed in template.headerText[]
          const vals = template.headerText || [];
          if (vals.length > 0) {
            components.push({
              type: "header",
              parameters: vals.map((v) => ({ type: "text", text: String(v) })),
            });
          }
        }
        // Static TEXT / LOCATION — no parameter entry needed
        break;
      }

      case "BODY": {
        if (!comp.text?.includes("{{")) break;
        const vals = template.bodyParams || [];
        if (vals.length > 0) {
          components.push({
            type: "body",
            parameters: vals.map((v) => ({ type: "text", text: String(v) })),
          });
        }
        break;
      }

      case "BUTTONS": {
        (comp.buttons || []).forEach((btn, idx) => {
          const val = (template.buttonParams || [])[idx];
          if (btn.type === "URL" && btn.url?.includes("{{") && val) {
            components.push({
              type: "button",
              sub_type: "url",
              index: String(idx),
              parameters: [{ type: "text", text: String(val) }],
            });
          }
          if (btn.type === "COPY_CODE" && val) {
            components.push({
              type: "button",
              sub_type: "copy_code",
              index: String(idx),
              parameters: [{ type: "coupon_code", coupon_code: String(val) }],
            });
          }
        });
        break;
      }

      // FOOTER is always static
      default:
        break;
    }
  }

  return components;
}

// ── Main POST handler ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const accessToken   = process.env.ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return Response.json(
        { error: "Missing PHONE_NUMBER_ID or ACCESS_TOKEN env vars" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { contacts, template } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return Response.json({ error: "contacts must be a non-empty array" }, { status: 400 });
    }
    if (!template?.name || !template?.language) {
      return Response.json(
        { error: "template.name and template.language are required" },
        { status: 400 }
      );
    }

    console.log(`[whatsapp/send] "${template.name}" (${template.language}) → ${contacts.length} contact(s)`);

    // ── Build components once — media is uploaded once and reused for all contacts ──
    let components = [];
    try {
      components = await buildComponents(template, phoneNumberId, accessToken);
      console.log("[whatsapp/send] Final components:", JSON.stringify(components, null, 2));
    } catch (err) {
      console.error("[whatsapp/send] Component build error:", err.message);
      return Response.json(
        { error: `Media processing error: ${err.message}` },
        { status: 500 }
      );
    }

    // ── Send to all contacts in parallel ──────────────────────────────────────
    const fbUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const rawResults = await Promise.allSettled(
      contacts.map(async (contact) => {
        const phone = normalizePhone(contact.phone);

        const payload = {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name:     template.name,
            language: { code: template.language },
            ...(components.length > 0 ? { components } : {}),
          },
        };

        const res  = await fetch(fbUrl, {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          const msg = data?.error?.message || `HTTP ${res.status}`;
          console.error(`[whatsapp/send] Error for ${phone}:`, data?.error);
          throw new Error(msg);
        }

        return {
          contactId: contact.id,
          phone,
          name:      contact.name,
          success:   true,
          messageId: data?.messages?.[0]?.id ?? null,
        };
      })
    );

    // ── Aggregate results ──────────────────────────────────────────────────────
    const summary = rawResults.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            contactId: contacts[i].id,
            phone:     contacts[i].phone,
            name:      contacts[i].name,
            success:   false,
            error:     r.reason?.message || "Unknown error",
          }
    );

    const sent   = summary.filter((r) => r.success).length;
    const failed = summary.filter((r) => !r.success).length;

    if (failed > 0) {
      console.warn("[whatsapp/send] Failures:", summary.filter((r) => !r.success));
    }

    return Response.json(
      { total: contacts.length, sent, failed, results: summary },
      { status: 200 }
    );

  } catch (err) {
    console.error("[whatsapp/send] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}