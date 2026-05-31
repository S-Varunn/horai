import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@/lib/api-client";
import App from "./App";
import "./index.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://3994-75-171-125-143.ngrok-free.app";
setBaseUrl(apiBaseUrl);
setAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(<App />);
