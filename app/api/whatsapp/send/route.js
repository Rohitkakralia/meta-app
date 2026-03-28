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

// ── Get media type from MIME type ─────────────────────────────────────────────
function getMediaType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
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

  const contentType =
    res.headers.get("content-type") || "application/octet-stream";
  const buffer = await res.arrayBuffer();
  return { buffer, contentType };
}

// ── Upload media to WhatsApp → returns media_id ───────────────────────────────
async function uploadToWhatsApp(
  buffer,
  contentType,
  phoneNumberId,
  accessToken
) {
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
    const msg =
      data?.error?.message || `Media upload failed: HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data.id; // WhatsApp media_id — valid for ~30 days
}

// ── Upload media file to WhatsApp ─────────────────────────────────────────────
async function uploadMediaFile(mediaData, phoneNumberId, accessToken) {
  try {
    // Decode base64 data
    const base64Data = mediaData.file.split(",")[1]; // Remove data:image/jpeg;base64, prefix
    const buffer = Buffer.from(base64Data, "base64");

    const blob = new Blob([buffer], { type: mediaData.type });
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mediaData.type);
    form.append(
      "file",
      blob,
      mediaData.filename || `upload.${mediaData.type.split("/")[1]}`
    );

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
      const msg =
        data?.error?.message || `Media upload failed: HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data.id; // WhatsApp media_id
  } catch (error) {
    console.error("[whatsapp/send] Media upload error:", error);
    throw error;
  }
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
          const { buffer, contentType } = await downloadMediaFromCDN(
            handleUrl,
            accessToken
          );

          console.log(
            `[whatsapp/send] Uploading ${fmt} to WhatsApp media API…`
          );
          const mediaId = await uploadToWhatsApp(
            buffer,
            contentType,
            phoneNumberId,
            accessToken
          );
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

// ── Build full template display text ─────────────────────────────────────────
function buildTemplateDisplayText(template) {
  let displayText = "";
  const components = template.components || [];

  // Process each component in order
  for (const comp of components) {
    switch (comp.type) {
      case "HEADER": {
        if (comp.format === "TEXT" && comp.text) {
          // Replace placeholders with actual values
          let headerText = comp.text;
          if (template.headerText && template.headerText.length > 0) {
            template.headerText.forEach((value, index) => {
              headerText = headerText.replace(`{{${index + 1}}}`, value);
            });
          }
          displayText += `📋 ${headerText}\n\n`;
        }
        // Skip media headers since they'll be displayed as actual media
        break;
      }

      case "BODY": {
        if (comp.text) {
          let bodyText = comp.text;
          // Replace placeholders with actual values
          if (template.bodyParams && template.bodyParams.length > 0) {
            template.bodyParams.forEach((value, index) => {
              bodyText = bodyText.replace(`{{${index + 1}}}`, value);
            });
          }
          displayText += `${bodyText}\n\n`;
        }
        break;
      }

      case "FOOTER": {
        if (comp.text) {
          displayText += `${comp.text}\n\n`;
        }
        break;
      }

      case "BUTTONS": {
        if (comp.buttons && comp.buttons.length > 0) {
          displayText += "🔘 Buttons:\n";
          comp.buttons.forEach((button, index) => {
            switch (button.type) {
              case "QUICK_REPLY":
                displayText += `• ${button.text}\n`;
                break;
              case "URL":
                let url = button.url;
                if (template.buttonParams && template.buttonParams[index]) {
                  url = url.replace(/\{\{1\}\}/, template.buttonParams[index]);
                }
                displayText += `• ${button.text}: ${url}\n`;
                break;
              case "PHONE_NUMBER":
                displayText += `• ${button.text}: ${button.phone_number}\n`;
                break;
              case "COPY_CODE":
                const code =
                  template.buttonParams && template.buttonParams[index]
                    ? template.buttonParams[index]
                    : "[CODE]";
                displayText += `• ${button.text}: ${code}\n`;
                break;
            }
          });
        }
        break;
      }
    }
  }

  return displayText.trim();
}

