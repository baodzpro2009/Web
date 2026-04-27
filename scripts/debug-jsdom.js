const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.htm"), "utf8");
const virtualConsole = new VirtualConsole();

virtualConsole.on("log", (...args) => console.log("LOG", ...args));
virtualConsole.on("warn", (...args) => console.log("WARN", ...args));
virtualConsole.on("error", (...args) => console.log("VC_ERROR", ...args));
virtualConsole.on("jsdomError", (error) => {
  console.log("JSDOM_ERROR", error.message);
  if (error.stack) console.log(error.stack);
});

const dom = new JSDOM(html, {
  url: "http://localhost:3000/",
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.matchMedia =
      window.matchMedia ||
      (() => ({
        matches: false,
        addListener() {},
        removeListener() {}
      }));
    window.requestIdleCallback = (callback) =>
      setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0);
    window.cancelIdleCallback = (id) => clearTimeout(id);
    window.alert = (...args) => console.log("ALERT", ...args);
    const originalError = window.console.error.bind(window.console);
    window.console.error = (...args) => {
      console.log("WINDOW_ERROR", ...args);
      originalError(...args);
    };
    window.addEventListener("error", (event) => {
      console.log("WINDOW_ONERROR", event.message);
      if (event.error?.stack) console.log(event.error.stack);
    });
  }
});

setTimeout(() => {
  const { document } = dom.window;
  console.log("READY", document.readyState);
  console.log("ACTIVE_SCREEN", document.querySelector(".screen-active")?.dataset?.screen);
  console.log("BOTTOM_NAV_CLASS", document.querySelector("#bottomNav")?.className || "");
  console.log("SUMMARY_HTML_LEN", document.querySelector("#summaryHero")?.innerHTML?.length || 0);
  process.exit(0);
}, 4000);
