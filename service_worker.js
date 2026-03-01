// service_worker.js
console.log("✅ service worker loaded");

let latestContext = null;

function isRestrictedUrl(url = "") {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("https://chrome.google.com/webstore") ||
    url.startsWith("https://chromewebstore.google.com")
  );
}

async function captureFromTab(tab) {
  if (!tab?.id) return null;

  const url = tab.url || "";

  if (isRestrictedUrl(url)) {
    return {
      title: tab.title || "(restricted page)",
      url,
      text: "",
      note: "Restricted page — extensions can’t read its content."
    };
  }

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const text = (document.body?.innerText || "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
          .slice(0, 12000);

        return {
          title: document.title,
          url: location.href,
          text
        };
      }
    });

    // Sometimes pages load but innerText is still empty (rare). Add a note.
    if (!result?.text?.trim()) {
      return {
        ...result,
        note: "Page text captured but empty (site may render content in a way innerText can’t see yet)."
      };
    }

    return result;
  } catch (e) {
    return {
      title: tab.title || "(unknown)",
      url,
      text: "",
      note: `Could not read page content: ${e?.message || e}`
    };
  }
}

async function captureActiveTabContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  latestContext = await captureFromTab(tab);
  console.log("🧠 context:", latestContext?.title, "| text chars:", latestContext?.text?.length || 0);
}

// Keep context fresh proactively
chrome.tabs.onActivated.addListener(() => captureActiveTabContext());
chrome.tabs.onUpdated.addListener((_tabId, info) => {
  if (info.status === "complete") captureActiveTabContext();
});

// Side panel asks for current context (capture RIGHT NOW if needed)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_ACTIVE_CONTEXT") {
    (async () => {
      // If we have no context yet, or it's empty, re-capture immediately
      if (!latestContext || !latestContext.text) {
        await captureActiveTabContext();
      }
      sendResponse({ context: latestContext });
    })();

    return true; // async response
  }
});

// Open side panel on icon click
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  chrome.sidePanel.open({ tabId: tab.id }).catch(console.log);

  // Also capture right when user clicks (best chance we have permissions + page is ready)
  captureActiveTabContext().catch(console.log);
});