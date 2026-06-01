import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import "./demo.css";

// Not wrapped in <StrictMode>: the dev-only double-invoke of effects would
// attach/destroy the morph controller twice and flash on first paint.
createRoot(document.getElementById("root")).render(<App />);
