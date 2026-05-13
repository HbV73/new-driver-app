# Driver App

Capacitor + React (Vite) driver application.

## CI: Android debug APK

GitHub Actions builds an installable **debug APK** on every push to `main` or when you run the workflow manually (workflow name: **Android debug APK**).

### Required repository secrets

Add these under **Settings → Secrets and variables → Actions → New repository secret** (same values as your local `.env`):

| Secret | Example |
|--------|---------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key |

The workflow sets `VITE_DRIVER_API_PROVIDER=supabase` for the build.
When switching to REST integration, use `VITE_DRIVER_API_BASE_URL=https://apis.germanwm.de`.

Until secrets exist, the Vite build step may fail or produce a broken app.

### Download the APK

1. Open **Actions** → workflow **Android debug APK**.
2. Open the latest successful run.
3. Download artifact **`app-debug-apk`** (ZIP containing `app-debug.apk`).
4. Transfer to phone → enable install from unknown sources for your file app → install.

Debug builds use the default debug signing key.
