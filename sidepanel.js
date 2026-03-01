const chatEl = document.querySelector("#chat");
const form = document.querySelector("#form");
const input = document.querySelector("#input");

function addMsg(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}

let session = null;

async function getSession() {
  if (typeof LanguageModel === "undefined") {
    throw new Error("Gemini Nano (Prompt API) is not available in this Chrome setup.");
  }
  const availability = await LanguageModel.availability();
  if (availability !== "available") {
    throw new Error(`Gemini Nano not available (availability = "${availability}").`);
  }
  session = session ?? (await LanguageModel.create());
  return session;
}

async function getActiveContext() {
  const res = await chrome.runtime.sendMessage({ type: "GET_ACTIVE_CONTEXT" });
  return res?.context ?? null;
}

function buildPrompt(userText, ctx) {
  const hasText = !!(ctx?.text && ctx.text.trim().length);

  const contextBlock = hasText
    ? `Page title: ${ctx.title}
Page URL: ${ctx.url}
Page text (truncated):
${ctx.text}`
    : `No readable page text available.
Reason: ${ctx?.note ?? "page still loading or not captured yet"}
Title: ${ctx?.title ?? "(none)"}
URL: ${ctx?.url ?? "(none)"}`;

  return `You are a browsing assistant.
You ONLY know the page through the PAGE CONTEXT below.

=== PAGE CONTEXT ===
${contextBlock}
=== END CONTEXT ===

User question: ${userText}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMsg(text, "user");

  const thinking = addMsg("Thinking...", "ai");

  try {
    const ctx = await getActiveContext();
    const s = await getSession();
    const reply = await s.prompt(buildPrompt(text, ctx));
    thinking.textContent = reply || "(no reply)";
  } catch (err) {
    thinking.textContent = `Error: ${err.message}`;
  }
});