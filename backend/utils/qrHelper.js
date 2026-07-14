const QRCode = require("qrcode");

/**
 * Builds the raw string that should be encoded into the QR code,
 * based on the QR type and the structured content the user submitted.
 *
 * For "url" type codes we DON'T encode the destination URL directly.
 * Instead the caller wraps it in a trackable /api/scan/:id link so that
 * real-world scans can be counted before redirecting the user onward.
 * Other types (wifi, contact, phone, email, text) are encoded as raw
 * data because scanning apps (camera apps, wifi managers) read those
 * formats directly rather than following a browser redirect.
 */
function buildEncodedContent(type, content) {
  switch (type) {
    case "url": {
      let url = (content.url || "").trim();
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return url;
    }

    case "text": {
      return content.text || "";
    }

    case "email": {
      const { to = "", subject = "", body = "" } = content;
      const params = new URLSearchParams();
      if (subject) params.append("subject", subject);
      if (body) params.append("body", body);
      const query = params.toString();
      return `mailto:${to}${query ? `?${query}` : ""}`;
    }

    case "phone": {
      return `tel:${(content.phone || "").trim()}`;
    }

    case "wifi": {
      const { ssid = "", password = "", encryption = "WPA", hidden = false } = content;
      const enc = encryption === "none" ? "nopass" : encryption;
      // Escape special characters per the WIFI: QR spec
      const esc = (s) => String(s).replace(/([\\;,:"])/g, "\\$1");
      return `WIFI:T:${enc};S:${esc(ssid)};P:${enc === "nopass" ? "" : esc(password)};H:${hidden ? "true" : "false"};;`;
    }

    case "contact": {
      const {
        name = "",
        phone = "",
        email = "",
        organization = "",
        title: jobTitle = "",
      } = content;
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${name}`,
        organization ? `ORG:${organization}` : null,
        jobTitle ? `TITLE:${jobTitle}` : null,
        phone ? `TEL;TYPE=CELL:${phone}` : null,
        email ? `EMAIL:${email}` : null,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    }

    default:
      throw new Error(`Unsupported QR type: ${type}`);
  }
}

/**
 * Generates both a PNG data URL and raw SVG markup for the given text.
 */
async function generateQRImages(text, colorDark = "#000000", colorLight = "#ffffff") {
  const qrImage = await QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: {
      dark: colorDark,
      light: colorLight,
    },
  });

  const qrSvg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: colorDark,
      light: colorLight,
    },
  });

  return { qrImage, qrSvg };
}

module.exports = { buildEncodedContent, generateQRImages };
