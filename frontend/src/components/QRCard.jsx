import { Link } from "react-router-dom";
import { Globe, FileText, Mail, Phone, Wifi, User, ScanLine } from "lucide-react";

export const typeMeta = {
  url: { label: "Website URL", icon: Globe, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
  text: { label: "Plain Text", icon: FileText, color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  email: { label: "Email", icon: Mail, color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
  phone: { label: "Phone Number", icon: Phone, color: "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" },
  wifi: { label: "WiFi Credentials", icon: Wifi, color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
  contact: { label: "Contact Card", icon: User, color: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400" },
};

function QRCard({ qr }) {
  const meta = typeMeta[qr.type] || typeMeta.text;
  const Icon = meta.icon;

  return (
    <Link
      to={`/qr/${qr._id}`}
      className="card card-hover flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`p-2 rounded-lg ${meta.color} transition-all duration-300 group-hover:scale-110`}>
            <Icon size={16} />
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{meta.label}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <ScanLine size={14} /> {qr.scanCount}
        </span>
      </div>

      <div className="relative p-2 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800">
        <img
          src={qr.qrImage}
          alt={qr.title}
          className="w-24 h-24 object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div>
        <p className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {qr.title}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(qr.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}

export default QRCard;
