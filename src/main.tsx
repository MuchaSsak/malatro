import "~/styles.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "~/App";
import ErrorBoundary from "~/components/layout/ErrorBoundary";
import AuthProvider from "~/contexts/AuthContext";
import SettingsProvider from "~/contexts/SettingsContext";
import { queryClient } from "~/services/tanstack-query/client";

async function boot() {
  // pixel-art glyphs are drawn to canvas with the pixel font, so it must be loaded first
  try {
    await Promise.race([document.fonts.load('32px "m6x11plus"'), new Promise((r) => setTimeout(r, 2_000))]);
  } catch {
    // fall back to whatever font is available
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

void boot();
