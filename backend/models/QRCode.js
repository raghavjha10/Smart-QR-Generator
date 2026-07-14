const mongoose = require("mongoose");

const scanEventSchema = new mongoose.Schema(
  {
    scannedAt: { type: Date, default: Date.now },
    device: { type: String, default: "Desktop" },
    browser: { type: String, default: "Other" },
    os: { type: String, default: "Other" },
    country: { type: String, default: "Unknown" },
    ip: { type: String, default: "" },
    referer: { type: String, default: "" },
  },
  { _id: false }
);

const qrCodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["url", "text", "email", "phone", "wifi", "contact"],
    },
    // Raw, structured input as entered by the user (varies by type)
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // The final string that actually gets encoded into the QR image
    // (e.g. a tracking link for "url" type, a vCard string for "contact", etc.)
    encodedData: {
      type: String,
      required: true,
    },
    // Base64 PNG data URL of the generated QR image
    qrImage: {
      type: String,
      required: true,
    },
    // Raw SVG markup of the generated QR image
    qrSvg: {
      type: String,
      required: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    scanHistory: {
      type: [scanEventSchema],
      default: [],
    },
    isTrackable: {
      type: Boolean,
      default: false,
    },
    colorDark: {
      type: String,
      default: "#000000",
    },
    colorLight: {
      type: String,
      default: "#ffffff",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QRCode", qrCodeSchema);
