export interface IVaultData {
  [key: string]: string | number | boolean | IVaultData;
}

export interface IEnvData {
  key: string;
  value: string;
}

export interface IConversionResult {
  success: boolean;
  data: string;
  error?: string;
}

export interface IVaultEnvConverterState {
  input: string;
  output: string;
  mode: "vault-to-env" | "env-to-vault";
  error: string | null;
}

export interface IJsonFormatterState {
  input: string;
  output: string;
  error: string | null;
  indentSize: number;
}
