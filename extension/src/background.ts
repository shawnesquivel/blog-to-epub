// Minimal MV3 service worker. The conversion pipeline runs entirely in the
// popup; this exists so the extension has a discoverable runtime context
// (used by the e2e tests to find the extension ID).
chrome.runtime.onInstalled.addListener(() => {
  // no-op
});
