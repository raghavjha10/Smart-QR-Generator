import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, ScanLine, TrendingUp, PlusCircle } from "lucide-react";
import { fetchAnalytics, fetchQRCodes } from "../api/api.js";
import StatCard from "../components/StatCard.jsx";
import QRCard, { typeMeta } from "../components/QRCard.jsx";
import Loader from "../components/Loader.jsx";

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentCodes, setRecentCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, codesRes] = await Promise.all([
          fetchAnalytics(),
          fetchQRCodes({ sort: "newest" }),
        ]);
        setAnalytics(analyticsRes.data);
        setRecentCodes(codesRes.data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;

  const topType = analytics?.typeBreakdown?.sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and management of your QR ecosystem.
          </p>
        </div>
        <Link to="/create" className="btn-primary flex items-center justify-center gap-2 shrink-0">
          <PlusCircle size={18} /> New QR Code
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={QrCode} label="Total QR Codes" value={analytics?.totalQRCodes ?? 0} accent="brand" />
        <StatCard icon={ScanLine} label="Total Scans" value={analytics?.totalScans ?? 0} accent="green" />
        <StatCard
          icon={TrendingUp}
          label="Most Used Type"
          value={topType ? `${typeMeta[topType.type]?.label || topType.type} (${topType.count})` : "—"}
          accent="purple"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Recently Generated
          </h2>
          <Link to="/history" className="text-sm text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
            View all history
          </Link>
        </div>

        {recentCodes.length === 0 ? (
          <div className="card text-center py-16 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800">
            <QrCode className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
            <p className="text-slate-500 dark:text-slate-400 mb-4">No QR codes generated yet.</p>
            <Link to="/create" className="btn-secondary inline-flex items-center gap-2">
              <PlusCircle size={16} /> Create your first QR
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {recentCodes.map((qr) => (
              <QRCard key={qr._id} qr={qr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
