import { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineVideoCamera, HiOutlineStop, HiOutlineCamera, HiOutlineArrowDownTray } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { Switch } from "../../components/common/switch/switch";
import { Select } from "../../components/common/select/select";
import type { ISelectOption } from "../../components/common/select/select";
import { Notice } from "../../components/common/notice/notice";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { ValueList } from "../../components/common/value-list/value-list";
import type { IValueRow } from "../../components/common/value-list/value-list";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { describeMediaError, listDevices, mediaSupported, stopStream } from "../../services/media-service";

const PRESETS = [
  { width: 320, height: 240, name: "QVGA" },
  { width: 640, height: 480, name: "VGA" },
  { width: 1280, height: 720, name: "720p HD" },
  { width: 1920, height: 1080, name: "1080p Full HD" },
  { width: 2560, height: 1440, name: "1440p QHD" },
  { width: 3840, height: 2160, name: "4K" },
];

interface ITrackInfo {
  width: number;
  height: number;
  fps: number;
  label: string;
}

type Capabilities = MediaTrackCapabilities & Record<string, unknown>;

const lightingVerdict = (value: number) => {
  if (value < 0.18) return { label: "Too dark", note: "Add light in front of you, not behind you.", tone: "text-warning" };
  if (value > 0.82) return { label: "Very bright", note: "Your face may look washed out. Move away from direct light.", tone: "text-warning" };
  return { label: "Good lighting", note: "Your camera has enough light.", tone: "text-success" };
};