// ── Main POST handler ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("[whatsapp/send] Environment check:", {
      phoneNumberId: phoneNumberId ? "✅ Set" : "❌ Missing",
      accessToken: accessToken ? "✅ Set" : "❌ Missing",
    });

    if (!phoneNumberId || !accessToken) {
      console.error("[whatsapp/send] Missing environment variables");
      return Response.json(
        { error: "Missing PHONE_NUMBER_ID or ACCESS_TOKEN env vars" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log("[whatsapp/send] Request body:", body);
    } catch (parseError) {
      console.error("[whatsapp/send] JSON parse error:", parseError);
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { contacts, template, text, media } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return Response.json(
        { error: "contacts must be a non-empty array" },
        { status: 400 }
      );
    }

    // Support template messages, regular text messages, and media messages
    const isTextMessage = !!text;
    const isTemplateMessage = !!template?.name && !!template?.language;
    const isMediaMessage = !!media?.file;

    if (!isTextMessage && !isTemplateMessage && !isMediaMessage) {
      return Response.json(
        {
          error:
            "Either 'text', 'template' (with name and language), or 'media' is required",
        },
        { status: 400 }
      );
    }

    console.log(
      `[whatsapp/send] ${
        isTextMessage
          ? `Text: "${text}"`
          : isTemplateMessage
          ? `Template: "${template.name}" (${template.language})`
          : `Media: ${media.type}`
      } → ${contacts.length} contact(s)`
    );

    // ── Handle media upload for media messages ──
    let mediaId = null;
    if (isMediaMessage) {
      try {
        mediaId = await uploadMediaFile(media, phoneNumberId, accessToken);
        console.log(`[whatsapp/send] Media uploaded: ${mediaId}`);
      } catch (err) {
        console.error("[whatsapp/send] Media upload error:", err.message);
        return Response.json(
          { error: `Media upload error: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // ── Build components for template messages only ──
    let components = [];
    if (isTemplateMessage) {
      try {
        components = await buildComponents(
          template,
          phoneNumberId,
          accessToken
        );
        console.log(
          "[whatsapp/send] Final components:",
          JSON.stringify(components, null, 2)
        );
      } catch (err) {
        console.error("[whatsapp/send] Component build error:", err.message);
        return Response.json(
          { error: `Media processing error: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // ── Send to all contacts in parallel ──────────────────────────────────────
    const fbUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const rawResults = await Promise.allSettled(
      contacts.map(async (contact) => {
        const phone = normalizePhone(contact.phone);

        // Build payload based on message type
        const payload = isTextMessage
          ? {
              messaging_product: "whatsapp",
              to: phone,
              type: "text",
              text: { body: text },
            }
          : isMediaMessage
          ? {
              messaging_product: "whatsapp",
              to: phone,
              type: media.type.startsWith("image/")
                ? "image"
                : media.type.startsWith("video/")
                ? "video"
                : media.type.startsWith("audio/")
                ? "audio"
                : "document",
              [media.type.startsWith("image/")
                ? "image"
                : media.type.startsWith("video/")
                ? "video"
                : media.type.startsWith("audio/")
                ? "audio"
                : "document"]: {
                id: mediaId,
                ...(media.caption ? { caption: media.caption } : {}),
                ...(media.filename &&
                !media.type.startsWith("image/") &&
                !media.type.startsWith("video/")
                  ? { filename: media.filename }
                  : {}),
              },
            }
          : {
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: {
                name: template.name,
                language: { code: template.language },
                ...(components.length > 0 ? { components } : {}),
              },
            };

        const res = await fetch(fbUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
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

        const result = {
          contactId: contact.id,
          phone,
          name: contact.name,
          success: true,
          messageId: data?.messages?.[0]?.id ?? null,
        };

        // Save outbound message to messageStore for all message types
        if (result.messageId) {
          try {
            const { messageStore } = await import("@/lib/messageStore");

            const messageData = {
              id: result.messageId,
              type: isTextMessage
                ? "text"
                : isMediaMessage
                ? getMediaType(media.type)
                : "template",
              direction: "outbound",
              to: phone,
              status: "sent",
              timestamp: Date.now(),
            };

            if (isTextMessage) {
              messageData.text = text;
            } else if (isMediaMessage) {
              // For media messages, store media info
              const mediaType = getMediaType(media.type);
              messageData[mediaType] = {
                id: mediaId,
                url: media.file, // Store the original base64 data URL for display
                caption: media.caption || null,
                filename: media.filename || null,
              };
              messageData.text =
                media.caption ||
                `${
                  mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
                } message`;
            } else {
              // For template messages, store template info and build full display text
              messageData.templateName = template.name;
              messageData.templateLanguage = template.language;

              // Store the full template structure for detailed display
              messageData.templateComponents = template.components;
              messageData.templateParams = {
                headerText: template.headerText || [],
                bodyParams: template.bodyParams || [],
                buttonParams: template.buttonParams || [],
              };

              // Check if template has media components and store the actual media URL
              let hasMedia = false;
              let mediaType = null;
              let mediaUrl = null;

              for (const comp of template.components || []) {
                if (
                  comp.type === "HEADER" &&
                  ["IMAGE", "VIDEO", "DOCUMENT"].includes(comp.format)
                ) {
                  hasMedia = true;
                  mediaType = comp.format.toLowerCase();

                  // Get the media URL from the template example
                  const originalUrl = comp.example?.header_handle?.[0];

                  // Create a proxy URL that our frontend can access
                  mediaUrl = originalUrl
                    ? `/api/template-media?url=${encodeURIComponent(
                        originalUrl
                      )}`
                    : null;

                  // Store media info in the message with the proxy URL
                  messageData[mediaType] = {
                    id: "template_media",
                    url: mediaUrl, // Store the proxy URL
                    originalUrl: originalUrl, // Keep original for reference
                    caption: comp.example?.header_text?.[0] || null,
                    filename: comp.example?.header_text?.[0] || null, // For documents
                  };
                  break;
                }
              }

              // Build full template content display
              let displayText = buildTemplateDisplayText(template);

              messageData.text = displayText;

              // Set the message type to the media type if it has media
              if (hasMedia) {
                messageData.type = mediaType;
              }
            }

            messageStore.save(messageData);
            console.log(
              `[whatsapp/send] Saved ${
                isTextMessage ? "text" : isMediaMessage ? "media" : "template"
              } message to store: ${result.messageId}`
            );
            console.log(
              `[whatsapp/send] Message data:`,
              JSON.stringify(messageData, null, 2)
            );
          } catch (storeError) {
            console.error(
              `[whatsapp/send] Failed to save to messageStore:`,
              storeError
            );
            // Don't fail the whole request if messageStore fails
          }
        }

        return result;
      })
    );

    // ── Aggregate results ──────────────────────────────────────────────────────
    const summary = rawResults.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            contactId: contacts[i].id,
            phone: contacts[i].phone,
            name: contacts[i].name,
            success: false,
            error: r.reason?.message || "Unknown error",
          }
    );

    const sent = summary.filter((r) => r.success).length;
    const failed = summary.filter((r) => !r.success).length;

    if (failed > 0) {
      console.warn(
        "[whatsapp/send] Failures:",
        summary.filter((r) => !r.success)
      );
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
