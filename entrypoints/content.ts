export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Baize content script loaded");

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("[Baize] Received message:", request);

      if (request.type === "GET_PAGE_CONTENT") {
        (async () => {
          try {
            // const { default: TurndownService } = await import("turndown");
            // const turndownService = new TurndownService();
            // const markdown = turndownService.turndown(document.body);

            sendResponse({
              content: document.body,
              title: document.title,
              url: window.location.href,
            });
          } catch (e: any) {
            const fallback = document.body?.innerText ?? "";
            sendResponse({
              content: fallback,
              title: document.title,
              url: window.location.href,
              error: `Error: ${e.message}`,
            });
          }
        })();
        return true;
      }

      if (request.type === "CLICK_ELEMENT") {
        const { selector } = request.payload || {};
        try {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            element.click();
            sendResponse({ success: true });
          } else {
            sendResponse({
              success: false,
              error: `Element not found: ${selector}`,
            });
          }
        } catch (e: any) {
          sendResponse({
            success: false,
            error: `Invalid selector or error: ${e.message}`,
          });
        }
        return false;
      }

      if (request.type === "INPUT_TEXT") {
        const { selector, text } = request.payload || {};
        if (!selector) {
          sendResponse({ success: false, error: "Missing selector." });
          return false;
        }
        try {
          const element = document.querySelector(selector);
          if (!element) {
            sendResponse({
              success: false,
              error: `Element not found: ${selector}`,
            });
            return false;
          }

          const dispatchInputEvents = (target: Element) => {
            const inputEvent =
              typeof InputEvent === "function"
                ? new InputEvent("input", { bubbles: true })
                : new Event("input", { bubbles: true });
            target.dispatchEvent(inputEvent);
            target.dispatchEvent(new Event("change", { bubbles: true }));
          };

          const nextText = String(text ?? "");
          if (element instanceof HTMLInputElement) {
            const type = (element.type || "").toLowerCase();
            if (type === "checkbox" || type === "radio") {
              sendResponse({
                success: false,
                error: `Input type '${type}' does not accept text.`,
              });
              return false;
            }
            if (type === "file") {
              sendResponse({
                success: false,
                error: "Cannot set value for file inputs.",
              });
              return false;
            }
            const descriptor = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value",
            );
            if (descriptor?.set) {
              descriptor.set.call(element, nextText);
            } else {
              element.value = nextText;
            }
            dispatchInputEvents(element);
            sendResponse({ success: true });
            return false;
          }

          if (element instanceof HTMLTextAreaElement) {
            const descriptor = Object.getOwnPropertyDescriptor(
              HTMLTextAreaElement.prototype,
              "value",
            );
            if (descriptor?.set) {
              descriptor.set.call(element, nextText);
            } else {
              element.value = nextText;
            }
            dispatchInputEvents(element);
            sendResponse({ success: true });
            return false;
          }

          if (element instanceof HTMLSelectElement) {
            const options = Array.from(element.options);
            const option =
              options.find((opt) => opt.value === nextText) ||
              options.find((opt) => opt.text === nextText);
            if (!option) {
              sendResponse({
                success: false,
                error: `Option not found for value/text: ${nextText}`,
              });
              return false;
            }
            element.value = option.value;
            dispatchInputEvents(element);
            sendResponse({ success: true });
            return false;
          }

          if (element instanceof HTMLElement && element.isContentEditable) {
            element.textContent = nextText;
            dispatchInputEvents(element);
            sendResponse({ success: true });
            return false;
          }

          sendResponse({
            success: false,
            error:
              "Element is not an input, textarea, select, or contenteditable element.",
          });
          return false;
        } catch (e: any) {
          sendResponse({
            success: false,
            error: `Invalid selector or error: ${e.message}`,
          });
          return false;
        }
      }

      if (request.type === "GO_BACK") {
        try {
          if (window.history.length <= 1) {
            sendResponse({
              success: false,
              error: "No history entry to navigate back to.",
            });
            return false;
          }
          sendResponse({ success: true });
          setTimeout(() => {
            window.history.back();
          }, 0);
          return false;
        } catch (e: any) {
          sendResponse({
            success: false,
            error: `Failed to navigate back: ${e.message}`,
          });
          return false;
        }
      }

      if (request.type === "NAVIGATE_TO_URL") {
        const { url } = request.payload || {};
        if (!url) {
          sendResponse({ success: false, error: "Missing url." });
          return false;
        }
        try {
          const nextUrl = String(url).trim();
          if (!nextUrl) {
            sendResponse({ success: false, error: "Empty url." });
            return false;
          }
          if (/^javascript:/i.test(nextUrl)) {
            sendResponse({
              success: false,
              error: "Blocked javascript: URL.",
            });
            return false;
          }
          sendResponse({ success: true });
          setTimeout(() => {
            window.location.assign(nextUrl);
          }, 0);
          return false;
        } catch (e: any) {
          sendResponse({
            success: false,
            error: `Failed to navigate: ${e.message}`,
          });
          return false;
        }
      }
    });
  },
});
