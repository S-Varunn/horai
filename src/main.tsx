import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@/lib/api-client";
import App from "./App";
import "./index.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
setBaseUrl(apiBaseUrl || null);
setAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(<App />);
