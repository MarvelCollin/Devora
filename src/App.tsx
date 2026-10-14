import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX, MouseEvent } from "react";
import { Header } from "./components/layout/header/header";
import { Sidebar } from "./components/layout/sidebar/sidebar";
import { NavDrawer } from "./components/layout/nav-drawer/nav-drawer";
import { ToolPage } from "./components/layout/tool-page/tool-page";
import { HomePage } from "./pages/home-page/home-page";
import { VaultEnvConverterPage } from "./pages/vault-env-converter-page/vault-env-converter-page";
import { JsonFormatterPage } from "./pages/json-formatter-page/json-formatter-page";
import { KeyboardTestPage } from "./pages/keyboard-test-page/keyboard-test-page";
import { MouseTestPage } from "./pages/mouse-test-page/mouse-test-page";
import { TimestampConverterPage } from "./pages/timestamp-converter-page/timestamp-converter-page";
import { HashGeneratorPage } from "./pages/hash-generator-page/hash-generator-page";
import { Base64EncoderPage } from "./pages/base64-encoder-page/base64-encoder-page";
import { UrlEncoderPage } from "./pages/url-encoder-page/url-encoder-page";
import { ColorConverterPage } from "./pages/color-converter-page/color-converter-page";
import { WifiSpeedTestPage } from "./pages/wifi-speed-test-page/wifi-speed-test-page";
import { QrGeneratorPage } from "./pages/qr-generator-page/qr-generator-page";
import { ImageCompressorPage } from "./pages/image-compressor-page/image-compressor-page";
import { WordCounterPage } from "./pages/word-counter-page/word-counter-page";
import { TOOLS } from "./constants/tools";
import { routeHref, useHashRoute } from "./hooks/use-hash-route";

const PAGES: Record<string, () => JSX.Element> = {
  "vault-env-converter": VaultEnvConverterPage,
  "json-formatter": JsonFormatterPage,
  "keyboard-test": KeyboardTestPage,
  "mouse-test": MouseTestPage,
  "timestamp-converter": TimestampConverterPage,
  "hash-generator": HashGeneratorPage,
  "base64-encoder": Base64EncoderPage,
  "url-encoder": UrlEncoderPage,
  "color-converter": ColorConverterPage,
  "wifi-speed-test": WifiSpeedTestPage,
  "qr-generator": QrGeneratorPage,
  "image-compressor": ImageCompressorPage,
  "word-counter": WordCounterPage,
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const activeTool = TOOLS.find((tool) => tool.id === route) ?? null;
  const Page = route ? PAGES[route] : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.title = activeTool ? `${activeTool.name} | Devora` : "Devora | Developer tools";
    mainRef.current?.scrollTo({ top: 0 });
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById("page-title")?.focus();
  }, [route, activeTool]);

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
        menuButtonRef={menuButtonRef}
      />

      <aside className="hidden w-64 shrink-0 border-r border-rule bg-surface lg:block">
        <Sidebar tools={TOOLS} activeTool={route ? activeTool?.id ?? "" : null} />
      </aside>

      <NavDrawer
        open={menuOpen}
        onClose={closeMenu}
        tools={TOOLS}
        activeTool={route ? activeTool?.id ?? "" : null}
      />

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {route === null ? (
          <HomePage tools={TOOLS} />
        ) : Page ? (
          <Page key={route} />
        ) : (
          <NotFoundPage />
        )}
      </main>
    </div>
  );
};

export default App;
