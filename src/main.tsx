import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@/lib/api-client";
import App from "./App";
import "./index.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://crewless-chapter-barn.ngrok-free.dev";
setBaseUrl(apiBaseUrl);
setAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(<App />);
