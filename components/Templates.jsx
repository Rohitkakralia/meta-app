"use client";

import { useState, useEffect } from "react";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTemplates();
  }, [filter]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("status", filter.toUpperCase());
      }
      
      const response = await fetch(`/api/whatsapp/getTemplates?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch templates");
      }
      
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "PENDING":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "REJECTED":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "MARKETING":
        return "📢";
      case "UTILITY":
        return "🔧";
      case "AUTHENTICATION":
        return "🔐";
      default:
        return "📄";
    }
  };

  const renderTemplateComponent = (component) => {
    switch (component.type) {
      case "HEADER":
        if (component.format === "TEXT") {
          return (
            <div className="template-header">
              <strong>{component.text}</strong>
            </div>
          );
        }
        break;
      case "BODY":
        return (
          <div className="template-body">
            {component.text}
          </div>
        );
      case "FOOTER":
        return (
          <div className="template-footer">
            <small>{component.text}</small>
          </div>
        );
      case "BUTTONS":
        return (
          <div className="template-buttons">
            {component.buttons?.map((button, idx) => (
              <div key={idx} className="template-button">
                {button.type === "QUICK_REPLY" && "↩️ "}
                {button.type === "URL" && "🔗 "}
                {button.type === "PHONE_NUMBER" && "📞 "}
                {button.text}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-fadeUp">
      <style>{TEMPLATE_CSS}</style>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight mb-2">Message Templates</h2>
          <p className="text-gray-400">
            Manage your approved WhatsApp Business message templates
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "approved", "pending", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            {loading ? "🔄" : "↻"} Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="template-skeleton">
                <div className="skeleton-header"></div>
                <div className="skeleton-body"></div>
                <div className="skeleton-footer"></div>
              </div>
            ))}
          </div>
        )}

        {/* Templates Grid */}
        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                {/* Template Header */}
                <div className="template-card-header">
                  <div className="flex items-center gap-3">
                    <span className="template-category-icon">
                      {getCategoryIcon(template.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="template-name">{template.name}</h3>
                      <p className="template-language">{template.language}</p>
                    </div>
                  </div>
                  <span className={`template-status ${getStatusColor(template.status)}`}>
                    {template.status}
                  </span>
                </div>

                {/* Template Preview */}
                <div className="template-preview">
                  <div className="template-phone">
                    <div className="template-screen">
                      {template.components?.map((component, idx) => (
                        <div key={idx}>
                          {renderTemplateComponent(component)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="template-info">
                  <div className="template-category">
                    Category: {template.category}
                  </div>
                  <div className="template-id">
                    ID: {template.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">No Templates Found</h3>
            <p className="text-gray-500 mb-6">
              {filter === "all" 
                ? "You don't have any message templates yet."
                : `No ${filter} templates found.`
              }
            </p>
            <button
              onClick={() => setFilter("all")}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Templates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TEMPLATE_CSS = `
  .template-card {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(75, 85, 99, 0.3);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .template-card:hover {
    border-color: rgba(34, 197, 94, 0.4);
    transform: translateY(-2px);
  }

  .template-card-header {
    padding: 20px;
    border-bottom: 1px solid rgba(75, 85, 99, 0.2);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .template-category-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .template-name {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin: 0;
    word-break: break-word;
  }

  .template-language {
    font-size: 12px;
    color: #9CA3AF;
    margin: 4px 0 0 0;
  }

  .template-status {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    border: 1px solid;
    white-space: nowrap;
  }

  .template-preview {
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
  }

  .template-phone {
    background: #1F2937;
    border-radius: 20px;
    padding: 16px;
    border: 2px solid #374151;
  }

  .template-screen {
    background: #25D366;
    border-radius: 12px;
    padding: 12px;
    color: white;
    font-size: 14px;
    line-height: 1.4;
  }

  .template-header {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .template-body {
    margin-bottom: 8px;
  }

  .template-footer {
    margin-top: 8px;
    opacity: 0.8;
  }

  .template-buttons {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .template-button {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    text-align: center;
    font-size: 13px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .template-info {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #9CA3AF;
  }

  .template-category {
    font-weight: 500;
  }

  .template-id {
    font-family: monospace;
    opacity: 0.7;
  }

  .template-skeleton {
    background: rgba(17, 24, 39, 0.8);
    border: 1px solid rgba(75, 85, 99, 0.3);
    border-radius: 16px;
    padding: 20px;
    animation: pulse 2s infinite;
  }

  .skeleton-header {
    height: 20px;
    background: rgba(75, 85, 99, 0.3);
    border-radius: 4px;
    margin-bottom: 12px;
    width: 70%;
  }

  .skeleton-body {
    height: 80px;
    background: rgba(75, 85, 99, 0.3);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .skeleton-footer {
    height: 16px;
    background: rgba(75, 85, 99, 0.3);
    border-radius: 4px;
    width: 50%;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;