const CameraTest = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<ISelectOption<string>[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [mirror, setMirror] = usePersistentState("camera:mirror", true);
  const [info, setInfo] = useState<ITrackInfo | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [preset, setPreset] = useState("");
  const [measuredFps, setMeasuredFps] = useState<number | null>(null);
  const [brightness, setBrightness] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const readTrack = (stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    setInfo({
      width: settings.width ?? 0,
      height: settings.height ?? 0,
      fps: Math.round(settings.frameRate ?? 0),
      label: track.label,
    });
    setPreset(`${settings.width}x${settings.height}`);
    setDeviceId(settings.deviceId ?? "");
    setCapabilities(typeof track.getCapabilities === "function" ? (track.getCapabilities() as Capabilities) : null);
  };

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setInfo(null);
    setMeasuredFps(null);
    setBrightness(null);
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;
    let frames = 0;
    let handle = 0;
    let stopped = false;
    const canCount = typeof video.requestVideoFrameCallback === "function";
    const onFrame = () => {
      frames += 1;
      if (!stopped) handle = video.requestVideoFrameCallback(onFrame);
    };
    if (canCount) handle = video.requestVideoFrameCallback(onFrame);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 36;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const timer = setInterval(() => {
      if (canCount) {
        setMeasuredFps(frames);
        frames = 0;
      }
      if (ctx && video.videoWidth) {
        ctx.drawImage(video, 0, 0, 64, 36);
        const data = ctx.getImageData(0, 0, 64, 36).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        setBrightness(sum / (64 * 36) / 255);
      }
    }, 1000);
    return () => {
      stopped = true;
      clearInterval(timer);
      if (canCount) video.cancelVideoFrameCallback(handle);
    };
  }, [active]);

  const start = async (id?: string) => {
    setStarting(true);
    setError(null);
    stopStream(streamRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id ? { deviceId: { exact: id } } : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      readTrack(stream);
      setDevices(await listDevices("videoinput"));
      setActive(true);
    } catch (caught) {
      setError(describeMediaError(caught, "videoinput"));
      setActive(false);
    } finally {
      setStarting(false);
    }
  };

  const changeResolution = async (value: string) => {
    const stream = streamRef.current;
    if (!stream) return;
    const [width, height] = value.split("x").map(Number);
    try {
      await stream.getVideoTracks()[0].applyConstraints({ width: { ideal: width }, height: { ideal: height } });
      readTrack(stream);
    } catch {
      setError("This camera could not switch to that resolution. Try another one.");
    }
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    setSnapshot(canvas.toDataURL("image/png"));
  };

  const maxWidth = typeof capabilities?.width?.max === "number" ? capabilities.width.max : null;
  const maxHeight = typeof capabilities?.height?.max === "number" ? capabilities.height.max : null;
  const presetOptions: ISelectOption<string>[] = PRESETS.filter(
    (p) => maxWidth === null || maxHeight === null || (p.width <= maxWidth && p.height <= maxHeight)
  ).map((p) => ({ value: `${p.width}x${p.height}`, label: p.name, hint: `${p.width} × ${p.height}` }));
  if (info && !presetOptions.some((o) => o.value === preset)) {
    presetOptions.unshift({ value: preset, label: "Current", hint: `${info.width} × ${info.height}` });
  }

  const extras = ["zoom", "focusMode", "exposureMode", "whiteBalanceMode", "torch", "pan", "tilt"].filter(
    (key) => capabilities && key in capabilities
  );
  const facing = Array.isArray(capabilities?.facingMode) ? (capabilities.facingMode as string[]) : [];
  const capabilityRows: IValueRow[] = capabilities
    ? [
        ...(maxWidth && maxHeight ? [{ label: "Highest resolution", value: `${maxWidth} × ${maxHeight}`, copy: false }] : []),
        ...(typeof capabilities.frameRate?.max === "number"
          ? [{ label: "Highest frame rate", value: `${Math.round(capabilities.frameRate.max)} fps`, copy: false }]
          : []),
        ...(facing.length ? [{ label: "Faces", value: facing.join(", "), copy: false, mono: false }] : []),
        {
          label: "Extra controls",
          value: extras.length ? extras.map((key) => key.replace("Mode", "")).join(", ") : "None reported",
          copy: false,
          mono: false,
        },
      ]
    : [];

  const lighting = brightness === null ? null : lightingVerdict(brightness);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        {active ? (
          <Button label="Stop camera" variant="secondary" icon={HiOutlineStop} onClick={stop} />
        ) : (
          <Button label="Start camera" variant="primary" icon={HiOutlineVideoCamera} onClick={() => start()} loading={starting} />
        )}
        {devices.length > 1 && (
          <Select
            label="Camera"
            options={devices}
            value={deviceId}
            onChange={(id) => {
              setDeviceId(id);
              void start(id);
            }}
          />
        )}
        {active && presetOptions.length > 0 && (
          <Select label="Resolution" options={presetOptions} value={preset} onChange={(v) => void changeResolution(v)} />
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}

      {active && info && (
        <SummaryStrip
          label="Camera summary"
          items={[
            {
              label: "Live frame rate",
              value: measuredFps === null ? "Measuring" : `${measuredFps} fps`,
              context: info.fps ? `Camera reports ${info.fps} fps` : undefined,
              lead: true,
            },
            { label: "Resolution", value: `${info.width} × ${info.height}` },
            {
              label: "Lighting",
              value: lighting ? lighting.label : "Checking",
              context: brightness === null ? undefined : `${Math.round(brightness * 100)}% brightness`,
            },
          ]}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-rule bg-[#0b0f0e]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              aria-label="Camera preview"
              className="h-full w-full object-contain"
              style={{ transform: mirror ? "scaleX(-1)" : undefined }}
            />
            {!active && (
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">
                {starting ? "Waiting for permission" : "Start the camera to see a live preview"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Switch label="Mirror preview" checked={mirror} onChange={setMirror} />
            <Button label="Take a snapshot" variant="ghost" size="sm" icon={HiOutlineCamera} onClick={takeSnapshot} disabled={!active} />
          </div>
          {lighting && <p className={`text-sm ${lighting.tone}`}>{lighting.note}</p>}
        </div>

        <div className="flex flex-col gap-6">
          {info && (
            <section aria-labelledby="camera-device-heading" className="flex flex-col gap-2">
              <h2 id="camera-device-heading" className="text-sm font-medium text-ink">
                This camera
              </h2>
              <ValueList
                rows={[{ label: "Device", value: info.label || "Unnamed camera", copy: false, mono: false }, ...capabilityRows]}
              />
            </section>
          )}
          {snapshot && (
            <figure className="flex flex-col gap-2">
              <img src={snapshot} alt="Snapshot from the camera" className="max-h-48 w-fit rounded-md border border-rule" />
              <a
                href={snapshot}
                download="snapshot.png"
                className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-strong hover:bg-tint"
              >
                <HiOutlineArrowDownTray className="h-4 w-4" aria-hidden="true" />
                Download snapshot
              </a>
            </figure>
          )}
          {!info && (
            <p className="text-sm text-muted">
              After you start the camera, this shows its name, highest resolution and frame rate, and controls like zoom
              or focus if it has them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const CameraTestPage = () => (
  <ToolPage
    title="Camera Test"
    description="Check your webcam before a call: live preview, real frame rate, lighting and what the camera supports. Video never leaves this device."
  >
    {mediaSupported() ? (
      <CameraTest />
    ) : (
      <Notice tone="error">
        This browser cannot open the camera here. Use a recent Chrome, Edge, Firefox or Safari over a secure https connection.
      </Notice>
    )}
  </ToolPage>
);
