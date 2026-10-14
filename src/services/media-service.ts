export type MediaKind = "videoinput" | "audioinput";

export const mediaSupported = (): boolean =>
  typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

export const describeMediaError = (error: unknown, kind: MediaKind): string => {
  const device = kind === "videoinput" ? "camera" : "microphone";
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return `Access to the ${device} was blocked. Click the ${device} icon in the address bar, allow access, then try again.`;
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return `No ${device} was found. Plug one in or pick another device, then try again.`;
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return `The ${device} is busy. Close other apps or tabs that use it, then try again.`;
  }
  return `The ${device} could not be started. Reload the page and try again.`;
};

export const listDevices = async (kind: MediaKind) => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === kind && device.deviceId)
    .map((device, index) => ({
      value: device.deviceId,
      label: device.label || `${kind === "videoinput" ? "Camera" : "Microphone"} ${index + 1}`,
    }));
};

export const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};
