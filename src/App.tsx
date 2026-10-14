import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType, MouseEvent } from "react";
import { Header } from "./components/layout/header/header";
import { Sidebar } from "./components/layout/sidebar/sidebar";
import { NavDrawer } from "./components/layout/nav-drawer/nav-drawer";
import { ToolPage } from "./components/layout/tool-page/tool-page";
import { PageSkeleton } from "./components/layout/page-skeleton/page-skeleton";
import { CommandPalette } from "./components/layout/command-palette/command-palette";
import { HomePage } from "./pages/home-page/home-page";
import { TOOLS } from "./constants/tools";
import { routeHref, useHashRoute } from "./hooks/use-hash-route";
import { recordRecentTool } from "./hooks/use-recent-tools";
import { isEditableTarget } from "./utils/platform";

const PAGES: Record<string, ComponentType> = {
  "vault-env-converter": lazy(() =>
    import("./pages/vault-env-converter-page/vault-env-converter-page").then((m) => ({
      default: m.VaultEnvConverterPage,
    }))
  ),
  "json-formatter": lazy(() =>
    import("./pages/json-formatter-page/json-formatter-page").then((m) => ({
      default: m.JsonFormatterPage,
    }))
  ),
  "keyboard-test": lazy(() =>
    import("./pages/keyboard-test-page/keyboard-test-page").then((m) => ({
      default: m.KeyboardTestPage,
    }))
  ),
  "mouse-test": lazy(() =>
    import("./pages/mouse-test-page/mouse-test-page").then((m) => ({
      default: m.MouseTestPage,
    }))
  ),
  "timestamp-converter": lazy(() =>
    import("./pages/timestamp-converter-page/timestamp-converter-page").then((m) => ({
      default: m.TimestampConverterPage,
    }))
  ),
  "hash-generator": lazy(() =>
    import("./pages/hash-generator-page/hash-generator-page").then((m) => ({
      default: m.HashGeneratorPage,
    }))
  ),
  "base64-encoder": lazy(() =>
    import("./pages/base64-encoder-page/base64-encoder-page").then((m) => ({
      default: m.Base64EncoderPage,
    }))
  ),
  "url-encoder": lazy(() =>
    import("./pages/url-encoder-page/url-encoder-page").then((m) => ({
      default: m.UrlEncoderPage,
    }))
  ),
  "color-converter": lazy(() =>
    import("./pages/color-converter-page/color-converter-page").then((m) => ({
      default: m.ColorConverterPage,
    }))
  ),
  "wifi-speed-test": lazy(() =>
    import("./pages/wifi-speed-test-page/wifi-speed-test-page").then((m) => ({
      default: m.WifiSpeedTestPage,
    }))
  ),
  "qr-generator": lazy(() =>
    import("./pages/qr-generator-page/qr-generator-page").then((m) => ({
      default: m.QrGeneratorPage,
    }))
  ),
  "image-compressor": lazy(() =>
    import("./pages/image-compressor-page/image-compressor-page").then((m) => ({
      default: m.ImageCompressorPage,
    }))
  ),
  "word-counter": lazy(() =>
    import("./pages/word-counter-page/word-counter-page").then((m) => ({
      default: m.WordCounterPage,
    }))
  ),
  "jwt-decoder": lazy(() =>
    import("./pages/jwt-decoder-page/jwt-decoder-page").then((m) => ({
      default: m.JwtDecoderPage,
    }))
  ),
  "regex-tester": lazy(() =>
    import("./pages/regex-tester-page/regex-tester-page").then((m) => ({
      default: m.RegexTesterPage,
    }))
  ),
  "text-diff": lazy(() =>
    import("./pages/text-diff-page/text-diff-page").then((m) => ({
      default: m.TextDiffPage,
    }))
  ),
  "uuid-generator": lazy(() =>
    import("./pages/uuid-generator-page/uuid-generator-page").then((m) => ({
      default: m.UuidGeneratorPage,
    }))
  ),
  "password-generator": lazy(() =>
    import("./pages/password-generator-page/password-generator-page").then((m) => ({
      default: m.PasswordGeneratorPage,
    }))
  ),
  "case-converter": lazy(() =>
    import("./pages/case-converter-page/case-converter-page").then((m) => ({
      default: m.CaseConverterPage,
    }))
  ),
  "number-base-converter": lazy(() =>
    import("./pages/number-base-converter-page/number-base-converter-page").then((m) => ({
      default: m.NumberBaseConverterPage,
    }))
  ),
  "csv-json-converter": lazy(() =>
    import("./pages/csv-json-converter-page/csv-json-converter-page").then((m) => ({
      default: m.CsvJsonConverterPage,
    }))
  ),
  "sql-formatter": lazy(() =>
    import("./pages/sql-formatter-page/sql-formatter-page").then((m) => ({
      default: m.SqlFormatterPage,
    }))
  ),
  "markdown-preview": lazy(() =>
    import("./pages/markdown-preview-page/markdown-preview-page").then((m) => ({
      default: m.MarkdownPreviewPage,
    }))
  ),
  "timezone-converter": lazy(() =>
    import("./pages/timezone-converter-page/timezone-converter-page").then((m) => ({
      default: m.TimezoneConverterPage,
    }))
  ),
  "cron-explainer": lazy(() =>
    import("./pages/cron-explainer-page/cron-explainer-page").then((m) => ({
      default: m.CronExplainerPage,
    }))
  ),
  "css-builder": lazy(() =>
    import("./pages/css-builder-page/css-builder-page").then((m) => ({
      default: m.CssBuilderPage,
    }))
  ),
};

