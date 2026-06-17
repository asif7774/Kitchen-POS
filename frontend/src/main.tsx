import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "app/app";

// Polyfills for modern web APIs used by Tooltips/Modals
if (!("popover" in HTMLElement.prototype)) {
  void import("@oddbird/popover-polyfill/fn").then(({ apply }) => {
    (apply as () => void)();
  });
}

if (!("interestTargetElement" in HTMLButtonElement.prototype)) {
  void import("interestfor");
}

if (!("anchorName" in document.documentElement.style)) {
  void import("@oddbird/css-anchor-positioning");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    "Root element not found. Ensure there is a <div id='root'> in your index.html.",
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
