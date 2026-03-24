"use client"
import { useState } from "react";
import Contact from "@/components/Contact";
import Integrations from "@/components/Integration";

// ─── Tab Components ───────────────────────────────────────────────────────────

const Dashboard = () => (
  <div className="animate-fadeUp">
    <h2 className="text-2xl font-extrabold tracking-tight mb-6">Dashboard</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {[
        { label: "Total Users", value: "24,521", delta: "+12%", pos: true, icon: "👥" },
        { label: "Revenue", value: "$84,320", delta: "+8.4%", pos: true, icon: "💰" },
        { label: "Active Sessions", value: "1,340", delta: "+3.1%", pos: true, icon: "🟢" },
        { label: "Bounce Rate", value: "34.2%", delta: "-2.5%", pos: false, icon: "📉" },
      ].map((s) => (
        <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex gap-4 items-start hover:border-violet-500 transition-colors">
          <span className="text-2xl mt-0.5">{s.icon}</span>
          <div>
            <div className="text-xl font-black">{s.value}</div>
            <div className="text-xs text-gray-400 font-mono mt-0.5 mb-1">{s.label}</div>
            <div className={`text-xs font-semibold ${s.pos ? "text-green-400" : "text-red-400"}`}>{s.delta} this month</div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-gray-800 border border-dashed border-gray-700 rounded-xl h-44 flex items-center justify-center text-gray-500 text-sm">
      📊 Activity Chart — Coming Soon
    </div>
  </div>
);

const Users = () => (
  <div className="animate-fadeUp">
    <h2 className="text-2xl font-extrabold tracking-tight mb-6">Users</h2>
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {["Name", "Email", "Role", "Status"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-widest text-gray-400 font-mono">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Aria Noor", email: "aria@example.com", role: "Admin", status: "Active" },
            { name: "Rahul Sen", email: "rahul@example.com", role: "Editor", status: "Active" },
            { name: "Priya Mehta", email: "priya@example.com", role: "Viewer", status: "Inactive" },
            { name: "James Obi", email: "james@example.com", role: "Editor", status: "Active" },
            { name: "Sara Lin", email: "sara@example.com", role: "Admin", status: "Pending" },
          ].map((u, i, arr) => (
            <tr key={u.email} className={`hover:bg-gray-700/50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-700" : ""}`}>
              <td className="px-5 py-3 font-semibold">{u.name}</td>
              <td className="px-5 py-3 text-gray-400 font-mono text-xs">{u.email}</td>
              <td className="px-5 py-3">
                <span className="text-xs px-2.5 py-1 rounded-full border border-violet-500 text-violet-400 bg-violet-500/10 font-mono">{u.role}</span>
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-mono border ${
                  u.status === "Active" ? "border-green-500 text-green-400 bg-green-500/10" :
                  u.status === "Inactive" ? "border-red-500 text-red-400 bg-red-500/10" :
                  "border-yellow-500 text-yellow-400 bg-yellow-500/10"
                }`}>{u.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);



const Campaign = () => (
  <div className="animate-fadeUp">
    <h2 className="text-2xl font-extrabold tracking-tight mb-6">Campaign</h2>
    
  </div>
);

const Settings = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  return (
    <div className="animate-fadeUp">
      <h2 className="text-2xl font-extrabold tracking-tight mb-6">Settings</h2>
      <div className="max-w-md flex flex-col gap-5">
        {[
          { label: "Site Name", type: "text", placeholder: "My Admin App" },
          { label: "Admin Email", type: "email", placeholder: "admin@example.com" },
          { label: "Timezone", type: "text", placeholder: "UTC+5:30" },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-gray-400 font-mono">{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
            />
          </div>
        ))}

        {[
          { label: "Enable Notifications", state: notifications, toggle: () => setNotifications(!notifications) },
          { label: "Dark Mode", state: darkMode, toggle: () => setDarkMode(!darkMode) },
        ].map(({ label, state, toggle }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-gray-300">{label}</span>
            <button onClick={toggle} className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${state ? "bg-violet-500" : "bg-gray-600"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${state ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}

        <button className="self-start bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity tracking-wide">
          Save Changes
        </button>
      </div>
    </div>
  );
};

// ─── Nav Config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "▣", component: Dashboard },
  { id: "contacts",     label: "Contacts",     icon: "◎", component: Contact },
  { id: "integrations", label: "Integrations", icon: "△", component: Integrations },
  { id: "campaign",   label: "Campaign",   icon: "▤", component: Campaign },
  { id: "settings",  label: "Settings",  icon: "⊙", component: Settings },
];

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const ActiveComponent = TABS.find((t) => t.id === active)?.component || Dashboard;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">

      {/* Sidebar */}
      <aside className={`flex flex-col bg-gray-800 border-r border-gray-700 flex-shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700 min-h-16">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-base font-black">
            M
          </div>
          {!collapsed && (
            <span className="text-sm font-black tracking-widest bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent whitespace-nowrap">
              META
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md border border-gray-600 text-gray-400 hover:text-white hover:border-violet-500 transition-colors text-xs"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-xs text-gray-500 uppercase tracking-widest font-mono px-2 pb-2">Menu</p>
          )}
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              title={collapsed ? tab.label : ""}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 relative
                ${active === tab.id
                  ? "bg-gray-700 text-violet-400"
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                }`}
            >
              {active === tab.id && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-gradient-to-b from-violet-500 to-pink-500" />
              )}
              <span className="text-base w-5 text-center flex-shrink-0">{tab.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-2 py-3 border-t border-gray-700">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-black">
              AK
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold leading-tight truncate">Arjun Kumar</div>
                <div className="text-xs text-gray-400 font-mono truncate">super-admin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 flex items-center gap-3 px-7 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <span className="text-xs font-mono text-gray-400">
            admin / <span className="text-gray-200">{active}</span>
          </span>
          <div className="ml-auto flex gap-2">
            {["🔔", "⚙"].map((ic) => (
              <button key={ic} className="w-8 h-8 flex items-center justify-center bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-violet-500 transition-colors text-sm">
                {ic}
              </button>
            ))}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-8">
          <ActiveComponent key={active} />
        </main>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp { animation: fadeUp 0.25s ease both; }
      `}</style>
    </div>
  );
}