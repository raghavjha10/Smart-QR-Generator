function Loader({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{label}</p>
    </div>
  );
}

export default Loader;
