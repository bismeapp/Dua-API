import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// Auto-resize support when embedded in an <iframe> (e.g. on bisme radio resource page).
// Sends the content height to the parent page so the iframe never needs an inner scrollbar.
if (window.parent !== window) {
  const root = document.getElementById("root")!;
  let last = 0;
  const sendHeight = () => {
    const h = Math.ceil(Math.max(root.getBoundingClientRect().height, document.body.scrollHeight));
    if (h !== last) {
      last = h;
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
