import { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineMicrophone, HiOutlineStop } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { Switch } from "../../components/common/switch/switch";
import { Select } from "../../components/common/select/select";
import type { ISelectOption } from "../../components/common/select/select";
import { Notice } from "../../components/common/notice/notice";
import { ValueList } from "../../components/common/value-list/value-list";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { describeMediaError, listDevices, mediaSupported, stopStream } from "../../services/media-service";

interface IProcessing {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

const noiseVerdict = (db: number) => {
  if (db < -60) return "Very quiet room";
  if (db < -45) return "Quiet room";
  if (db < -32) return "Some background noise";
  return "Noisy. Others may hear it on calls.";
};

const MicTest = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const monitorRef = useRef<GainNode | null>(null);
  const frameRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const noiseRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clipRef = useRef<string | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<ISelectOption<string>[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [info, setInfo] = useState<{ label: string; sampleRate: number; channels: number; latency: number } | null>(null);
  const [heard, setHeard] = useState(false);
  const [monitor, setMonitor] = useState(false);
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const [processing, setProcessing] = usePersistentState<IProcessing>("mic:processing", {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  useEffect(() => {
    clipRef.current = clip;
  }, [clip]);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    if (barRef.current) barRef.current.style.scale = "";
    if (peakRef.current) peakRef.current.style.left = "";
    stopStream(streamRef.current);
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    monitorRef.current = null;
    setActive(false);
    setMonitor(false);
    setInfo(null);
  }, []);

  useEffect(() => {
    const ref = clipRef;
    return () => {
      stop();
      if (ref.current) URL.revokeObjectURL(ref.current);
    };
  }, [stop]);

  const start = async (id: string | undefined, settings: IProcessing) => {
    setStarting(true);
    setError(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...(id ? { deviceId: { exact: id } } : {}), ...settings },
        video: false,
      });
      streamRef.current = stream;
      const context = new AudioContext();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(context.destination);
      monitorRef.current = gain;

      const samples = new Float32Array(analyser.fftSize);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const history: number[] = [];
      let peak = 0;
      let peakTime = 0;
      let soundSeen = false;
      let frame = 0;
      let barColor = "";
      const nyquist = context.sampleRate / 2;

