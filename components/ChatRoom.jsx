"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import EmojiPickerButton from "./EmojiPickerButton";

const FileAttachIcon = ({
  size = 24,
  color = "currentColor",
  className = "",
  onClick,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      aria-label="Attach file"
    >
      {/* File shape */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      {/* Folded corner */}
      <polyline points="14 2 14 8 20 8" />
      {/* Upload arrow */}
      <line x1="12" y1="18" x2="12" y2="12" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  );
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Normalize a message from the conversation API into UI shape
const normalizeMessage = (msg) => ({
  id: msg.id,
  text:
    msg.text ||
    (msg.type === "text"
      ? "[Message content unavailable]"
      : getMediaLabel(msg)),
  sender: msg.direction === "outbound" ? "me" : "other",
  time: new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  status: msg.status ?? null,
  timestamp: msg.timestamp,
  type: msg.type ?? "text",
  templateName: msg.templateName ?? null,
  // Pass through media properties for template messages
  image: msg.image ?? null,
  video: msg.video ?? null,
  document: msg.document ?? null,
  audio: msg.audio ?? null,
});

// Fallback label for non-text messages (image, audio, etc.)
const getMediaLabel = (msg) => {
  // For template messages, show template name with media type
  if (msg.templateName) {
    if (msg.image) return `📷 Template: ${msg.templateName}`;
    if (msg.video) return `🎬 Template: ${msg.templateName}`;
    if (msg.document) return `📄 Template: ${msg.templateName}`;
    return `📄 Template: ${msg.templateName}`;
  }

  // For regular media messages
  if (msg.image) return "📷 Image";
  if (msg.audio) return "🎵 Audio";
  if (msg.video) return "🎬 Video";
  if (msg.document) return "📄 Document";
  if (msg.sticker) return "🪄 Sticker";
  if (msg.location) return "📍 Location";
  return "[Unsupported message]";
};

const ChatRoom = ({ contact, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const bottomRef = useRef(null);
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation from the API and merge into state
  const fetchMessages = useCallback(async () => {
    if (!contact?.phone) return;
    try {
      const res = await fetch(
        `/api/whatsapp/conversation?phone=${encodeURIComponent(contact.phone)}`
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.messages)) {
        // Debug: log raw messages to see what we're getting
        console.log("[ChatRoom] Raw messages from API:", data.messages);

        const normalized = data.messages.map(normalizeMessage);
        setMessages((prev) => {
          // Only update if something actually changed (avoid flicker)
          const prevIds = prev.map((m) => m.id + m.status).join();
          const nextIds = normalized.map((m) => m.id + m.status).join();
          return prevIds === nextIds ? prev : normalized;
        });
      }
    } catch (err) {
      console.error("[ChatRoom] fetchMessages error:", err);
    }
  }, [contact?.phone]);

  // Initial load + polling every 2 s
  useEffect(() => {
    if (!contact?.phone) return;

    setLoading(true);
    setMessages([]);

    fetchMessages().finally(() => setLoading(false));

    intervalRef.current = setInterval(() => {
      if (!isSending) fetchMessages(); // pause poll while optimistic send is in flight
    }, 2000);

    return () => clearInterval(intervalRef.current);
  }, [contact?.phone, fetchMessages]); // isSending intentionally excluded — see note below

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      setSendError("File size must be less than 16MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedMedia({
        file: e.target.result, // base64 data URL
        type: file.type,
        filename: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle emoji insertion
  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedMedia) || isSending) return;

    const messageText = input.trim();
    const tempId = `temp_${Date.now()}`;
    const isMediaMessage = !!selectedMedia;

    // Optimistic update
    const optimisticMessage = {
      id: tempId,
      text: isMediaMessage
        ? selectedMedia.caption || `${selectedMedia.type.split("/")[0]} message`
        : messageText,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",
      timestamp: Date.now(),
      type: isMediaMessage ? selectedMedia.type.split("/")[0] : "text",
    };

    // Add media to optimistic message if present
    if (isMediaMessage) {
      const mediaType = selectedMedia.type.startsWith("image/")
        ? "image"
        : selectedMedia.type.startsWith("video/")
        ? "video"
        : selectedMedia.type.startsWith("audio/")
        ? "audio"
        : "document";
      optimisticMessage[mediaType] = {
        url: selectedMedia.file,
        caption: messageText || null,
        filename: selectedMedia.filename,
      };
    }

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    setSelectedMedia(null);
    setSendError(null);
    setIsSending(true);

    try {
      const payload = {
        contacts: [
          { id: contact.id, phone: contact.phone, name: contact.name },
        ],
      };

      if (isMediaMessage) {
        payload.media = {
          file: selectedMedia.file,
          type: selectedMedia.type,
          filename: selectedMedia.filename,
          caption: messageText || null,
        };
      } else {
        payload.text = messageText;
      }

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || data.sent === 0) {
        setSendError(data.error || "Failed to send message");
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
        );
      } else {
        // Replace temp message with real one from the server after a short delay
        // (gives messageStore.save() time to persist before the next poll)
        setTimeout(fetchMessages, 500);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
        );
      }
    } catch (err) {
      setSendError("Network error. Please try again.");
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sending":
        return "⏳";
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "read":
        return "✓✓";
      case "failed":
        return "❌";
      default:
        return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sending":
        return "text-yellow-400";
      case "sent":
        return "text-gray-400";
      case "delivered":
        return "text-blue-400";
      case "read":
        return "text-green-400"; // Green for read to distinguish from delivered
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const renderMessage = (msg) => (
    <div
      key={msg.id}
      className={`flex ${
        msg.sender === "me" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words
          ${
            msg.sender === "me"
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-[#16161e] text-gray-200 rounded-bl-md"
          }`}
      >
        {/* Template badge */}
        {msg.templateName && (
          <div className="text-[10px] opacity-60 mb-2 flex items-center gap-1">
            📄 Template: <span className="font-mono">{msg.templateName}</span>
          </div>
        )}

        {/* Media Display - for both template and regular media */}
        {(msg.image ||
          msg.video ||
          msg.document ||
          msg.audio ||
          msg.sticker) && (
          <div className="mb-3">
            {/* Images */}
            {msg.image && (
              <div>
                <img
                  src={msg.image.url}
                  alt={msg.image.caption || "Image"}
                  className="max-w-full h-auto rounded-lg cursor-pointer"
                  onClick={() => window.open(msg.image.url, "_blank")}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div className="hidden text-xs text-gray-400 bg-gray-700 p-2 rounded mt-1">
                  📷 Image (Unable to load)
                </div>
                {msg.image.caption && (
                  <div className="text-xs mt-1 opacity-80">
                    {msg.image.caption}
                  </div>
                )}
              </div>
            )}

            {/* Videos */}
            {msg.video && (
              <div>
                <video
                  controls
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                >
                  <source src={msg.video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="hidden text-xs text-gray-400 bg-gray-700 p-2 rounded mt-1">
                  🎬 Video (Unable to load)
                </div>
                {msg.video.caption && (
                  <div className="text-xs mt-1 opacity-80">
                    {msg.video.caption}
                  </div>
                )}
              </div>
            )}

            {/* Audio */}
            {msg.audio && (
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎵</span>
                  <span className="text-sm">Audio Message</span>
                </div>
                <audio controls className="w-full">
                  <source src={msg.audio.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Documents */}
            {msg.document && (
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {msg.document.filename || "Document"}
                    </div>
                    <a
                      href={msg.document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Download Document
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Stickers */}
            {msg.sticker && (
              <div>
                <img
                  src={msg.sticker.url}
                  alt="Sticker"
                  className="max-w-32 h-auto rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div className="hidden text-xs text-gray-400 bg-gray-700 p-2 rounded mt-1">
                  🪄 Sticker (Unable to load)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message text content */}
        {msg.text && <div className="whitespace-pre-line">{msg.text}</div>}

        <div className="flex items-center justify-between gap-2 text-[10px] text-gray-300 mt-1">
          <span>{msg.time}</span>
          {msg.sender === "me" && msg.status && (
            <span className={getStatusColor(msg.status)}>
              {getStatusIcon(msg.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[80vh] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2a]">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#16161e] transition text-gray-400"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm text-white"
          style={{ background: "#5F27CD" }}
        >
          {getInitials(contact?.name)}
        </div>

        <div className="flex-1">
          <div className="text-sm font-semibold">{contact?.name}</div>
          <div className="text-xs text-gray-500">{contact?.phone}</div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="text-xs text-gray-500 animate-pulse">
              Loading messages…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-xs text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {sendError && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-xs text-red-300 flex justify-between">
          <span>{sendError}</span>
          <button
            onClick={() => setSendError(null)}
            className="ml-2 text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#1e1e2a]">
        {/* Media Preview */}
        {selectedMedia && (
          <div className="mb-3 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Selected Media:</span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                ✕ Remove
              </button>
            </div>
            <div className="flex items-center gap-2">
              {selectedMedia.type.startsWith("image/") && (
                <img
                  src={selectedMedia.file}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              {selectedMedia.type.startsWith("video/") && (
                <video
                  src={selectedMedia.file}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              {!selectedMedia.type.startsWith("image/") &&
                !selectedMedia.type.startsWith("video/") && (
                  <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-lg">📄</span>
                  </div>
                )}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {selectedMedia.filename}
                </div>
                <div className="text-xs text-gray-400">
                  {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No more custom emoji picker - using EmojiPickerButton component */}

        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
          {/* Media Upload Button */}
          <button
            className="text-gray-500 cursor-pointer hover:text-gray-700 p-1 rounded transition"
            title="Attach media"
          >
            <FileAttachIcon
              size={20}
              color="#4F46E5"
              onClick={() => fileInputRef.current?.click()}
            />
          </button>

          {/* Emoji Picker Button with dark theme */}
          <div className="flex items-center">
            <EmojiPickerButton onEmojiSelect={handleEmojiSelect} theme="dark" />
          </div>

          <input
            className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-500"
            placeholder={
              selectedMedia ? "Add a caption..." : "Type a message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={isSending || (!input.trim() && !selectedMedia)}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium transition text-white"
          >
            {isSending ? "…" : "Send"}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-[10px] text-gray-600 text-center mt-1">
          Polls every 2 s for new messages • Max file size: 16MB
        </p>
      </div>
    </div>
  );
};

export default ChatRoom;
