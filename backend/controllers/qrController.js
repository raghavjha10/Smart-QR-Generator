const QRCodeModel = require("../models/QRCode");
const { buildEncodedContent, generateQRImages } = require("../utils/qrHelper");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// Helper to parse User Agent headers into device, browser, and OS
function parseRequestMetadata(req) {
  const ua = req.headers["user-agent"] || "";
  let device = "Desktop";
  let browser = "Other";
  let os = "Other";

  // Device detection
  if (/mobile/i.test(ua)) {
    device = "Mobile";
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = "Tablet";
  }

  // OS detection
  if (/android/i.test(ua)) {
    os = "Android";
    device = "Mobile";
  } else if (/ipad|iphone|ipod/i.test(ua)) {
    os = "iOS";
    device = "Mobile";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // Browser detection
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = "Chrome";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/edge|edg/i.test(ua)) {
    browser = "Edge";
  } else if (/opr|opera/i.test(ua)) {
    browser = "Opera";
  }

  // Geolocation country mock based on Accept-Language header
  let country = "United States";
  const lang = req.headers["accept-language"] || "";
  if (lang.includes("in") || lang.includes("IN")) {
    country = "India";
  } else if (lang.includes("gb") || lang.includes("GB") || lang.includes("uk") || lang.includes("UK")) {
    country = "United Kingdom";
  } else if (lang.includes("de") || lang.includes("DE")) {
    country = "Germany";
  } else if (lang.includes("ca") || lang.includes("CA")) {
    country = "Canada";
  } else if (lang.includes("fr") || lang.includes("FR")) {
    country = "France";
  } else if (lang.includes("au") || lang.includes("AU")) {
    country = "Australia";
  } else {
    const countries = ["United States", "India", "United Kingdom", "Germany", "Canada", "Australia", "Singapore"];
    country = countries[Math.floor(Math.random() * countries.length)];
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const referer = req.headers["referer"] || "";

  return { device, browser, os, country, ip, referer };
}

// @desc  Create a new QR code
// @route POST /api/qrcodes
const createQR = async (req, res) => {
  try {
    const { title, type, content, colorDark, colorLight } = req.body;

    if (!title || !type || !content) {
      return res.status(400).json({ message: "title, type and content are required" });
    }

    const isTrackable = type === "url" && req.body.isTrackable !== false;
    const rawEncoded = buildEncodedContent(type, content);

    // Create the document first (without images) so we have an _id to
    // build the trackable scan link, then generate images and save again.
    const doc = new QRCodeModel({
      title,
      type,
      content,
      encodedData: rawEncoded,
      qrImage: "pending",
      qrSvg: "pending",
      isTrackable,
      colorDark: colorDark || "#000000",
      colorLight: colorLight || "#ffffff",
    });
    await doc.save();

    const finalEncoded = isTrackable ? `${BASE_URL}/api/scan/${doc._id}` : rawEncoded;
    const { qrImage, qrSvg } = await generateQRImages(finalEncoded, doc.colorDark, doc.colorLight);

    doc.encodedData = finalEncoded;
    doc.qrImage = qrImage;
    doc.qrSvg = qrSvg;
    await doc.save();

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: "Failed to create QR code", error: error.message });
  }
};

// @desc  Get all QR codes (supports ?search=&type=&sort=)
// @route GET /api/qrcodes
const getAllQR = async (req, res) => {
  try {
    const { search, type, sort } = req.query;
    const filter = {};

    if (type && type !== "all") filter.type = type;
    if (search) filter.title = { $regex: search, $options: "i" };

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "mostScanned") sortOption = { scanCount: -1 };
    if (sort === "leastScanned") sortOption = { scanCount: 1 };

    const codes = await QRCodeModel.find(filter).sort(sortOption);
    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch QR codes", error: error.message });
  }
};

// @desc  Get single QR code by id
// @route GET /api/qrcodes/:id
const getQRById = async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR code not found" });
    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch QR code", error: error.message });
  }
};

