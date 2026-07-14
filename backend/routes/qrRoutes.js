const express = require("express");
const router = express.Router();
const {
  createQR,
  getAllQR,
  getQRById,
  regenerateQR,
  deleteQR,
  downloadPNG,
  downloadSVG,
  trackManualScan,
  getAnalytics,
} = require("../controllers/qrController");

router.get("/analytics", getAnalytics);

router.post("/qrcodes", createQR);
router.get("/qrcodes", getAllQR);
router.get("/qrcodes/:id", getQRById);
router.put("/qrcodes/:id/regenerate", regenerateQR);
router.delete("/qrcodes/:id", deleteQR);
router.get("/qrcodes/:id/download/png", downloadPNG);
router.get("/qrcodes/:id/download/svg", downloadSVG);
router.post("/qrcodes/:id/track", trackManualScan);

module.exports = router;
