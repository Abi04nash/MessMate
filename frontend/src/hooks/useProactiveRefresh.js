import { useEffect } from "react";
import { useSelector } from "react-redux";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

function getCsrf() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// Refreshes the access token every 13 minutes (TTL is 15) so the
// session never expires during active use. Eliminates the "logged out
// after 10-15 min" and "sometimes right sometimes wrong" bugs.
export function useProactiveRefresh() {
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (!user) return;

    const doRefresh = async () => {
      try {
        await fetch(API_URL + "/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": getCsrf() }
        });
      } catch {
        // ignore - the auto-refresh on 401 will catch it
      }
    };

    // Run once shortly after login, then every 13 min
    const t = setTimeout(doRefresh, 60 * 1000);
    const id = setInterval(doRefresh, 13 * 60 * 1000);

    return () => { clearTimeout(t); clearInterval(id); };
  }, [user]);
}