// @desc  Regenerate/Update a QR code's content or styling
// @route PUT /api/qrcodes/:id/regenerate
const regenerateQR = async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR code not found" });

    const { title, content, colorDark, colorLight } = req.body;
    if (title !== undefined) qr.title = title;
    if (content !== undefined) qr.content = content;
    if (colorDark !== undefined) qr.colorDark = colorDark;
    if (colorLight !== undefined) qr.colorLight = colorLight;

    const rawEncoded = buildEncodedContent(qr.type, qr.content);
    const finalEncoded = qr.isTrackable ? `${BASE_URL}/api/scan/${qr._id}` : rawEncoded;

    const { qrImage, qrSvg } = await generateQRImages(finalEncoded, qr.colorDark, qr.colorLight);
    qr.encodedData = finalEncoded;
    qr.qrImage = qrImage;
    qr.qrSvg = qrSvg;

    await qr.save();
    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: "Failed to regenerate QR code", error: error.message });
  }
};

// @desc  Delete a QR code
// @route DELETE /api/qrcodes/:id
const deleteQR = async (req, res) => {
  try {
    const qr = await QRCodeModel.findByIdAndDelete(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR code not found" });
    res.json({ message: "QR code deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete QR code", error: error.message });
  }
};

// @desc  Download QR as PNG
// @route GET /api/qrcodes/:id/download/png
const downloadPNG = async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR code not found" });

    const base64Data = qr.qrImage.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${qr.title.replace(/\s+/g, "_")}.png"`,
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Failed to download PNG", error: error.message });
  }
};

// @desc  Download QR as SVG
// @route GET /api/qrcodes/:id/download/svg
const downloadSVG = async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR code not found" });

    res.set({
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${qr.title.replace(/\s+/g, "_")}.svg"`,
    });
    res.send(qr.qrSvg);
  } catch (error) {
    res.status(500).json({ message: "Failed to download SVG", error: error.message });
  }
};

// @desc  Real scan endpoint. Trackable ("url" type) QR codes point their
//        physical QR image at this route. Every hit increments the scan
//        counter, then the visitor is redirected to the real destination.
// @route GET /api/scan/:id
const scanQR = async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id);
    if (!qr) return res.status(404).send("QR code not found");

    const meta = parseRequestMetadata(req);

    qr.scanCount += 1;
    qr.scanHistory.push(meta);
    await qr.save();

    if (qr.type === "url") {
      return res.redirect(qr.content.url.startsWith("http") ? qr.content.url : `https://${qr.content.url}`);
    }

    res.send(`<h2>${qr.title}</h2><p>${qr.encodedData}</p>`);
  } catch (error) {
    res.status(500).json({ message: "Failed to process scan", error: error.message });
  }
};

// @desc  Manually log a test scan for non-trackable QR types (wifi, contact,
//        text, email, phone) since those encode raw data and can't be routed
//        through our redirect endpoint. Useful for demoing analytics.
// @route POST /api/qrcodes/:id/track
const trackManualScan = async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id);
    if (!qr) return res.status(404).json({ message: "QR code not found" });

    // Mock realistic user metadata
    const devices = ["Mobile", "Mobile", "Mobile", "Desktop", "Tablet"];
    const browsers = ["Chrome", "Chrome", "Safari", "Firefox", "Edge", "Opera"];
    const osList = ["iOS", "Android", "Android", "Windows", "macOS", "Linux"];
    const countries = ["United States", "India", "United Kingdom", "Germany", "Canada", "Australia", "Singapore", "Japan", "Brazil"];

    const mockMeta = {
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: osList[Math.floor(Math.random() * osList.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      referer: Math.random() > 0.5 ? "https://google.com" : "https://facebook.com",
      scannedAt: new Date(Date.now() - Math.floor(Math.random() * 24 * 3600 * 1000 * Math.random() * 14)) // spread over last 14 days
    };

    qr.scanCount += 1;
    qr.scanHistory.push(mockMeta);
    await qr.save();

    res.json(qr);
  } catch (error) {
    res.status(500).json({ message: "Failed to log scan", error: error.message });
  }
};

