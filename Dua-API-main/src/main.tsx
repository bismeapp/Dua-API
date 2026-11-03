import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// Auto-resize support when embedded in an <iframe> (e.g. on bisme radio resource page).
// Sends the content height to the parent page so the iframe never needs an inner scrollbar.
if (window.parent !== window) {
  document.documentElement.classList.add("embedded");
  const root = document.getElementById("root")!;
  let last = 0;
  const sendHeight = () => {
    const h = Math.ceil(root.getBoundingClientRect().height);
    if (h !== last) {
      last = h;
      // both names sent so any embed snippet version works
      window.parent.postMessage({ type: "dua-height", height: h }, "*");
      window.parent.postMessage({ type: "bisme-dua-height", height: h }, "*");
    }
  };
  new ResizeObserver(sendHeight).observe(root);
  window.addEventListener("load", sendHeight);
  window.addEventListener("resize", sendHeight);
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "bisme-dua-ping") sendHeight();
  });
  sendHeight();
}
