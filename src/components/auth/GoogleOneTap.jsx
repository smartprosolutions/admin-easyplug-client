import * as React from "react";
import { useLocation } from "react-router-dom";

export default function GoogleOneTap({ clientId }) {
  const location = useLocation();
  const initializedRef = React.useRef(false);
  const lastPromptPathRef = React.useRef(null);

  // Load & initialize once
  React.useEffect(() => {
    if (!clientId) return;
    const src = "https://accounts.google.com/gsi/client";

    const init = () => {
      if (!window.google?.accounts?.id) return;
      if (initializedRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: () => {},
          itp_support: true,
          use_fedcm_for_prompt: false
        });
        initializedRef.current = true;
        // Prompt on initial load if not on /login
        const path = location.pathname;
        if (path !== "/login") {
          try {
            window.google.accounts.id.cancel();
          } catch {
            /* no-op */
          }
          try {
            window.google.accounts.id.prompt((notification) => {
              const nd = notification.getNotDisplayedReason?.();
              const sk = notification.getSkippedReason?.();
              if (nd || sk) {
                // suppressed; do nothing
              }
            });
            lastPromptPathRef.current = path;
          } catch {
            /* no-op */
          }
        }
      } catch {
        // no-op
      }
    };

    let script = document.querySelector(`script[src="${src}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      init();
    } else {
      script.addEventListener("load", init, { once: true });
    }

    return () => {
      if (script) script.removeEventListener?.("load", init);
    };
  }, [clientId, location.pathname]);

  // Re-prompt on route changes (without reload)
  React.useEffect(() => {
    if (!initializedRef.current) return;
    const path = location.pathname;
    if (path === "/login") return;
    if (lastPromptPathRef.current === path) return;
    try { window.google?.accounts?.id?.cancel?.(); } catch { /* no-op */ }
    try {
      window.google?.accounts?.id?.prompt?.((notification) => {
        const nd = notification.getNotDisplayedReason?.();
        const sk = notification.getSkippedReason?.();
        if (nd || sk) {
          // suppressed; do nothing
        }
      });
      lastPromptPathRef.current = path;
    } catch { /* no-op */ }
  }, [location.pathname]);

  return null;
}