// @desc  Aggregate analytics data for dashboard & analytics page
// @route GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const { qrId, range } = req.query;

    let filter = {};
    if (qrId && qrId !== "all") {
      filter._id = qrId;
    }

    const allCodes = await QRCodeModel.find(filter);
    const totalQRCodes = await QRCodeModel.countDocuments();
    
    let totalScans = 0;
    const typeMap = {};
    const deviceMap = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const browserMap = {};
    const osMap = {};
    const countryMap = {};
    const hourMap = {};
    for (let h = 0; h < 24; h++) {
      hourMap[h] = 0;
    }

    // Determine date range filter
    const now = new Date();
    let startDate = null;
    let daysToInclude = 14; // default
    if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      daysToInclude = 7;
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      daysToInclude = 30;
    } else if (range === "all") {
      startDate = null; // include all
    }

    // Pre-populate day map for the scansOverTime chart
    const dayMap = {};
    if (range === "all") {
      // Find oldest scan or default to last 14 days
      let oldestScanDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      allCodes.forEach(qr => {
        qr.scanHistory.forEach(event => {
          if (event.scannedAt && new Date(event.scannedAt) < oldestScanDate) {
            oldestScanDate = new Date(event.scannedAt);
          }
        });
      });
      const diffTime = Math.abs(now - oldestScanDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysToInclude = Math.min(diffDays || 14, 60);
      startDate = new Date(now.getTime() - daysToInclude * 24 * 60 * 60 * 1000);
    }

    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }

    allCodes.forEach((qr) => {
      typeMap[qr.type] = (typeMap[qr.type] || 0) + 1;

      qr.scanHistory.forEach((event) => {
        const scanDate = new Date(event.scannedAt);
        // Apply date range filter
        if (startDate && scanDate < startDate) return;

        totalScans += 1;

        // Date key
        const dateKey = scanDate.toISOString().slice(0, 10);
        if (dateKey in dayMap) {
          dayMap[dateKey] += 1;
        } else if (range === "all") {
          dayMap[dateKey] = 1;
        }

        // Device
        const dev = event.device || "Desktop";
        deviceMap[dev] = (deviceMap[dev] || 0) + 1;

        // Browser
        const brow = event.browser || "Other";
        browserMap[brow] = (browserMap[brow] || 0) + 1;

        // OS
        const osSys = event.os || "Other";
        osMap[osSys] = (osMap[osSys] || 0) + 1;

        // Country
        const ctry = event.country || "Unknown";
        countryMap[ctry] = (countryMap[ctry] || 0) + 1;

        // Hour
        const hr = scanDate.getHours();
        hourMap[hr] = (hourMap[hr] || 0) + 1;
      });
    });

    const typeBreakdown = Object.entries(typeMap).map(([type, count]) => ({ type, count }));
    const scansOverTime = Object.entries(dayMap).map(([date, scans]) => ({ date, scans })).sort((a, b) => a.date.localeCompare(b.date));
    const deviceBreakdown = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));
    const browserBreakdown = Object.entries(browserMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const osBreakdown = Object.entries(osMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const countryBreakdown = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const hourlyBreakdown = Object.entries(hourMap).map(([hour, value]) => ({ hour: `${hour}:00`, value }));

    const topScanned = await QRCodeModel.find()
      .sort({ scanCount: -1 })
      .limit(5)
      .select("title type scanCount");

    const recentCodes = await QRCodeModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title type scanCount createdAt");

    res.json({
      totalQRCodes,
      totalScans,
      typeBreakdown,
      topScanned,
      recentCodes,
      scansOverTime,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      countryBreakdown,
      hourlyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};

module.exports = {
  createQR,
  getAllQR,
  getQRById,
  regenerateQR,
  deleteQR,
  downloadPNG,
  downloadSVG,
  scanQR,
  trackManualScan,
  getAnalytics,
};
