import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, FileText, Mail, Phone, Wifi, User, Loader2 } from "lucide-react";
import { createQRCode } from "../api/api.js";

const typeOptions = [
  { value: "url", label: "Website URL", icon: Globe },
  { value: "contact", label: "Contact Card", icon: User },
  { value: "wifi", label: "WiFi Credentials", icon: Wifi },
  { value: "text", label: "Plain Text", icon: FileText },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone Number", icon: Phone },
];

const initialFieldState = {
  url: { url: "" },
  text: { text: "" },
  email: { to: "", subject: "", body: "" },
  phone: { phone: "" },
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  contact: { name: "", phone: "", email: "", organization: "", title: "" },
};

function CreateQR() {
  const navigate = useNavigate();
  const [type, setType] = useState("url");
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState(initialFieldState);
  const [colorDark, setColorDark] = useState("#000000");
  const [colorLight, setColorLight] = useState("#ffffff");
  const [isTrackable, setIsTrackable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const presets = [
    { name: "Classic Black", dark: "#000000", light: "#ffffff" },
    { name: "Midnight Indigo", dark: "#4f46e5", light: "#ffffff" },
    { name: "Ocean Blue", dark: "#0284c7", light: "#ffffff" },
    { name: "Forest Emerald", dark: "#059669", light: "#ffffff" },
    { name: "Deep Crimson", dark: "#dc2626", light: "#ffffff" },
  ];

  const updateField = (key, value) => {
    setFields((prev) => ({ ...prev, [type]: { ...prev[type], [key]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please give your QR code a title.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await createQRCode({
        title,
        type,
        content: fields[type],
        colorDark,
        colorLight,
        isTrackable: type === "url" ? isTrackable : false,
      });
      navigate(`/qr/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong generating the QR code.");
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (type) {
      case "url":
        return (
          <div className="space-y-4">
            <div>
              <label className="label">Website URL</label>
              <input
                className="input-field"
                placeholder="https://example.com"
                value={fields.url.url}
                onChange={(e) => updateField("url", e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <input
                id="isTrackable"
                type="checkbox"
                checked={isTrackable}
                onChange={(e) => setIsTrackable(e.target.checked)}
                className="mt-1 rounded dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <label htmlFor="isTrackable" className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                  Enable Scan Tracking & Dynamic Updates (Dynamic QR)
                </label>
                <span className="text-xs text-slate-550 dark:text-slate-450 block mt-0.5">
                  If unchecked, your phone will show the direct website link immediately when scanning, but analytics tracking will be disabled.
                </span>
              </div>
            </div>
          </div>
        );

      case "text":
        return (
          <div>
            <label className="label">Text Content</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Any plain text you want to encode..."
              value={fields.text.text}
              onChange={(e) => updateField("text", e.target.value)}
              required
            />
          </div>
        );

      case "email":
        return (
          <div className="grid gap-4">
            <div>
              <label className="label">Recipient Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="someone@example.com"
                value={fields.email.to}
                onChange={(e) => updateField("to", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Subject (optional)</label>
              <input
                className="input-field"
                placeholder="Subject line"
                value={fields.email.subject}
                onChange={(e) => updateField("subject", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Body (optional)</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Message body"
                value={fields.email.body}
                onChange={(e) => updateField("body", e.target.value)}
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
              placeholder="+1 555 123 4567"
              value={fields.phone.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required
            />
          </div>
        );

      case "wifi":
        return (
          <div className="grid gap-4">
            <div>
              <label className="label">Network Name (SSID)</label>
              <input
                className="input-field"
                placeholder="My WiFi Network"
                value={fields.wifi.ssid}
                onChange={(e) => updateField("ssid", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="text"
                placeholder="WiFi password"
                value={fields.wifi.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Encryption</label>
                <select
                  className="input-field"
                  value={fields.wifi.encryption}
                  onChange={(e) => updateField("encryption", e.target.value)}
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="none">None (open network)</option>
                </select>
              </div>
              <div className="flex items-end pb-2 gap-2">
                <input
                  id="hidden"
                  type="checkbox"
                  checked={fields.wifi.hidden}
                  onChange={(e) => updateField("hidden", e.target.checked)}
                  className="rounded dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="hidden" className="text-sm font-medium text-slate-650 dark:text-slate-400">
                  Hidden network
                </label>
              </div>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="grid gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input-field"
                placeholder="Jane Doe"
                value={fields.contact.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input
                  className="input-field"
                  placeholder="+1 555 123 4567"
                  value={fields.contact.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="jane@example.com"
                  value={fields.contact.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Organization</label>
                <input
                  className="input-field"
                  placeholder="Company Inc."
                  value={fields.contact.organization}
                  onChange={(e) => updateField("organization", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Job Title</label>
                <input
                  className="input-field"
                  placeholder="Product Manager"
                  value={fields.contact.title}
                  onChange={(e) => updateField("title", e.target.value)}
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">Create QR Code</h1>
        <p className="text-slate-500 dark:text-slate-400">Choose a type and customize style and details to generate your QR code.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">QR Code Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeOptions.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setType(value)}
                className={`flex flex-col items-center gap-2 border rounded-xl py-3 px-2 text-sm font-semibold transition-all ${
                  type === value
                    ? "border-brand-500 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 scale-[1.02] shadow-sm shadow-brand-500/10"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 hover:border-slate-350 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input
            className="input-field"
            placeholder="e.g. Restaurant Menu, Booth WiFi..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {renderFields()}

        {/* QR Styling Selection */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6">
          <label className="label">Visual Styling</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">Presets</label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => {
                        setColorDark(p.dark);
                        setColorLight(p.light);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">Foreground</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorDark}
                      onChange={(e) => setColorDark(e.target.value)}
                      className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colorDark}
                      onChange={(e) => setColorDark(e.target.value)}
                      className="w-24 text-xs font-mono input-field py-2.5 px-3 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorLight}
                      onChange={(e) => setColorLight(e.target.value)}
                      className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colorLight}
                      onChange={(e) => setColorLight(e.target.value)}
                      className="w-24 text-xs font-mono input-field py-2.5 px-3 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Preview */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs font-bold text-slate-450 dark:text-slate-550 block mb-3 uppercase tracking-wider">Color Preview</span>
              <div 
                style={{ backgroundColor: colorLight }} 
                className="w-32 h-32 rounded-xl flex items-center justify-center p-3 shadow-inner transition-all duration-300"
              >
                {/* Dummy visual representation of QR code pattern */}
                <div style={{ color: colorDark }} className="w-full h-full opacity-80 grid grid-cols-5 gap-1.5">
                  {[...Array(25)].map((_, i) => {
                    const isFinder = (i < 3 || i === 5 || i === 10 || i === 20 || i === 21 || i === 22 || i === 4 || i === 9 || i === 14 || i === 24);
                    const randFill = Math.random() > 0.4;
                    return (
                      <div 
                        key={i} 
                        style={{ backgroundColor: (isFinder || randFill) ? colorDark : "transparent" }}
                        className={`rounded-sm transition-all duration-300 ${isFinder ? "border border-current scale-[1.05]" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-red-650 dark:text-red-400">{error}</p>}

        <button type="submit" className="btn-primary flex items-center gap-2 w-full sm:w-auto" disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
      </form>

      {/* Info Panel Dynamic vs Static */}
      <div className="bg-brand-50/50 dark:bg-slate-900/20 border border-brand-100/50 dark:border-slate-800/80 rounded-2xl p-5 text-sm text-slate-650 dark:text-slate-400 space-y-3 shadow-sm shadow-slate-100/5 dark:shadow-none">
        <h3 className="font-bold text-brand-700 dark:text-brand-400 flex items-center gap-1.5">
          Dynamic vs Static QR Codes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 bg-white/40 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block mb-1">Dynamic (Website URL)</span>
            <p className="text-xs">
              Points to a trackable redirect. You can update the target URL at any time without changing the printed QR image, and track detailed scan statistics.
            </p>
          </div>
          <div className="space-y-1 bg-white/40 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200/20 dark:border-slate-800/40">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block mb-1">Static (SSID, Text, Cards)</span>
            <p className="text-xs">
              Encodes raw data directly. Can be scanned offline (like connecting to Wi-Fi) but updating the contents requires generating a completely new QR image.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateQR;
