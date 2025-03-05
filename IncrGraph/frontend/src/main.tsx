import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import AppRouter from "./routes";
import "./index.css";
import { injectCSSVariables } from "./styles/injectStyles";


// Inject the static CSS variables
injectCSSVariables();

const rootElement = document.getElementById("root");
if (rootElement) {
    createRoot(rootElement).render(<RouterProvider router={AppRouter} />);
} else {
    console.error("Failed to find the root element");
}
