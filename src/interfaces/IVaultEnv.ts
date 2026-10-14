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