      const loop = (time: number) => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const rms = Math.sqrt(sum / samples.length);
        const db = rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
        const level = Math.min(1, Math.max(0, (db + 60) / 60));
        if (level > peak || time - peakTime > 1500) {
          peak = level;
          peakTime = time;
        }
        history.push(db);
        if (history.length > 240) history.shift();
        if (barRef.current) barRef.current.style.scale = `${level} 1`;
        if (peakRef.current) peakRef.current.style.left = `${peak * 100}%`;
        if (frame % 6 === 0 && readoutRef.current) readoutRef.current.textContent = db <= -100 ? "Silent" : `${Math.round(db)} dB`;
        if (frame % 30 === 0 && noiseRef.current && history.length > 60) {
          const floor = [...history].sort((a, b) => a - b)[Math.floor(history.length * 0.1)];
          noiseRef.current.textContent = `${Math.round(floor)} dB, ${noiseVerdict(floor)}`;
        }
        if (!soundSeen && level > 0.35) {
          soundSeen = true;
          setHeard(true);
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          const dpr = window.devicePixelRatio || 1;
          const width = canvas.clientWidth * dpr;
          const height = canvas.clientHeight * dpr;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          if (frame % 30 === 0 || !barColor) {
            barColor = getComputedStyle(canvas).getPropertyValue("color") || "#0f6353";
          }
          analyser.getByteFrequencyData(bins);
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = barColor;
          const bars = 48;
          const minF = 60;
          const maxF = Math.min(12000, nyquist);
          const gap = 2 * dpr;
          const barWidth = (width - gap * (bars - 1)) / bars;
          for (let i = 0; i < bars; i += 1) {
            const f0 = minF * (maxF / minF) ** (i / bars);
            const f1 = minF * (maxF / minF) ** ((i + 1) / bars);
            const b0 = Math.floor((f0 / nyquist) * bins.length);
            const b1 = Math.max(b0 + 1, Math.floor((f1 / nyquist) * bins.length));
            let max = 0;
            for (let b = b0; b < b1 && b < bins.length; b += 1) max = Math.max(max, bins[b]);
            const h = Math.max(2 * dpr, (max / 255) * height);
            ctx.fillRect(i * (barWidth + gap), height - h, barWidth, h);
          }
        }
        frame += 1;
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);

      const track = stream.getAudioTracks()[0];
      const trackSettings = track.getSettings();
      setInfo({
        label: track.label,
        sampleRate: context.sampleRate,
        channels: trackSettings.channelCount ?? 1,
        latency: Math.round((context.baseLatency ?? 0) * 1000),
      });
      setDeviceId(trackSettings.deviceId ?? "");
      setDevices(await listDevices("audioinput"));
      setActive(true);
    } catch (caught) {
      setError(describeMediaError(caught, "audioinput"));
    } finally {
      setStarting(false);
    }
  };

  const toggleMonitor = (on: boolean) => {
    setMonitor(on);
    if (monitorRef.current) monitorRef.current.gain.value = on ? 1 : 0;
  };

  const changeProcessing = (patch: Partial<IProcessing>) => {
    const next = { ...processing, ...patch };
    setProcessing(next);
    if (active) void start(deviceId || undefined, next);
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        {active ? (
          <Button label="Stop microphone" variant="secondary" icon={HiOutlineStop} onClick={stop} />
        ) : (
          <Button
            label="Start microphone"
            variant="primary"
            icon={HiOutlineMicrophone}
            onClick={() => start(undefined, processing)}
            loading={starting}
          />
        )}
        {devices.length > 1 && (
          <Select
            label="Microphone"
            options={devices}
            value={deviceId}
            onChange={(id) => {
              setDeviceId(id);
              void start(id, processing);
            }}
          />
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section aria-labelledby="level-heading" className="flex flex-col gap-2 rounded-lg border border-rule bg-surface p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="level-heading" className="text-sm text-muted">
                Input level
              </h2>
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
            <p className="text-sm text-muted">
              Background noise: <span ref={noiseRef} className="font-medium text-ink">{active ? "Measuring, stay quiet for a moment" : "Not measured"}</span>
            </p>
          </section>

          <section aria-labelledby="spectrum-heading" className="flex flex-col gap-2">
            <h2 id="spectrum-heading" className="text-sm font-medium text-ink">
              Sound spectrum
            </h2>
            <canvas
              ref={canvasRef}
              className="h-36 w-full rounded-lg border border-rule bg-surface text-primary"
              role="img"
              aria-label="Live sound spectrum from low pitch on the left to high pitch on the right"
            />
            <div className="flex justify-between font-mono text-xs text-muted" aria-hidden="true">
              <span>60 Hz</span>
              <span>1 kHz</span>
              <span>12 kHz</span>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-ink">Browser sound processing</legend>
            <Switch
              label="Echo cancellation"
              checked={processing.echoCancellation}
              onChange={(echoCancellation) => changeProcessing({ echoCancellation })}
            />
            <Switch
              label="Noise suppression"
              checked={processing.noiseSuppression}
              onChange={(noiseSuppression) => changeProcessing({ noiseSuppression })}
            />
            <Switch
              label="Automatic volume"
              checked={processing.autoGainControl}
              onChange={(autoGainControl) => changeProcessing({ autoGainControl })}
            />
            <p className="text-sm text-muted">Turn these off to hear your raw microphone. Calls usually keep them on.</p>
          </fieldset>

          <section aria-labelledby="listen-heading" className="flex flex-col gap-3">
            <h2 id="listen-heading" className="text-sm font-medium text-ink">
              Listen back
            </h2>
            <Switch label="Hear yourself live" checked={monitor} onChange={toggleMonitor} disabled={!active} />
            <p className="text-sm text-muted">Use headphones, or the speakers will feed back into the microphone.</p>
            <Button
              label={recording ? "Recording 5 seconds" : "Record a 5 second clip"}
              variant="secondary"
              size="sm"
              icon={HiOutlineMicrophone}
              onClick={record}
              disabled={!active || recording}
              loading={recording}
              className="self-start"
            />
            {clip && <audio controls src={clip} className="w-full max-w-md" />}
          </section>

          {info && (
            <ValueList
              rows={[
                { label: "Device", value: info.label || "Unnamed microphone", copy: false, mono: false },
                { label: "Sample rate", value: `${info.sampleRate.toLocaleString()} Hz`, copy: false },
                { label: "Channels", value: info.channels === 1 ? "Mono" : `${info.channels} channels`, copy: false, mono: false },
                ...(info.latency ? [{ label: "Audio latency", value: `${info.latency} ms`, copy: false }] : []),
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const MicTestPage = () => (
  <ToolPage
    title="Mic Test"
    description="Check that your microphone works and sounds clear: level, background noise, live spectrum and a test recording. Sound stays on this device."
  >
    {mediaSupported() ? (
      <MicTest />
    ) : (
      <Notice tone="error">
        This browser cannot open the microphone here. Use a recent Chrome, Edge, Firefox or Safari over a secure https
        connection.
      </Notice>
    )}
  </ToolPage>
);
