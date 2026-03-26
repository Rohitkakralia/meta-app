"use client";
import React, { useEffect, useState } from "react";
import { useContactAPI } from "../app/hooks/contactInfoAPIs";
import ChatRoom from "./ChatRoom";

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

const avatarColors = [
  "#FF6B6B", "#FF9F43", "#48DBFB", "#1DD1A1", "#F368E0",
  "#00D2D3", "#5F27CD", "#EE5A24", "#009432", "#0652DD",
];

const getColor = (name) => {
  if (!name) return avatarColors[0];
  const i = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[i];
};

const Inbox = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { fetchContacts } = useContactAPI();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    const result = await fetchContacts();
    const list = Array.isArray(result)
      ? result
      : result?.data ?? result?.contacts ?? [];
    setContacts(list);
    setLoading(false);
  };

  const filtered = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  // If a contact is selected, show ChatRoom instead
  if (selectedContact) {
    return (
      <ChatRoom
        contact={selectedContact}
        onBack={() => setSelectedContact(null)}
      />
    );
  }

  return (
    <div className="min-h-screen text-white font-sans">

      {/* Header */}
      <div className=" top-0 z-10 px-5 pt-5">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-xs text-gray-500 mb-4">{contacts.length} contacts</p>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white text-black border border-[#1e1e2a] rounded-xl px-3 py-2 mb-2">
          <svg className="text-gray-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="bg-transparent outline-none text-sm w-full placeholder-gray-600"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-5 flex flex-col gap-3 mt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-[#16161e] rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#16161e] rounded w-2/3" />
                <div className="h-3 bg-[#16161e] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-2">💬</div>
          <h3 className="text-sm font-semibold text-gray-400">No contacts found</h3>
          <p className="text-xs text-gray-600">
            {search ? "Try a different search" : "Add your first contact to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-600 px-5 py-2">
            All Contacts
          </div>
          <div className="px-2">
            {filtered.map((contact, i) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-[#16161e]"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold relative"
                  style={{ background: getColor(contact.name) }}
                >
                  {getInitials(contact.name)}
                  {i < 3 && (
                    <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-400 border-2 border-[#0a0a0f] rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-100 truncate">{contact.name}</div>
                  <div className="text-xs text-gray-500 truncate">{contact.phone}</div>
                </div>

                {/* Badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
                    ${contact.source === "import"
                      ? "bg-green-900 text-green-400 border border-green-800"
                      : "bg-[#1a1a2e] text-indigo-400 border border-[#2a2a4a]"
                    }`}
                >
                  {contact.source ?? "manual"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Inbox;