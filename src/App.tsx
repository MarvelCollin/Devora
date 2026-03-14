import { useState } from "react";
import {
  HiOutlineKey,
  HiOutlineCodeBracket,
  HiOutlineComputerDesktop,
  HiOutlineCursorArrowRays,
  HiOutlineSignal,
  HiOutlineClock,
  HiOutlineFingerPrint,
  HiOutlineDocumentDuplicate,
  HiOutlineLink,
  HiOutlineSwatch,
} from "react-icons/hi2";
import { Header } from "./components/layout/header/header";
import { Sidebar } from "./components/layout/sidebar/sidebar";
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
import type { ITool } from "./interfaces/ITool";

const tools: ITool[] = [
  {
    id: "vault-env-converter",
    name: "Vault / ENV Converter",
    description: "Convert between Vault JSON format and ENV variables seamlessly",
    icon: HiOutlineKey,
    path: "/vault-env-converter",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and beautify JSON data with syntax highlighting",
    icon: HiOutlineCodeBracket,
    path: "/json-formatter",
  },
  {
    id: "keyboard-test",
    name: "Keyboard Test",
    description: "Test your keyboard keys and see real-time key press information",
    icon: HiOutlineComputerDesktop,
    path: "/keyboard-test",
  },
  {
    id: "mouse-test",
    name: "Mouse Test",
    description: "Test your mouse buttons, scroll wheel, and track cursor movement",
    icon: HiOutlineCursorArrowRays,
    path: "/mouse-test",
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates instantly",
    icon: HiOutlineClock,
    path: "/timestamp-converter",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any text",
    icon: HiOutlineFingerPrint,
    path: "/hash-generator",
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder / Decoder",
    description: "Encode text to Base64 or decode Base64 strings back to text",
    icon: HiOutlineDocumentDuplicate,
    path: "/base64-encoder",
  },
  {
    id: "url-encoder",
    name: "URL Encoder / Decoder",
    description: "Encode and decode URL components and parse query strings",
    icon: HiOutlineLink,
    path: "/url-encoder",
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "Convert colors between HEX, RGB, and HSL formats with live preview",
    icon: HiOutlineSwatch,
    path: "/color-converter",
  },
  {
    id: "wifi-speed-test",
    name: "WiFi Speed Test",
    description: "Measure your connection latency, download speed, and upload speed",
    icon: HiOutlineSignal,
    path: "/wifi-speed-test",
  },
];

export const App = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleHomeClick = () => {
    setActiveTool(null);
  };

  const getPageTitle = (): string => {
    if (!activeTool) return "Home";
    const tool = tools.find((t) => t.id === activeTool);
    return tool?.name ?? "Home";
  };

  const renderActivePage = () => {
    switch (activeTool) {
      case "vault-env-converter":
        return <VaultEnvConverterPage />;
      case "json-formatter":
        return <JsonFormatterPage />;
      case "keyboard-test":
        return <KeyboardTestPage />;
      case "mouse-test":
        return <MouseTestPage />;
      case "timestamp-converter":
        return <TimestampConverterPage />;
      case "hash-generator":
        return <HashGeneratorPage />;
      case "base64-encoder":
        return <Base64EncoderPage />;
      case "url-encoder":
        return <UrlEncoderPage />;
      case "color-converter":
        return <ColorConverterPage />;
      case "wifi-speed-test":
        return <WifiSpeedTestPage />;
      default:
        return <HomePage tools={tools} onToolSelect={handleToolSelect} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-950">
      <Header title={getPageTitle()} onHomeClick={handleHomeClick} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tools={tools}
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onHomeClick={handleHomeClick}
        />
        <main className="flex-1 overflow-auto">{renderActivePage()}</main>
      </div>
    </div>
  );
};

export default App;
