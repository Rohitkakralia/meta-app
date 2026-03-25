import { useState, useEffect } from "react";
import TemplateCard from "./TemplateCard";

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/whatsapp/getTemplates");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch templates");
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-xs text-gray-500 font-mono">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="text-3xl">⚠️</div>
        <p className="text-sm text-red-400 font-semibold">Failed to load templates</p>
        <p className="text-xs text-gray-500 font-mono text-center">{error}</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="text-4xl">📭</div>
        <p className="text-sm text-gray-400">No templates found</p>
        <p className="text-xs text-gray-500">Create templates in your WhatsApp Business Manager</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">WhatsApp Templates</h3>
          <p className="text-sm text-gray-400">
            {templates.length} template{templates.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {templates.filter(t => t.status === 'APPROVED').length} approved
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={setSelectedTemplate}
            showDetails={true}
          />
        ))}
      </div>

      {selectedTemplate && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h4 className="text-sm font-bold text-white mb-2">Template Details</h4>
          <div className="space-y-2 text-xs text-gray-400">
            <div><span className="text-gray-300">Name:</span> {selectedTemplate.name}</div>
            <div><span className="text-gray-300">ID:</span> {selectedTemplate.id}</div>
            <div><span className="text-gray-300">Status:</span> {selectedTemplate.status}</div>
            <div><span className="text-gray-300">Category:</span> {selectedTemplate.category}</div>
            <div><span className="text-gray-300">Language:</span> {selectedTemplate.language}</div>
            {selectedTemplate.parameter_format && (
              <div><span className="text-gray-300">Parameter Format:</span> {selectedTemplate.parameter_format}</div>
            )}
            {selectedTemplate.sub_category && (
              <div><span className="text-gray-300">Sub Category:</span> {selectedTemplate.sub_category}</div>
            )}
            <div><span className="text-gray-300">Components:</span> {selectedTemplate.components?.length || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;