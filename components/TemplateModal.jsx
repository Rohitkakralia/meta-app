import { useState, useEffect } from "react";

const TemplateModal = ({ selectedCount, onClose, onSend }) => {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await fetch("/api/whatsapp/getTemplates");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch templates");
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const STATUS_META = {
    APPROVED: {
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    PENDING: {
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      dot: "bg-amber-400",
    },
    REJECTED: {
      color: "text-red-400 bg-red-500/10 border-red-500/30",
      dot: "bg-red-400",
    },
  };

  const CATEGORY_META = {
    MARKETING: { icon: "📢", color: "text-pink-400" },
    UTILITY: { icon: "⚙️", color: "text-sky-400" },
    AUTHENTICATION: { icon: "🔐", color: "text-violet-400" },
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    await onSend(selected);
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-xl mx-4 shadow-2xl animate-scaleIn flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              💬 Send WhatsApp Message
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {selectedCount} contact{selectedCount !== 1 ? "s" : ""} selected ·
              Choose a template below
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadingTemplates ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-xs text-gray-500 font-mono">
                Fetching templates…
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="text-3xl">⚠️</div>
              <p className="text-sm text-red-400 font-semibold">
                Failed to load templates
              </p>
              <p className="text-xs text-gray-500 font-mono text-center">
                {error}
              </p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="text-4xl">📭</div>
              <p className="text-sm text-gray-400">
                No approved templates found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {templates.map((t) => {
                const statusM = STATUS_META[t.status] || STATUS_META.PENDING;
                const catM = CATEGORY_META[t.category] || {
                  icon: "📄",
                  color: "text-gray-400",
                };
                const isSelected = selected?.id === t.id;
                const bodyComp = t.components?.find((c) => c.type === "BODY");
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-emerald-500/60 bg-emerald-500/8 ring-1 ring-emerald-500/30"
                        : "border-gray-700/60 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Radio indicator */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-400"
                              : "border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-100 font-mono tracking-tight">
                              {t.name}
                            </span>
                            <span
                              className={`text-xs font-semibold ${catM.color}`}
                            >
                              {catM.icon} {t.category}
                            </span>
                          </div>
                          {bodyComp?.text && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {bodyComp.text}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusM.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusM.dot}`}
                          />
                          {t.status}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                          {t.language}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selected || sending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending…
              </>
            ) : (
              <>
                💬 Send to {selectedCount} Contact
                {selectedCount !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