const NotFoundPage = () => (
  <ToolPage
    title="Tool not found"
    description="This link does not match any tool. It may have been renamed."
  >
    <a
      href={routeHref(null)}
      className="w-fit font-medium text-strong underline underline-offset-4 hover:text-ink"
    >
      Browse all tools
    </a>
  </ToolPage>
);

export const App = () => {
  const route = useHashRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const activeTool = TOOLS.find((tool) => tool.id === route) ?? null;
  const Page = route ? PAGES[route] : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openPalette = useCallback(() => {
    setMenuOpen(false);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    document.title = activeTool ? `${activeTool.name} | Devora` : "Devora | Developer tools";
    mainRef.current?.scrollTo({ top: 0 });
    if (activeTool) recordRecentTool(activeTool.id);
  }, [route, activeTool]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const isPaletteKey = event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey);
      const isSlash = event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (isPaletteKey) {
        event.preventDefault();
        setMenuOpen(false);
        setPaletteOpen((open) => !open);
      } else if (isSlash && !isEditableTarget(event.target)) {
        event.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [openPalette]);

  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink lg:flex-row">
      <a
        href="#main"
        onClick={skipToContent}
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Header
        menuOpen={menuOpen}
        onMenuClick={() => setMenuOpen(true)}
        onSearch={openPalette}
        menuButtonRef={menuButtonRef}
      />

      <aside className="hidden w-64 shrink-0 border-r border-rule bg-surface lg:block">
        <Sidebar
          tools={TOOLS}
          activeTool={route ? activeTool?.id ?? "" : null}
          onSearch={openPalette}
        />
      </aside>

      <NavDrawer
        open={menuOpen}
        onClose={closeMenu}
        onSearch={openPalette}
        tools={TOOLS}
        activeTool={route ? activeTool?.id ?? "" : null}
      />

      <CommandPalette open={paletteOpen} onClose={closePalette} tools={TOOLS} />

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {route === null ? (
          <HomePage tools={TOOLS} />
        ) : Page ? (
          <Suspense fallback={<PageSkeleton />}>
            <Page key={route} />
          </Suspense>
        ) : (
          <NotFoundPage />
        )}
      </main>
    </div>
  );
};

export default App;
