import { useState, useRef, useEffect } from "react";
import { useContactAPI } from "@/app/hooks/contactInfoAPIs";
import TemplateModal from "./TemplateModal";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const INITIAL = [];

const SOURCES = [
  "manual",
  "whatsapp",
  "facebook",
  "instagram",
  "telegram",
  "csv",
];

const SOURCE_META = {
  whatsapp: {
    label: "WhatsApp",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-400",
    icon: "💬",
  },
  facebook: {
    label: "Facebook",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-400",
    icon: "📘",
  },
  instagram: {
    label: "Instagram",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    dot: "bg-pink-400",
    icon: "📸",
  },
  telegram: {
    label: "Telegram",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    dot: "bg-sky-400",
    icon: "✈️",
  },
  manual: {
    label: "Manual",
    color: "text-gray-400 bg-gray-500/10 border-gray-500/30",
    dot: "bg-gray-400",
    icon: "✏️",
  },
  csv: {
    label: "CSV",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-400",
    icon: "📄",
  },
};

const AVATAR_GRADS = [
  "from-violet-500 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-600",
  "from-sky-400 to-cyan-600",
  "from-fuchsia-500 to-purple-600",
];

const avatarGrad = (id) => AVATAR_GRADS[id % AVATAR_GRADS.length];
const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const emptyForm = () => ({ name: "", phone: "", source: "manual" });

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border animate-slideUp
    ${
      type === "success"
        ? "bg-emerald-950 border-emerald-600/50 text-emerald-300"
        : "bg-red-950 border-red-600/50 text-red-300"
    }`}
  >
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
        type === "success" ? "bg-emerald-500" : "bg-red-500"
      } text-white`}
    >
      {type === "success" ? "✓" : "✕"}
    </span>
    {msg}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, children }) => (
  <div
    className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-scaleIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h3 className="font-bold text-base text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Contact Form ─────────────────────────────────────────────────────────────
const ContactForm = ({
  initial = emptyForm(),
  onSave,
  onCancel,
  submitLabel = "Add Contact",
  isEdit = false,
}) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const {
    addContactManually,
    updateContact: updateContactAPI,
    loading,
  } = useContactAPI();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\+?[\d\s\-()]{7,}$/.test(form.phone))
      e.phone = "Invalid phone number";
    return e;
  };

  const set = (k) => (ev) => {
    setForm({ ...form, [k]: ev.target.value });
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);

    console.log("Submitted form:", form);

    // Use different API call based on whether it's edit or add
    const resp = isEdit
      ? await updateContactAPI(initial.id, form)
      : await addContactManually(form);

    console.log("API response:", resp);

    if (resp && !resp.error) {
      onSave(form); // only proceed on success
    } else if (resp && resp.error && resp.fieldErrors) {
      // Handle field-specific errors (like duplicate phone)
      setErrors(resp.fieldErrors);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {[
        { label: "Full Name *", id: "name", type: "text", ph: "e.g. Jane Doe" },
        {
          label: "Phone Number *",
          id: "phone",
          type: "tel",
          ph: "+91 98765 43210",
        },
      ].map(({ label, id, type, ph }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-mono">
            {label}
          </label>
          <input
            value={form[id]}
            onChange={set(id)}
            placeholder={ph}
            type={type}
            className={`bg-gray-800 border rounded-xl px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-600
              ${id === "phone" ? "font-mono" : ""}
              ${
                errors[id]
                  ? "border-red-500"
                  : "border-gray-700 focus:border-violet-500"
              }`}
          />
          {errors[id] && (
            <span className="text-xs text-red-400">{errors[id]}</span>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
};

// ─── Import CSV ───────────────────────────────────────────────────────────────
const ImportPanel = ({ onImport, onCancel }) => {
  const fileRef = useRef();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [dragging, setDrag] = useState(false);
  const { importContacts, loading } = useContactAPI();

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(Boolean);
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    if (!headers.includes("name") || !headers.includes("phone")) {
      setError("CSV must have at least 'name' and 'phone' columns.");
      setRows([]);
      return;
    }
    const parsed = lines
      .slice(1)
      .map((line, i) => {
        const vals = line.split(",").map((v) => v.trim());
        const obj = {};
        headers.forEach((h, idx) => (obj[h] = vals[idx] || ""));
        return {
          name: obj.name,
          phone: obj.phone,
          source: SOURCES.includes(obj.source) ? obj.source : "csv",
        };
      })
      .filter((r) => r.name && r.phone);
    setError("");
    setRows(parsed);
  };

  const readFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target.result);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const result = await importContacts(rows);
    if (result) {
      onImport(result.data || []); // Pass the imported data back
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          readFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none
          ${
            dragging
              ? "border-violet-400 bg-violet-500/10"
              : "border-gray-700 hover:border-violet-500/50 hover:bg-gray-800/40"
          }`}
      >
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm font-semibold text-gray-300">
          Drop CSV here or{" "}
          <span className="text-violet-400 underline underline-offset-2">
            browse
          </span>
        </p>
        <p className="text-xs text-gray-500 mt-1.5 font-mono">
          Columns: name, phone &nbsp;·&nbsp; Optional: source
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => readFile(e.target.files[0])}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-gray-700 overflow-hidden">
          <div className="bg-gray-800/80 px-4 py-2 text-xs font-mono border-b border-gray-700 flex justify-between">
            <span className="text-gray-400">Preview</span>
            <span className="text-violet-400">
              {rows.length} contacts found
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto divide-y divide-gray-800/60">
            {rows.map((r, idx) => {
              const sm = SOURCE_META[r.source] || SOURCE_META.csv;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/40"
                >
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGrad(
                      idx
                    )} flex items-center justify-center text-xs font-bold flex-shrink-0`}
                  >
                    {initials(r.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {r.name}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {r.phone}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${sm.color}`}
                  >
                    {sm.icon} {sm.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={rows.length === 0 || loading}
          onClick={handleImport}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading
            ? "Importing..."
            : `Import ${rows.length > 0 ? `${rows.length} Contacts` : ""}`}
        </button>
      </div>
    </div>
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────
const DeleteConfirm = ({ contact, onConfirm, onCancel, loading = false }) => (
  <div className="flex flex-col gap-5">
    <div className="flex items-center gap-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700">
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGrad(
          contact.id
        )} flex items-center justify-center text-sm font-black flex-shrink-0`}
      >
        {contact.avatar}
      </div>
      <div>
        <div className="font-bold text-sm">{contact.name}</div>
        <div className="text-xs text-gray-400 font-mono">{contact.phone}</div>
      </div>
    </div>
    <p className="text-sm text-gray-400 text-center">
      This action{" "}
      <span className="text-red-400 font-semibold">cannot be undone</span>.
    </p>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        disabled={loading}
        className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContactManager() {
  const [contacts, setContacts] = useState([]);
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSrc, setFilterSrc] = useState("All");
  const [toast, setToast] = useState(null);
  const [selIds, setSelIds] = useState(new Set());
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const {
    fetchContacts,
    addContactManually,
    updateContact: updateContactAPI,
    deleteContact: deleteContactAPI,
    deleteContacts: deleteContactsAPI,
    loading,
  } = useContactAPI();

  // Load contacts from database on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const result = await fetchContacts();
    if (result && result.data) {
      // Transform database contacts to match component format
      const transformedContacts = result.data.map((contact) => ({
        ...contact,
        avatar: initials(contact.name),
        created_at: contact.created_at || today(),
        updated_at: contact.updated_at || today(),
      }));
      setContacts(transformedContacts);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const closeModal = () => {
    setModal(null);
    setTarget(null);
  };

  const addContact = async (form) => {
    const result = await addContactManually(form);
    if (result) {
      await loadContacts(); // Refresh from database
      closeModal();
      showToast(`${form.name} added`);
    }
  };
  const importContacts = async (importedData) => {
    // The importedData is now the actual API response with imported contacts
    const transformedContacts = importedData.map((contact) => ({
      ...contact,
      avatar: initials(contact.name),
      created_at: contact.created_at || today(),
      updated_at: contact.updated_at || today(),
    }));

    // Refresh the entire contact list from database to ensure consistency
    await loadContacts();
    closeModal();

    // Show appropriate message based on results
    if (transformedContacts.length > 0) {
      showToast(`${transformedContacts.length} contacts imported successfully`);
    } else {
      showToast("No new contacts imported - all were duplicates", "error");
    }
  };
  const updateContact = async (form) => {
    const result = await updateContactAPI(target.id, form);
    if (result) {
      await loadContacts(); // Refresh from database
      closeModal();
      showToast(`${form.name} updated`);
    }
  };
  const deleteContact = async () => {
    const result = await deleteContactAPI(target.id);
    if (result) {
      await loadContacts(); // Refresh from database
      setSelIds((p) => {
        const n = new Set(p);
        n.delete(target.id);
        return n;
      });
      closeModal();
      showToast(`${target.name} deleted`, "error");
    }
  };
  const deleteBulk = async () => {
    const idsArray = Array.from(selIds);
    const result = await deleteContactsAPI(idsArray);
    if (result) {
      await loadContacts(); // Refresh from database
      showToast(`${selIds.size} contacts deleted`, "error");
      setSelIds(new Set());
    }
  };

  const handleSendMessage = async (template) => {
    // Get the full contact objects for selected IDs
    const selectedContacts = contacts.filter((c) => selIds.has(c.id));
    
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contacts: selectedContacts.map((c) => ({
          id: c.id,
          phone: c.phone,
          name: c.name,
        })),
        template: {
          name: template.name,
          language: template.language, // e.g. "en_US"
          components: template.components, // Pass the complete components data
          parameter_format: template.parameter_format, // Pass parameter format
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to send messages", "error");
      return;
    }

    const { sent, failed, total } = data;
    setShowTemplateModal(false);

    if (failed === 0) {
      showToast(
        `✓ Sent "${template.name}" to ${sent} contact${sent !== 1 ? "s" : ""}`,
        "success"
      );
    } else if (sent === 0) {
      showToast(`Failed to send to all ${total} contacts`, "error");
    } else {
      showToast(
        `Sent to ${sent}, failed for ${failed} contact${
          failed !== 1 ? "s" : ""
        }`,
        "error"
      );
    }
  };

  const toggleSel = (id) =>
    setSelIds((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allSel = (list) =>
    list.length > 0 && list.every((c) => selIds.has(c.id));
  const toggleAll = (list) =>
    setSelIds(allSel(list) ? new Set() : new Set(list.map((c) => c.id)));

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.source.includes(q)) &&
      (filterSrc === "All" || c.source === filterSrc)
    );
  });

  const srcCounts = SOURCES.reduce((acc, s) => {
    acc[s] = contacts.filter((c) => c.source === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-gray-100 p-5">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{font-family:'Plus Jakarta Sans',sans-serif}
        .font-mono{font-family:'JetBrains Mono',monospace!important}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn {from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes slideUp {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadeUp {animation:fadeUp .18s ease both}
        .animate-scaleIn{animation:scaleIn .2s ease both}
        .animate-slideUp{animation:slideUp .25s ease both}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:4px}
      `}</style>

      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Contacts</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {contacts.length} total · {filtered.length} shown
              {selIds.size > 0 && (
                <span className="text-violet-400">
                  {" "}
                  · {selIds.size} selected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selIds.size > 0 && (
              <>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-600/40 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💬 {`Send Message (${selIds.size})`}
                </button>
                <button
                  onClick={deleteBulk}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-600/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🗑 {loading ? "Deleting..." : `Delete (${selIds.size})`}
                </button>
              </>
            )}

            <button
              onClick={() => setModal("import")}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⬆ Import CSV
            </button>
            <button
              onClick={() => setModal("add")}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Contact
            </button>
          </div>
        </div>

        {/* ── Stat Pills ── */}
        <div className="flex gap-2 flex-wrap">
          {SOURCES.filter((s) => srcCounts[s] > 0).map((s) => {
            const m = SOURCE_META[s];
            return (
              <div
                key={s}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold ${m.color}`}
              >
                {m.icon} {m.label}{" "}
                <span className="opacity-70 font-mono">({srcCounts[s]})</span>
              </div>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or source…"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-100 outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...SOURCES].map((s) => {
              const m = SOURCE_META[s];
              const active = filterSrc === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterSrc(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                    ${
                      active
                        ? s === "All"
                          ? "bg-gray-700 border-gray-500 text-white"
                          : m.color
                        : "border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300"
                    }`}
                >
                  {s !== "All" && <span className="mr-1">{m.icon}</span>}
                  {s === "All" ? "All" : m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800 bg-gray-900">
                <tr>
                  {/* Checkbox All */}
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allSel(filtered)}
                      onChange={() => toggleAll(filtered)}
                      className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                    />
                  </th>
                  {[
                    { label: "#", cls: "w-12" },
                    { label: "Contact", cls: "min-w-[180px]" },
                    { label: "Phone", cls: "min-w-[160px]" },
                    { label: "Source", cls: "min-w-[130px]" },
                    { label: "Created At", cls: "min-w-[130px]" },
                    { label: "Updated At", cls: "min-w-[130px]" },
                    { label: "Actions", cls: "text-right pr-5 min-w-[120px]" },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-gray-500 font-mono whitespace-nowrap ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4">👤</div>
                        <p className="text-sm font-semibold text-gray-400">
                          No contacts found
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Try adjusting your search or add a new contact
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => {
                    const sm = SOURCE_META[c.source] || SOURCE_META.manual;
                    const checked = selIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`group transition-colors ${
                          checked
                            ? "bg-violet-500/5 border-l-2 border-l-violet-500"
                            : "hover:bg-gray-800/30"
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSel(c.id)}
                            className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                          />
                        </td>

                        {/* Row # */}
                        <td className="px-4 py-3.5 text-xs text-gray-600 font-mono select-none">
                          {String(idx + 1).padStart(2, "0")}
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGrad(
                                c.id
                              )} flex items-center justify-center text-xs font-black flex-shrink-0 shadow`}
                            >
                              {c.avatar || initials(c.name)}
                            </div>
                            <span className="font-semibold text-sm text-gray-100 whitespace-nowrap">
                              {c.name}
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-mono text-gray-300 whitespace-nowrap tracking-wide">
                            {c.phone}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${sm.color}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sm.dot}`}
                            />
                            {sm.label}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                            {fmtDate(c.created_at)}
                          </span>
                        </td>

                        {/* Updated */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-xs font-mono whitespace-nowrap ${
                              c.updated_at !== c.created_at
                                ? "text-amber-400/80"
                                : "text-gray-500"
                            }`}
                          >
                            {fmtDate(c.updated_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setTarget(c);
                                setModal("edit");
                              }}
                              disabled={loading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/30 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✎ Edit
                            </button>
                            <button
                              onClick={() => {
                                setTarget(c);
                                setModal("delete");
                              }}
                              disabled={loading}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              🗑 Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-600 font-mono">
                Showing <span className="text-gray-400">{filtered.length}</span>{" "}
                of <span className="text-gray-400">{contacts.length}</span>{" "}
                contacts
              </span>
              <div className="flex gap-2 flex-wrap">
                {SOURCES.filter((s) => srcCounts[s] > 0).map((s) => (
                  <span
                    key={s}
                    className={`text-xs px-2 py-0.5 rounded-full border font-mono ${SOURCE_META[s].color}`}
                  >
                    {SOURCE_META[s].icon} {srcCounts[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "add" && (
        <Modal
          title="Add New Contact"
          subtitle="Enter the contact details below"
          onClose={closeModal}
        >
          <ContactForm
            onSave={addContact}
            onCancel={closeModal}
            submitLabel="Add Contact"
          />
        </Modal>
      )}
      {modal === "edit" && target && (
        <Modal
          title="Edit Contact"
          subtitle={`Editing ${target.name}`}
          onClose={closeModal}
        >
          <ContactForm
            initial={{
              id: target.id,
              name: target.name,
              phone: target.phone,
              source: target.source,
            }}
            onSave={updateContact}
            onCancel={closeModal}
            submitLabel="Save Changes"
            isEdit={true}
          />
        </Modal>
      )}
      {modal === "import" && (
        <Modal
          title="Import from CSV"
          subtitle="Bulk import contacts via a CSV file"
          onClose={closeModal}
        >
          <ImportPanel onImport={importContacts} onCancel={closeModal} />
        </Modal>
      )}
      {modal === "delete" && target && (
        <Modal
          title="Delete Contact"
          subtitle="Are you sure? This cannot be undone."
          onClose={closeModal}
        >
          <DeleteConfirm
            contact={target}
            onConfirm={deleteContact}
            onCancel={closeModal}
            loading={loading}
          />
        </Modal>
      )}
      {showTemplateModal && (
        <TemplateModal
          selectedCount={selIds.size}
          onClose={() => setShowTemplateModal(false)}
          onSend={handleSendMessage}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
