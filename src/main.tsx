import { createRoot } from "react-dom/client";
import "./index.css";

function hasSupabaseEnv(): boolean {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  return Boolean(url && key);
}

function ConfigMissing() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", color: "#111" }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>App configuration incomplete</h1>
      <p style={{ margin: 0 }}>
        Missing <code>VITE_SUPABASE_URL</code> or <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in the build (e.g.
        GitHub Actions secrets).
      </p>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

const root = createRoot(rootEl);

if (!hasSupabaseEnv()) {
  root.render(<ConfigMissing />);
} else {
  void import("./App.tsx")
    .then(({ default: App }) => {
      root.render(<App />);
    })
    .catch(() => {
      root.render(
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          Failed to load the app bundle (check APK assets / reinstall).
        </div>,
      );
    });
}
