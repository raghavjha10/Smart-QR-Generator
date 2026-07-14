import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ScanLine } from "lucide-react";
import { fetchQRCodes } from "../api/api.js";
import { typeMeta } from "../components/QRCard.jsx";
import Loader from "../components/Loader.jsx";

function History() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await fetchQRCodes({ search, type, sort });
      setCodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, sort]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">History</h1>
        <p className="text-slate-500 dark:text-slate-400">Browse, search, and filter all generated QR codes.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            className="input-field pl-10"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field sm:w-48" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(typeMeta).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </select>
        <select className="input-field sm:w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="mostScanned">Most scanned</option>
          <option value="leastScanned">Least scanned</option>
        </select>
      </div>

      {loading ? (
        <Loader label="Loading history..." />
      ) : codes.length === 0 ? (
        <div className="card text-center py-12 text-slate-400 dark:text-slate-500">
          No QR codes match your filters.
        </div>
      ) : (
        <div className="card overflow-x-auto p-0 border border-slate-200/50 dark:border-slate-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="py-3.5 px-4 font-semibold">QR</th>
                <th className="py-3.5 px-4 font-semibold">Title</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Scans</th>
                <th className="py-3.5 px-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((qr) => {
                const meta = typeMeta[qr.type] || typeMeta.text;
                const Icon = meta.icon;
                return (
                  <tr key={qr._id} className="border-b border-slate-100/50 dark:border-slate-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/qr/${qr._id}`} className="block w-10 h-10 p-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg overflow-hidden">
                        <img src={qr.qrImage} alt={qr.title} className="w-full h-full object-contain" />
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/qr/${qr._id}`} className="font-bold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                        {qr.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${meta.color}`}>
                        <Icon size={12} /> {meta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                        <ScanLine size={14} className="text-slate-400" /> {qr.scanCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 dark:text-slate-500">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
