require("dotenv").config();
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("Custom DNS servers setup skipped, using system default resolvers:", err.message);
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const qrRoutes = require("./routes/qrRoutes");
const { scanQR } = require("./controllers/qrController");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Smart QR Generator API is running" });
});

// Public scan/redirect endpoint (what a physical trackable QR points to)
app.get("/api/scan/:id", scanQR);

// Main API routes
app.use("/api", qrRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
