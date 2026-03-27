"use client";
import React, { useEffect, useRef, useState } from "react";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ChatRoom = ({ contact, onBack }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello 👋", sender: "other", time: "10:00 AM" },
    { id: 2, text: "Hi! How are you?", sender: "me", time: "10:01 AM" },
  ]);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const messageText = input.trim();
    const tempId = Date.now();

    // Optimistic update
    const newMessage = {
      id: tempId,
      text: messageText,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setSendError(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Wrap the single contact in an array to match the API's expected shape
          contacts: [
            {
              id: contact.id,
              phone: contact.phone,
              name: contact.name,
            },
          ],
          // Plain text messages don't use a template — send a text type instead
          message: {
            type: "text",
            text: messageText,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || "Failed to send message");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg
          )
        );
        return;
      }

      const { sent, failed } = data;

      if (sent > 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "sent" } : msg
          )
        );
      } else {
        setSendError(failed > 0 ? "Message failed to deliver" : "Unknown error");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg
          )
        );
      }
    } catch (err) {
      setSendError("Network error. Please try again.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" } : msg
        )
      );
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sending":   return "⏳";
      case "sent":      return "✓";
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
      case "delivered": return "text-blue-400";
      case "read":      return "text-blue-400";
      case "failed":    return "text-red-400";
      default:          return "text-gray-400";
    }
  };

  const renderMessage = (msg) => (
    <div
      key={msg.id}
      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm
          ${
            msg.sender === "me"
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-[#16161e] text-gray-200 rounded-bl-md"
          }`}
      >
        {msg.text}
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

  return (
    <div className="flex flex-col h-[80vh] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(renderMessage)}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {sendError && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-700 text-xs text-red-300">
          {sendError}
        </div>
      )}

      {/* Input */}
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
      </div>
    </div>
  );
};

export default ChatRoom;