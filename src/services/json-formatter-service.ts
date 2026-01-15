import type { IConversionResult } from "../interfaces/IVaultEnv";

const parseMultipleJson = (input: string): unknown[] => {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Empty input");
  }

  try {
    const parsed = JSON.parse(trimmed);
    return [parsed];
  } catch {
    const results: unknown[] = [];
    let currentJson = "";
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      currentJson += char;

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") braceCount++;
      if (char === "}") braceCount--;
      if (char === "[") bracketCount++;
      if (char === "]") bracketCount--;

      if (braceCount === 0 && bracketCount === 0 && currentJson.trim()) {
        try {
          const parsed = JSON.parse(currentJson.trim());
          results.push(parsed);
          currentJson = "";
        } catch {
          continue;
        }
      }
    }

    if (currentJson.trim()) {
      try {
        results.push(JSON.parse(currentJson.trim()));
      } catch {
        if (results.length === 0) {
          throw new Error("Invalid JSON format");
        }
      }
    }

    if (results.length === 0) {
      throw new Error("No valid JSON found");
    }

    return results;
  }
};

export const formatJson = (input: string, indentSize: number = 2): IConversionResult => {
  try {
    const parsed = parseMultipleJson(input);
    
    if (parsed.length === 1) {
      const formatted = JSON.stringify(parsed[0], null, indentSize);
      return { success: true, data: formatted };
    }
    
    const formatted = parsed
      .map((item) => JSON.stringify(item, null, indentSize))
      .join("\n\n");
    return { success: true, data: formatted };
  } catch {
    return { success: false, data: "", error: "Invalid JSON format" };
  }
};

export const minifyJson = (input: string): IConversionResult => {
  try {
    const parsed = parseMultipleJson(input);
    
    if (parsed.length === 1) {
      const minified = JSON.stringify(parsed[0]);
      return { success: true, data: minified };
    }
    
    const minified = parsed.map((item) => JSON.stringify(item)).join("\n");
    return { success: true, data: minified };
  } catch {
    return { success: false, data: "", error: "Invalid JSON format" };
  }
};

export const validateJson = (input: string): { valid: boolean; error?: string } => {
  try {
    parseMultipleJson(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
};
