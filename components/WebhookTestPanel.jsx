"use client";
import React, { useEffect, useRef, useState } from "react";

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

// ── WEBHOOK TEST PANEL ────────────────────────────────
const WebhookTestPanel = ({ events }) => {
  const [filter, setFilter] = useState("all");
  const [openRaw, setOpenRaw] = useState({});

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  const typeStyle = {
    incoming_message: "bg-blue-900/40 text-blue-300",
    message_status:   "bg-green-900/40 text-green-300",
    template_status:  "bg-amber-900/40 text-amber-300",
  };

  return (
    <div className="flex flex-col h-full text-xs font-mono">
      {/* Filters */}
      <div className="flex gap-2 px-3 py-2 border-b border-[#1e1e2a]">
        {["all", "incoming_message", "message_status", "template_status"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 rounded-full border text-[11px] transition ${
              filter === f
                ? "bg-indigo-600 text-white border-indigo-500"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
        <span className="ml-auto text-gray-500">{events.length} events</span>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No events yet — send a message or receive a webhook
          </div>
        ) : (
          filtered.map((ev) => {
            const time = new Date(ev.receivedAt).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            });
            return (
              <div key={ev._id} className="border border-[#1e1e2a] rounded-lg overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 bg-[#0f0f17] cursor-pointer"
                  onClick={() => setOpenRaw((p) => ({ ...p, [ev._id]: !p[ev._id] }))}
                >
                  <span className={`text-[10px] px-2 py-0.5 rounded ${typeStyle[ev.type] || "bg-gray-700 text-gray-300"}`}>
                    {ev.type}
                  </span>
                  <span className="text-gray-200 font-semibold">
                    {ev.type === "incoming_message" && (ev.data.from || "unknown")}
                    {ev.type === "message_status" && ev.data.recipientId}
                    {ev.type === "template_status" && ev.data.messageTemplateName}
                  </span>
                  <span className="ml-auto text-gray-500">{time}</span>
                </div>

                {/* Summary */}
                <div className="px-3 py-2 bg-[#16161e]">
                  {ev.type === "incoming_message" && (
                    <div className="text-gray-300">
                      <span className="text-gray-500">text: </span>
                      "{ev.data.text}"
                    </div>
                  )}
                  {ev.type === "message_status" && (
                    <div className="text-gray-300">
                      <span className="text-gray-500">status: </span>
                      <span className="text-green-400">{ev.data.status}</span>
                      <span className="text-gray-500 ml-3">msg_id: </span>
                      {ev.data.messageId}
                    </div>
                  )}
                  {ev.type === "template_status" && (
                    <div className="text-gray-300">
                      <span className="text-amber-400">{ev.data.previousStatus}</span>
                      <span className="text-gray-500"> → </span>
                      <span className="text-green-400">{ev.data.newStatus}</span>
                      {ev.data.reason && (
                        <span className="text-red-400 ml-3">reason: {ev.data.reason}</span>
                      )}
                    </div>
                  )}

                  {/* Toggle raw JSON */}
                  <button
                    onClick={() => setOpenRaw((p) => ({ ...p, [ev._id]: !p[ev._id] }))}
                    className="text-indigo-400 hover:text-indigo-300 mt-1 text-[11px]"
                  >
                    {openRaw[ev._id] ? "▲ hide" : "▼ raw payload"}
                  </button>

                  {openRaw[ev._id] && (
                    <pre className="mt-2 p-2 bg-[#0a0a12] rounded text-[11px] text-gray-400 overflow-x-auto max-h-48 border border-[#1e1e2a]">
                      {JSON.stringify(ev.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ── MAIN CHATROOM ─────────────────────────────────────
const ChatRoom = ({ contact, onBack }) => {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [loading, setLoading]           = useState(true);
  const [apiConfig, setApiConfig]       = useState(null);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const [webhookEvents, setWebhookEvents]       = useState([]);
  const webhookEventId = useRef(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper — push a new event into the test panel
  const pushWebhookEvent = (type, data) => {
    setWebhookEvents((prev) => [
      { _id: ++webhookEventId.current, type, data, receivedAt: Date.now() },
      ...prev,
    ]);
  };

  useEffect(() => {
    const checkApiConfig = async () => {
      try {
        const res = await fetch("/api/config/status");
        const result = await res.json();
        setApiConfig(result.config);
      } catch {}
    };
    checkApiConfig();
  }, []);

  useEffect(() => {
    if (contact?.phone) {
      loadConversation();
      setConnectionStatus("connected");
    }
  }, [contact]);

  const loadConversation = async () => {
    if (!contact?.phone) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/messages/conversation?phone=${encodeURIComponent(contact.phone)}`
      );
      const result = await res.json();
      if (result.success && result.data.messages) {
        setMessages(formatMessages(result.data.messages));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
    setLoading(false);
  };

  const formatMessages = (msgs) =>
    msgs.map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      time: new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit",
      }),
      status: msg.status,
      timestamp: msg.timestamp,
      type: msg.type || "text",
      templateName: msg.templateName,
      templateLanguage: msg.templateLanguage,
    }));

  // Poll for new messages every 2 s
  useEffect(() => {
    if (!contact?.phone) return;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/messages/conversation?phone=${encodeURIComponent(contact.phone)}`
        );
        const result = await res.json();
        if (result.success && result.data.messages) {
          const formatted = formatMessages(result.data.messages);
          setMessages((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(formatted)) {
              // Detect newly arrived messages (sender === "other")
              const prevIds = new Set(prev.map((m) => m.id));
              formatted
                .filter((m) => m.sender === "other" && !prevIds.has(m.id))
                .forEach((m) =>
                  pushWebhookEvent("incoming_message", {
                    id: m.id,
                    from: contact.phone,
                    text: m.text,
                    type: m.type,
                    timestamp: m.timestamp,
                  })
                );
              return formatted;
            }
            return prev;
          });
        }
      } catch {
        setConnectionStatus("error");
      }
    };
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [contact]);

  const sendMessage = async () => {
    if (!input.trim() || !contact?.phone) return;
    const messageText = input.trim();
    const tempId = `temp_${Date.now()}`;

    const newMessage = {
      id: tempId,
      text: messageText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sending",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.phone.replace(/\D/g, ""),
          message: messageText,
          type: "text",
        }),
      });
      const result = await res.json();

      if (result.success) {
        const finalStatus = result.data?.development ? "sent (dev)" : "sent";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, id: result.messageId, status: finalStatus } : msg
          )
        );
        // Show sent status in webhook panel
        pushWebhookEvent("message_status", {
          messageId: result.messageId,
          recipientId: contact.phone,
          status: finalStatus,
          timestamp: Date.now(),
        });

        await fetch("/api/messages/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: contact.phone,
            message: {
              id: result.messageId,
              text: messageText,
              sender: "me",
              timestamp: Date.now(),
              status: finalStatus,
            },
          }),
        });
      } else {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" } : msg))
        );
        pushWebhookEvent("message_status", {
          messageId: tempId,
          recipientId: contact.phone,
          status: "failed",
          timestamp: Date.now(),
          error: result.error,
        });
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" } : msg))
      );
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sending":   return "⏳";
      case "sent":      return "✓";
      case "sent (dev)": return "🧪";
      case "delivered": return "✓✓";
      case "read":      return "✓✓";
      case "failed":    return "❌";
      default:          return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sending":   return "text-yellow-400";
      case "sent":      return "text-gray-400";
      case "sent (dev)": return "text-purple-400";
      case "delivered": return "text-blue-400";
      case "read":      return "text-blue-400";
      case "failed":    return "text-red-400";
      default:          return "text-gray-400";
    }
  };

  const renderMessage = (msg) => {
    const isTemplate = msg.type === "template" || msg.text?.startsWith("📄 Template:");
    return (
      <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
            msg.sender === "me"
              ? isTemplate
                ? "bg-green-600 text-white rounded-br-md border border-green-500/30"
                : "bg-indigo-600 text-white rounded-br-md"
              : "bg-[#16161e] text-gray-200 rounded-bl-md"
          }`}
        >
          {isTemplate && msg.templateName && (
            <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
              <span>📄</span>
              <span>Template: {msg.templateName}</span>
              {msg.templateLanguage && (
                <span className="text-xs opacity-60">({msg.templateLanguage})</span>
              )}
            </div>
          )}
          <div className={isTemplate ? "whitespace-pre-line" : ""}>{msg.text}</div>
          <div className="flex items-center justify-between text-[10px] text-gray-300 mt-1">
            <span>{msg.time}</span>
            {msg.sender === "me" && msg.status && (
              <span className={`ml-2 ${getStatusColor(msg.status)}`}>
                {getMessageStatusIcon(msg.status)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[80vh] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#16161e] transition text-gray-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm text-white" style={{ background: "#5F27CD" }}>
          {getInitials(contact?.name)}
        </div>

        <div className="flex-1">
          <div className="text-sm font-semibold">{contact?.name}</div>
          <div className="text-xs text-gray-500">{contact?.phone}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-xs text-gray-400">{connectionStatus === "connected" ? "Live" : "Offline"}</span>
          {apiConfig?.developmentMode && <span className="text-xs text-purple-400 ml-2">🧪 Dev</span>}

          {/* Webhook panel toggle */}
          <button
            onClick={() => setShowWebhookPanel((p) => !p)}
            className={`ml-2 text-xs px-2 py-1 rounded border transition ${
              showWebhookPanel
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            🪝 {webhookEvents.length > 0 ? `Webhook (${webhookEvents.length})` : "Webhook"}
          </button>
        </div>
      </div>

      {apiConfig?.developmentMode && (
        <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-700">
          <div className="text-xs text-purple-300 flex items-center gap-2">
            <span>🧪</span>
            Development Mode: Messages are simulated (not actually sent via WhatsApp)
          </div>
        </div>
      )}

      {/* Split view: chat + webhook panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className={`flex flex-col overflow-hidden transition-all ${showWebhookPanel ? "w-1/2 border-r border-[#1e1e2a]" : "w-full"}`}>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400 text-sm">Loading conversation...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div className="text-gray-400">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="text-sm">Start a conversation</div>
                </div>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-[#1e1e2a]">
            <div className="flex items-center gap-2 bg-[#fff] rounded-xl px-3 py-2">
              <input
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-500"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg text-sm font-medium transition"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Webhook v24.0 • Real-time messaging & template status updates
            </div>
          </div>
        </div>

        {/* Webhook test panel */}
        {showWebhookPanel && (
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-[#1e1e2a] flex items-center justify-between bg-[#0f0f17]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Webhook Events</span>
              <button onClick={() => setWebhookEvents([])} className="text-xs text-gray-500 hover:text-gray-300">clear</button>
            </div>
            <WebhookTestPanel events={webhookEvents} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;