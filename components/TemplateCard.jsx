import { useState } from "react";

const TemplateCard = ({ template, isSelected = false, onSelect, showDetails = true }) => {
  const [imageError, setImageError] = useState(false);

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

  const PARAMETER_FORMAT_META = {
    POSITIONAL: { icon: "📍", color: "text-blue-400", label: "Positional" },
    NAMED: { icon: "🏷️", color: "text-purple-400", label: "Named" },
  };

  const renderComponentPreview = (component) => {
    switch (component.type) {
      case "HEADER":
        if (component.format === "IMAGE" && component.example?.header_handle?.[0] && !imageError) {
          return (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-cyan-400">📋 Header Image</span>
              </div>
              <img
                src={component.example.header_handle[0]}
                alt="Template header"
                className="w-full max-w-48 h-24 object-cover rounded-lg border border-gray-700"
                onError={() => setImageError(true)}
              />
            </div>
          );
        }
        if (component.format === "VIDEO" && component.example?.header_handle?.[0]) {
          return (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-cyan-400">📋 Header Video</span>
              </div>
              <video
                src={component.example.header_handle[0]}
                className="w-full max-w-48 h-24 object-cover rounded-lg border border-gray-700"
                controls={false}
                muted
              />
            </div>
          );
        }
        if (component.text) {
          return (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-cyan-400">📋 Header</span>
              </div>
              <p className="text-xs text-gray-300 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                {component.text}
              </p>
            </div>
          );
        }
        break;
      case "FOOTER":
        return (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-gray-400">📄 Footer</span>
            </div>
            <p className="text-xs text-gray-400 italic">
              {component.text}
            </p>
          </div>
        );
      case "BUTTONS":
        return (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-orange-400">🔘 Buttons</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {component.buttons?.map((btn, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300"
                >
                  {btn.text}
                </span>
              ))}
            </div>
          </div>
        );
    }
    return null;
  };

  const statusM = STATUS_META[template.status] || STATUS_META.PENDING;
  const catM = CATEGORY_META[template.category] || {
    icon: "📄",
    color: "text-gray-400",
  };
  const paramFormatM = PARAMETER_FORMAT_META[template.parameter_format] || null;
  
  const bodyComp = template.components?.find((c) => c.type === "BODY");
  const headerComp = template.components?.find((c) => c.type === "HEADER");
  const footerComp = template.components?.find((c) => c.type === "FOOTER");
  const buttonsComp = template.components?.find((c) => c.type === "BUTTONS");

  return (
    <div
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-emerald-500/60 bg-emerald-500/8 ring-1 ring-emerald-500/30"
          : "border-gray-700/60 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/60"
      }`}
      onClick={() => onSelect?.(template)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Radio indicator */}
          {onSelect && (
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
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-100 font-mono tracking-tight">
                {template.name}
              </span>
              <span className={`text-xs font-semibold ${catM.color}`}>
                {catM.icon} {template.category}
              </span>
              {paramFormatM && (
                <span
                  className={`text-xs font-medium ${paramFormatM.color} bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700`}
                >
                  {paramFormatM.icon} {paramFormatM.label}
                </span>
              )}
            </div>
            
            {showDetails && (
              <>
                {/* Component previews */}
                {headerComp && renderComponentPreview(headerComp)}
                
                {bodyComp?.text && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-green-400">📝 Body</span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed bg-gray-800/30 px-2 py-1.5 rounded border border-gray-700/50">
                      {bodyComp.text}
                    </p>
                  </div>
                )}
                
                {footerComp && renderComponentPreview(footerComp)}
                {buttonsComp && renderComponentPreview(buttonsComp)}
                
                {/* Additional template info */}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700/50">
                  <span className="text-xs text-gray-500 font-mono">
                    ID: {template.id}
                  </span>
                  {template.sub_category && (
                    <span className="text-xs text-gray-500">
                      {template.sub_category}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusM.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusM.dot}`} />
            {template.status}
          </span>
          <span className="text-xs text-gray-600 font-mono">
            {template.language}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;