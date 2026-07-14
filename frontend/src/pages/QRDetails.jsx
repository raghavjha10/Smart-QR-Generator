import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Download,
  RefreshCw,
  Trash2,
  ScanLine,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Edit,
  Save,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  fetchQRById,
  deleteQRCode,
  regenerateQRCode,
  trackManualScan,
  getPngDownloadUrl,
  getSvgDownloadUrl,
  getScanUrl,
} from "../api/api.js";
import { typeMeta } from "../components/QRCard.jsx";
import Loader from "../components/Loader.jsx";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function QRDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState({});
  const [editColorDark, setEditColorDark] = useState("#000000");
  const [editColorLight, setEditColorLight] = useState("#ffffff");

  const load = async () => {
    try {
      const { data } = await fetchQRById(id);
      setQr(data);
      setEditTitle(data.title);
      setEditContent(data.content);
      setEditColorDark(data.colorDark || "#000000");
      setEditColorLight(data.colorLight || "#ffffff");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this QR code? This can't be undone.")) return;
    setBusy(true);
    try {
      await deleteQRCode(id);
      navigate("/history");
    } catch (err) {
      alert("Failed to delete QR code.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    setBusy(true);
    try {
      const { data } = await regenerateQRCode(id, {});
      setQr(data);
    } catch (err) {
      alert("Failed to regenerate QR code.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await regenerateQRCode(id, {
        title: editTitle,
        content: editContent,
        colorDark: editColorDark,
        colorLight: editColorLight,
      });
      setQr(data);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update QR code.");
    } finally {
      setBusy(false);
    }
  };

  const handleTrackScan = async () => {
    setBusy(true);
    try {
      const { data } = await trackManualScan(id);
      setQr(data);
    } catch (err) {
      alert("Failed to log scan.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qr.encodedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleContentFieldChange = (key, value) => {
    setEditContent((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <Loader label="Loading QR code..." />;
  if (!qr) return <p className="text-slate-500 dark:text-slate-400">QR code not found.</p>;

  const meta = typeMeta[qr.type] || typeMeta.text;
  const Icon = meta.icon;

  // Process scan statistics
  const scanHistory = qr.scanHistory || [];
  
  // Scans by device type (for Pie Chart)
  const deviceCounts = {};
  scanHistory.forEach(s => {
    const dev = s.device || "Desktop";
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
  });
  const deviceChartData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

  // Scans over time (last 7 days scans history)
  const last7DaysData = [];
  const today = new Date();
  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  scanHistory.forEach(s => {
    const key = new Date(s.scannedAt).toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key] += 1;
  });
  const timeChartData = Object.entries(dayMap).map(([date, scans]) => ({
    date: date.slice(5), // show MM-DD
    scans
  })).sort((a, b) => a.date.localeCompare(b.date));

  const renderEditFields = () => {
    switch (qr.type) {
      case "url":
        return (
          <div>
            <label className="label">Website URL</label>
            <input
              className="input-field"
              value={editContent.url || ""}
              onChange={(e) => handleContentFieldChange("url", e.target.value)}
              required
            />
          </div>
        );
      case "text":
        return (
          <div>
            <label className="label">Text Content</label>
            <textarea
              className="input-field"
              rows={3}
              value={editContent.text || ""}
              onChange={(e) => handleContentFieldChange("text", e.target.value)}
              required
            />
          </div>
        );
      case "email":
        return (
          <div className="grid gap-3">
            <div>
              <label className="label">Recipient Email</label>
              <input
                className="input-field"
                type="email"
                value={editContent.to || ""}
                onChange={(e) => handleContentFieldChange("to", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Subject (optional)</label>
              <input
                className="input-field"
                value={editContent.subject || ""}
                onChange={(e) => handleContentFieldChange("subject", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Body (optional)</label>
              <textarea
                className="input-field"
                rows={2}
                value={editContent.body || ""}
                onChange={(e) => handleContentFieldChange("body", e.target.value)}
              />
            </div>
          </div>
        );
      case "phone":
        return (
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input-field"
              value={editContent.phone || ""}
              onChange={(e) => handleContentFieldChange("phone", e.target.value)}
              required
            />
          </div>
        );
      case "wifi":
        return (
          <div className="grid gap-3">
            <div>
              <label className="label">Network SSID</label>
              <input
                className="input-field"
                value={editContent.ssid || ""}
                onChange={(e) => handleContentFieldChange("ssid", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                value={editContent.password || ""}
                onChange={(e) => handleContentFieldChange("password", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Encryption</label>
              <select
                className="input-field"
                value={editContent.encryption || "WPA"}
                onChange={(e) => handleContentFieldChange("encryption", e.target.value)}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="none">None (open network)</option>
              </select>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="grid gap-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input-field"
                value={editContent.name || ""}
                onChange={(e) => handleContentFieldChange("name", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Phone</label>
                <input
                  className="input-field"
                  value={editContent.phone || ""}
                  onChange={(e) => handleContentFieldChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input-field"
                  value={editContent.email || ""}
                  onChange={(e) => handleContentFieldChange("email", e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to previous page
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Image Panel */}
        <div className="card flex flex-col items-center justify-center gap-6">
          <div className="relative p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-center pulse-glow-brand">
            <img src={qr.qrImage} alt={qr.title} className="w-52 h-52 object-contain" />
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <a href={getPngDownloadUrl(qr._id)} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> Download PNG
            </a>
            <a href={getSvgDownloadUrl(qr._id)} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> Download SVG
            </a>
          </div>
        </div>

        {/* Details or Edit Panel */}
        <div className="card flex flex-col gap-5 justify-between">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Edit QR Code Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="label">Title</label>
                <input
                  className="input-field"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              {renderEditFields()}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="label">Foreground</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editColorDark}
                      onChange={(e) => setEditColorDark(e.target.value)}
                      className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editColorDark}
                      onChange={(e) => setEditColorDark(e.target.value)}
                      className="w-20 text-xs font-mono input-field p-2 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editColorLight}
                      onChange={(e) => setEditColorLight(e.target.value)}
                      className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editColorLight}
                      onChange={(e) => setEditColorLight(e.target.value)}
                      className="w-20 text-xs font-mono input-field p-2 uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save size={16} /> Save Changes
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-lg ${meta.color}`}>
                      <Icon size={18} />
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {meta.label}
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    qr.isTrackable 
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {qr.isTrackable ? "Dynamic" : "Static"}
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
                    {qr.title}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Generated on {new Date(qr.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-900">
                  <div className="p-3 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                    <ScanLine size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-850 dark:text-slate-100 leading-none">
                      {qr.scanCount}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 mt-1">
                      total dynamic scans
                    </p>
                  </div>
                </div>

                {qr.type === "url" && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Destination Redirect URL
                    </p>
                    <div className="flex items-center gap-2 bg-brand-50/30 dark:bg-brand-950/20 rounded-xl p-3 border border-brand-100/25 dark:border-brand-900/30">
                      <p className="text-sm font-semibold text-brand-700 dark:text-brand-400 break-all flex-1">
                        {qr.content.url}
                      </p>
                      <a
                        href={qr.content.url.startsWith("http") ? qr.content.url : `https://${qr.content.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 shrink-0"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Encoded Data Content
                  </p>
                  <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-900">
                    <p className="text-xs font-mono text-slate-650 dark:text-slate-400 break-all flex-1 whitespace-pre-wrap leading-relaxed">
                      {qr.encodedData}
                    </p>
                    <button onClick={handleCopy} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0">
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  {qr.isTrackable && (
                    <a
                      href={getScanUrl(qr._id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1 mt-2.5"
                    >
                      <ExternalLink size={12} /> Live Scan tracking link
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-850 mt-auto">
                <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2">
                  <Edit size={16} /> Edit & Style
                </button>
                {!qr.isTrackable && (
                  <button onClick={handleTrackScan} disabled={busy} className="btn-secondary flex items-center gap-2">
                    <ScanLine size={16} /> Simulate Scan
                  </button>
                )}
                {qr.isTrackable && (
                  <button onClick={handleTrackScan} disabled={busy} className="btn-secondary flex items-center gap-2">
                    <ScanLine size={16} /> Simulate Hit
                  </button>
                )}
                <button onClick={handleRegenerate} disabled={busy} className="btn-secondary flex items-center gap-2">
                  <RefreshCw size={16} /> Refresh
                </button>
                <button onClick={handleDelete} disabled={busy} className="btn-danger flex items-center gap-2 ml-auto">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mini Analytics Dashboard section */}
      <div className="card">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <ScanLine size={20} className="text-brand-500 animate-pulse" /> Detailed Scan Analytics Overview
        </h2>

        {scanHistory.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            No scans recorded yet. Physical scans on Website URL redirects are logged automatically. 
            For static QR codes, click "Simulate Scan" to generate test metrics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-4 uppercase tracking-wider">
                Scans Over Last 7 Days
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeChartData}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                  <Tooltip />
                  <Area type="monotone" dataKey="scans" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-4 uppercase tracking-wider">
                Scans by Device Category
              </h3>
              {deviceChartData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No device data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {deviceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, color: "#64748b" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {!qr.isTrackable && (
        <p className="text-xs text-slate-400 dark:text-slate-550 mt-4 leading-relaxed bg-slate-100/50 dark:bg-slate-900/10 p-3.5 rounded-xl border border-slate-200/30 dark:border-slate-800/20">
          <strong>Note:</strong> this QR type encodes raw data (read offline directly by scanning apps like WiFi managers
          or contact card readers), so physical scans aren't automatically routed to our server redirect. Use "Simulate
          Scan" to log test metrics to build up your analytics profile. "Website URL" type codes are fully dynamic and trackable.
        </p>
      )}
    </div>
  );
}

export default QRDetails;
