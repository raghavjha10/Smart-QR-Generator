import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { QrCode, ScanLine, TrendingUp, Calendar, Filter } from "lucide-react";
import { fetchAnalytics, fetchQRCodes } from "../api/api.js";
import StatCard from "../components/StatCard.jsx";
import Loader from "../components/Loader.jsx";
import { typeMeta } from "../components/QRCard.jsx";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9", "#ef4444"];

function Analytics() {
  const [qrCodes, setQrCodes] = useState([]);
  const [selectedQrId, setSelectedQrId] = useState("all");
  const [selectedRange, setSelectedRange] = useState("30d");
  const [data, setData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Load initial dropdown list of QR codes
  useEffect(() => {
    const loadDropdown = async () => {
      try {
        const { data } = await fetchQRCodes();
        setQrCodes(data);
      } catch (err) {
        console.error("Failed to load QR codes list", err);
      }
    };
    loadDropdown();
  }, []);

  // Load analytics when filters change
  useEffect(() => {
    const loadAnalytics = async () => {
      setFilterLoading(true);
      try {
        const { data } = await fetchAnalytics({
          qrId: selectedQrId,
          range: selectedRange,
        });
        setData(data);
      } catch (err) {
        console.error("Failed to load analytics metrics", err);
      } finally {
        setLoading(false);
        setFilterLoading(false);
      }
    };
    loadAnalytics();
  }, [selectedQrId, selectedRange]);

  if (loading) return <Loader label="Crunching analytics metrics..." />;
  if (!data) return <p className="text-slate-500 dark:text-slate-400">No analytics data available.</p>;

  const pieData = (data.typeBreakdown || []).map((t) => ({
    name: typeMeta[t.type]?.label || t.type,
    value: t.count,
  }));

  const avgScans = data.totalQRCodes ? (data.totalScans / data.totalQRCodes).toFixed(1) : 0;

  // Process scans over time for display
  const scansOverTimeData = (data.scansOverTime || []).map((s) => ({
    ...s,
    displayDate: s.date.slice(5), // MM-DD format
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Deep dive performance tracking for your QR codes.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 px-2.5 text-slate-400 dark:text-slate-500">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
          </div>

          <select
            value={selectedQrId}
            onChange={(e) => setSelectedQrId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-xs font-medium"
          >
            <option value="all">All QR Codes</option>
            {qrCodes.map((qr) => (
              <option key={qr._id} value={qr._id}>
                {qr.title} ({qr.type})
              </option>
            ))}
          </select>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Date range picker */}
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
            {["7d", "30d", "all"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  selectedRange === r
                    ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filterLoading && (
        <div className="text-center py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 animate-pulse">
          Refreshing dashboard metrics...
        </div>
      )}

      {/* Stats summary panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={QrCode} label="Filtered QR Codes" value={selectedQrId === "all" ? data.totalQRCodes : 1} accent="brand" />
        <StatCard icon={ScanLine} label="Total Scans" value={data.totalScans} accent="green" />
        <StatCard icon={TrendingUp} label="Avg. Scans / Code" value={selectedQrId === "all" ? avgScans : data.totalScans} accent="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scans over time Area chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
            <Calendar size={18} className="text-brand-500" /> Scans Trend Over Time
          </h2>
          {scansOverTimeData.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center">No scan data recorded.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={scansOverTimeData}>
                <defs>
                  <linearGradient id="colorScansBig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/40" vertical={false} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" className="dark:stroke-slate-800" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" className="dark:stroke-slate-800" />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                <Area type="monotone" dataKey="scans" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScansBig)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* QR type breakdown (only if viewing All QR Codes) */}
        {selectedQrId === "all" && (
          <div className="card">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Distribution by QR Type</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 py-16 text-center">No codes available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} label>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Scans by Device category */}
        <div className={`card ${selectedQrId !== "all" ? "lg:col-span-1" : ""}`}>
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Scans by Device</h2>
          {data.deviceBreakdown.every(d => d.value === 0) ? (
            <p className="text-sm text-slate-400 py-16 text-center">No device scan metrics logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.deviceBreakdown.filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {data.deviceBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={["#6366f1", "#10b981", "#f59e0b"][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scans by Browser category */}
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Top Browsers</h2>
          {data.browserBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center">No browser metrics.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.browserBreakdown} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/40" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scans by OS */}
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Operating Systems</h2>
          {data.osBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center">No OS metrics.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.osBreakdown} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/40" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scans by time of day (Hourly peak scan times) */}
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Hourly Scanning Traffic</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.hourlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800/40" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} stroke="#cbd5e1" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top countries list card */}
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Top Countries (Scan Distribution)</h2>
          {data.countryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center">No geo-location scans logged.</p>
          ) : (
            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
              {data.countryBreakdown.map((item, index) => {
                const percentage = data.totalScans ? ((item.value / data.totalScans) * 100).toFixed(0) : 0;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-2">
                        <span className="w-5 text-right font-mono text-slate-400">#{index + 1}</span>
                        {item.name}
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {item.value} scans ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-150 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 
                            ? "bg-brand-500" 
                            : index === 1 
                            ? "bg-emerald-500" 
                            : "bg-slate-400 dark:bg-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
