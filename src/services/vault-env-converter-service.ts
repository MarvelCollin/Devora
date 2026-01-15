import type { IVaultData, IConversionResult, IEnvData } from "../interfaces/IVaultEnv";

const flattenObject = (obj: IVaultData, prefix: string = ""): IEnvData[] => {
  const result: IEnvData[] = [];

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}__${key}`.toUpperCase() : key.toUpperCase();

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result.push(...flattenObject(value as IVaultData, newKey));
    } else {
      result.push({ key: newKey, value: String(value) });
    }
  }

  return result;
};

export const convertVaultToEnv = (vaultJson: string): IConversionResult => {
  try {
    const parsed = JSON.parse(vaultJson) as IVaultData;
    const envData = flattenObject(parsed);
    const envString = envData.map(({ key, value }) => `${key}=${value}`).join("\n");
    return { success: true, data: envString };
  } catch {
    return { success: false, data: "", error: "Invalid JSON format" };
  }
};

export const convertEnvToVault = (envString: string): IConversionResult => {
  try {
    const lines = envString.split("\n").filter((line) => line.trim() !== "");
    const result: Record<string, string> = {};

    for (const line of lines) {
      const equalIndex = line.indexOf("=");
      if (equalIndex === -1) {
        continue;
      }
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      result[key] = value;
    }

    const jsonString = JSON.stringify(result, null, 2);
    return { success: true, data: jsonString };
  } catch {
    return { success: false, data: "", error: "Invalid ENV format" };
  }
};
