import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineVideoCamera,
  HiOutlineMicrophone,
  HiOutlineStop,
  HiOutlineCamera,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { Switch } from "../../components/common/switch/switch";
import { Select } from "../../components/common/select/select";
import type { ISelectOption } from "../../components/common/select/select";
import { Notice } from "../../components/common/notice/notice";
import { ValueList } from "../../components/common/value-list/value-list";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { describeMediaError, listDevices, mediaSupported, stopStream } from "../../services/media-service";

const CameraPanel = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<ISelectOption<string>[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [mirror, setMirror] = usePersistentState("media:mirror", true);
  const [info, setInfo] = useState<{ width: number; height: number; fps: number; label: string } | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setInfo(null);
  }, []);

  useEffect(() => stop, [stop]);

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
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setInfo({
        width: settings.width ?? 0,
        height: settings.height ?? 0,
        fps: Math.round(settings.frameRate ?? 0),
        label: track.label,
      });
      setDeviceId(settings.deviceId ?? "");
      setDevices(await listDevices("videoinput"));
      setActive(true);
    } catch (caught) {
      setError(describeMediaError(caught, "videoinput"));
      setActive(false);
    } finally {
      setStarting(false);
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

  return (
    <section aria-labelledby="camera-heading" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="camera-heading" className="flex items-center gap-2 font-mono text-sm font-semibold text-strong">
          <HiOutlineVideoCamera className="h-5 w-5" aria-hidden="true" />
          Camera
        </h2>
        {active ? (
          <Button label="Stop camera" variant="secondary" size="sm" icon={HiOutlineStop} onClick={stop} />
        ) : (
          <Button label="Start camera" variant="primary" size="sm" icon={HiOutlineVideoCamera} onClick={() => start()} loading={starting} />
        )}
      </div>
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
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap items-end gap-4">
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
        <div className="pb-1.5">
          <Switch label="Mirror preview" checked={mirror} onChange={setMirror} />
        </div>
        <Button
          label="Take a snapshot"
          variant="ghost"
          size="sm"
          icon={HiOutlineCamera}
          onClick={takeSnapshot}
          disabled={!active}
          className="mb-1"
        />
      </div>
      {info && (
        <ValueList
          rows={[
            { label: "Device", value: info.label || "Unnamed camera", copy: false, mono: false },
            { label: "Resolution", value: `${info.width} × ${info.height}`, copy: false },
            { label: "Frame rate", value: info.fps ? `${info.fps} fps` : "Unknown", copy: false },
          ]}
        />
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
    </section>
  );
};

const MicrophonePanel = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<ISelectOption<string>[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [info, setInfo] = useState<{ label: string; sampleRate: number; channels: number } | null>(null);
  const [heard, setHeard] = useState(false);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const clipRef = useRef<string | null>(null);

  useEffect(() => {
    clipRef.current = clip;
  }, [clip]);

  useEffect(() => {
    const ref = clipRef;
    return () => {
      if (ref.current) URL.revokeObjectURL(ref.current);
    };
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    if (barRef.current) barRef.current.style.scale = "";
    if (peakRef.current) peakRef.current.style.left = "";
    stopStream(streamRef.current);
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    setActive(false);
    setInfo(null);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async (id?: string) => {
    setStarting(true);
    setError(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: id ? { deviceId: { exact: id } } : true,
        video: false,
      });
      streamRef.current = stream;
      const context = new AudioContext();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let peak = 0;
      let peakTime = 0;
      let soundSeen = false;
      const loop = (time: number) => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const rms = Math.sqrt(sum / samples.length);
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;
        const level = Math.min(1, Math.max(0, (db + 60) / 60));
        if (level > peak || time - peakTime > 1500) {
          peak = level;
          peakTime = time;
        }
        if (barRef.current) barRef.current.style.scale = `${level} 1`;
        if (peakRef.current) peakRef.current.style.left = `${peak * 100}%`;
        if (readoutRef.current) readoutRef.current.textContent = db <= -100 ? "Silent" : `${Math.round(db)} dB`;
        if (!soundSeen && level > 0.35) {
          soundSeen = true;
          setHeard(true);
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      setInfo({ label: track.label, sampleRate: context.sampleRate, channels: settings.channelCount ?? 1 });
      setDeviceId(settings.deviceId ?? "");
      setDevices(await listDevices("audioinput"));
      setActive(true);
    } catch (caught) {
      setError(describeMediaError(caught, "audioinput"));
    } finally {
      setStarting(false);
    }
  };

  const record = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") return;
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => {
      setRecording(false);
      setClip((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
      });
    };
    recorder.start();
    setRecording(true);
    setTimeout(() => recorder.state === "recording" && recorder.stop(), 5000);
  };

  return (
    <section aria-labelledby="mic-heading" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mic-heading" className="flex items-center gap-2 font-mono text-sm font-semibold text-strong">
          <HiOutlineMicrophone className="h-5 w-5" aria-hidden="true" />
          Microphone
        </h2>
        {active ? (
          <Button label="Stop microphone" variant="secondary" size="sm" icon={HiOutlineStop} onClick={stop} />
        ) : (
          <Button label="Start microphone" variant="primary" size="sm" icon={HiOutlineMicrophone} onClick={() => start()} loading={starting} />
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-rule bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">Input level</span>
          <span ref={readoutRef} className="font-mono text-sm tabular-nums text-ink">
            {active ? "Silent" : "Off"}
          </span>
        </div>
        <div className="relative h-4 overflow-hidden rounded-full border border-rule bg-raised" aria-hidden="true">
          <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-primary" />
          <div ref={peakRef} className="absolute inset-y-0 left-0 w-0.5 bg-accent-strong" />
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {!active
            ? "Start the microphone and speak to see the meter move."
            : heard
              ? "Your microphone is picking up sound."
              : "Speak or clap. The bar should jump toward the right."}
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-wrap items-end gap-4">
        {devices.length > 1 && (
          <Select
            label="Microphone"
            options={devices}
            value={deviceId}
            onChange={(id) => {
              setDeviceId(id);
              void start(id);
            }}
          />
        )}
        <Button
          label={recording ? "Recording 5 seconds" : "Record a 5 second clip"}
          variant="ghost"
          size="sm"
          icon={HiOutlineMicrophone}
          onClick={record}
          disabled={!active || recording}
          loading={recording}
          className="mb-1"
        />
      </div>
      {clip && (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">Play your clip to hear how you sound:</span>
          <audio controls src={clip} className="w-full max-w-md" />
        </div>
      )}
      {info && (
        <ValueList
          rows={[
            { label: "Device", value: info.label || "Unnamed microphone", copy: false, mono: false },
            { label: "Sample rate", value: `${info.sampleRate.toLocaleString()} Hz`, copy: false },
            { label: "Channels", value: info.channels === 1 ? "Mono" : `${info.channels} channels`, copy: false, mono: false },
          ]}
        />
      )}
    </section>
  );
};

export const WebcamMicTestPage = () => (
  <ToolPage
    title="Webcam and Mic Test"
    description="Check that your camera and microphone work before a call. Video and sound stay on this device."
  >
    {mediaSupported() ? (
      <div className="grid gap-10 lg:grid-cols-2">
        <CameraPanel />
        <MicrophonePanel />
      </div>
    ) : (
      <Notice tone="error">
        This browser cannot open the camera or microphone here. Use a recent Chrome, Edge, Firefox or Safari over a secure
        https connection.
      </Notice>
    )}
  </ToolPage>
);
