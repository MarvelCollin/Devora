import { useState } from "react";
import {
  HiOutlineKey,
  HiOutlineCodeBracket,
  HiOutlineComputerDesktop,
} from "react-icons/hi2";
import { Header } from "./components/layout/header/header";
import { Sidebar } from "./components/layout/sidebar/sidebar";
import { HomePage } from "./pages/home-page/home-page";
import { VaultEnvConverterPage } from "./pages/vault-env-converter-page/vault-env-converter-page";
import { JsonFormatterPage } from "./pages/json-formatter-page/json-formatter-page";
import { KeyboardTestPage } from "./pages/keyboard-test-page/keyboard-test-page";
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
