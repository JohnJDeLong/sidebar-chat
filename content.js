// content.js

function getPageText(maxChars = 12000) {
  const text = (document.body?.innerText || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.slice(0, maxChars);
}

function sendContext() {
  const payload = {
    type: "TAB_CONTEXT",
    title: document.title,
    url: location.href,
    text: getPageText(12000),
    ts: Date.now(),
  };

  chrome.runtime.sendMessage(payload).catch(() => {
    // ignore if extension isn't ready
  });
}

// Send once after load
sendContext();

// Also send when content changes (simple + safe throttling)
let t = null;
const observer = new MutationObserver(() => {
  clearTimeout(t);
  t = setTimeout(sendContext, 800);
});
observer.observe(document.documentElement, { childList: true, subtree: true });