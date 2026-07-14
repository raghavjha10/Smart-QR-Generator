function StatCard({ icon: Icon, label, value, accent = "brand" }) {
  const accentClasses = {
    brand: "bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400",
    green: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="card card-hover flex items-center gap-4">
      <div className={`p-3 rounded-xl ${accentClasses[accent] || accentClasses.brand}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export default StatCard;
