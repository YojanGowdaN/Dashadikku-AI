// ═══════════════════════════════════════════════════════════════
// DASHADIKKU AI — Configuration File
// ═══════════════════════════════════════════════════════════════
//
// Edit the values below, then open main.html in your browser.
// This file is loaded automatically by main.html.
//
// ═══════════════════════════════════════════════════════════════

window.ENV = {

  // ── AI API KEYS ──────────────────────────────────────────────
  // Gemini: used for general chat and image generation
  // Get FREE at → https://aistudio.google.com/app/apikey
  GEMINI_API_KEY: "AIzaSyC2r9-bOQzwQp_y8x0sAe3KOSSsXb_pLKQ",

  // Claude (Anthropic): used for code, charts, flowcharts, plans
  // Get at → https://console.anthropic.com/
  ANTHROPIC_API_KEY: "YOUR_ANTHROPIC_API_KEY",

  // ── AI MODELS ────────────────────────────────────────────────
  GEMINI_MODEL:       "gemini-2.0-flash",
  GEMINI_IMAGE_MODEL: "gemini-2.0-flash-preview-image-generation",
  CLAUDE_MODEL:       "claude-opus-4-5",

  // ── API BASE URLS ─────────────────────────────────────────────
  GEMINI_BASE_URL:    "https://generativelanguage.googleapis.com/v1beta",
  ANTHROPIC_BASE_URL: "https://api.anthropic.com/v1",

  // ── USAGE LIMIT ───────────────────────────────────────────────
  // Number of free messages before the upgrade/payment page appears.
  // Set to 0 for unlimited (no payment wall).
  FREE_MESSAGE_LIMIT: 10,

  // ── ADS ───────────────────────────────────────────────────────
  // SHOW_ADS: show ad banners between messages (true / false)
  // AD_EVERY_N: show one ad every N assistant messages
  SHOW_ADS:   true,
  AD_EVERY_N: 3,

  // ── PAYMENT LINKS ─────────────────────────────────────────────
  // Replace with your actual Stripe / payment processor URLs.
  // These appear on the upgrade modal when the usage limit is hit.
  PAYMENT_LINKS: {
    pro:        "YOUR_PRO_PAYMENT_LINK",        // e.g. https://buy.stripe.com/...
    enterprise: "YOUR_ENTERPRISE_PAYMENT_LINK"  // e.g. https://buy.stripe.com/...
  }

};
