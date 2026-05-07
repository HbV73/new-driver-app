import { createRoot } from "react-dom/client";
import "./index.css";

function hasSupabaseEnv(): boolean {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  return Boolean(url && key);
}

function ConfigMissing() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", color: "#111", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>پیکربندی ناقص / Missing build config</h1>
      <p style={{ margin: "0 0 12px" }}>
        برای APK از CI، در GitHub این ریپو برو به{" "}
        <strong>Settings → Secrets and variables → Actions</strong> و دو Secret بساز:
      </p>
      <ul style={{ margin: "0 0 12px", paddingInlineStart: 20 }}>
        <li>
          <code>VITE_SUPABASE_URL</code> — آدرس پروژه (مثل https://xxx.supabase.co)
        </li>
        <li>
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — کلید anon/public از Supabase → Settings → API
        </li>
      </ul>
      <p style={{ margin: 0, opacity: 0.85 }}>
        بعد ذخیرهٔ Secrets یک بار دیگر workflow را اجرا کن تا APK دوباره ساخته شود.
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
