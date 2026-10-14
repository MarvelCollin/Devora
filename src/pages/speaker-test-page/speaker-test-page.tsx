import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { HiOutlinePlay, HiOutlineStop, HiOutlineSpeakerWave } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { Slider } from "../../components/common/slider/slider";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Select } from "../../components/common/select/select";
import type { ISelectOption } from "../../components/common/select/select";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";

type Side = "left" | "right" | "both";
type Wave = "sine" | "square" | "triangle" | "sawtooth";

const WAVES: { value: Wave; label: string }[] = [
  { value: "sine", label: "Sine" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Saw" },
];

const MIN_F = 20;
const MAX_F = 20000;
const SWEEP_SECONDS = 12;

const sliderToFrequency = (value: number) => Math.round(MIN_F * (MAX_F / MIN_F) ** (value / 1000));
const frequencyToSlider = (hz: number) => Math.round((Math.log(hz / MIN_F) / Math.log(MAX_F / MIN_F)) * 1000);
const formatHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2)} kHz` : `${Math.round(hz)} Hz`);

type SinkContext = AudioContext & { setSinkId?: (id: string) => Promise<void> };

const SideIndicator = ({ side, playing }: { side: "left" | "right"; playing: boolean }) => (
  <div
    className={clsx(
      "flex h-28 flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 transition-colors duration-150",
      playing ? "border-primary bg-tint text-strong" : "border-rule bg-surface text-muted"
    )}
  >
    <HiOutlineSpeakerWave className={clsx("h-8 w-8", side === "left" && "-scale-x-100")} aria-hidden="true" />
    <span className="text-sm font-semibold">{side === "left" ? "Left" : "Right"}</span>
    <span className="text-xs">{playing ? "Playing" : "Quiet"}</span>
  </div>
);

export const SpeakerTestPage = () => {
  const contextRef = useRef<SinkContext | null>(null);
  const toneRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const sweepFrame = useRef(0);
  const [playing, setPlaying] = useState<Side | null>(null);
  const [toneOn, setToneOn] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweepHz, setSweepHz] = useState<number | null>(null);
  const [frequency, setFrequency] = usePersistentState("speaker:frequency", 440);
  const [volume, setVolume] = usePersistentState("speaker:volume", 30);
  const [wave, setWave] = usePersistentState<Wave>("speaker:wave", "sine");
  const [outputs, setOutputs] = useState<ISelectOption<string>[]>([]);
  const [output, setOutput] = useState("default");

  const context = useCallback(async () => {
    if (!contextRef.current) contextRef.current = new AudioContext() as SinkContext;
    if (contextRef.current.state === "suspended") await contextRef.current.resume();
    return contextRef.current;
  }, []);

  const stopTone = useCallback(() => {
    cancelAnimationFrame(sweepFrame.current);
    const tone = toneRef.current;
    if (tone && contextRef.current) {
      const now = contextRef.current.currentTime;
      tone.gain.gain.cancelScheduledValues(now);
      tone.gain.gain.setTargetAtTime(0, now, 0.02);
      tone.osc.stop(now + 0.1);
    }
    toneRef.current = null;
    setToneOn(false);
    setSweeping(false);
    setSweepHz(null);
  }, []);

  useEffect(
    () => () => {
      stopTone();
      void contextRef.current?.close();
    },
    [stopTone]
  );

  useEffect(() => {
    if (typeof (AudioContext.prototype as SinkContext).setSinkId !== "function") return;
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        const list = devices
          .filter((device) => device.kind === "audiooutput" && device.deviceId)
          .map((device, i) => ({ value: device.deviceId, label: device.label || `Output ${i + 1}` }));
        if (list.length > 1) setOutputs(list);
      })
      .catch(() => undefined);
  }, []);

  const playSide = async (side: Side) => {
    const ctx = await context();
    setPlaying(side);
    const panner = ctx.createStereoPanner();
    panner.pan.value = side === "left" ? -1 : side === "right" ? 1 : 0;
    const gain = ctx.createGain();
    gain.connect(panner).connect(ctx.destination);
    const start = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = hz;
      const noteGain = ctx.createGain();
      const t = start + i * 0.28;
      noteGain.gain.setValueAtTime(0, t);
      noteGain.gain.linearRampToValueAtTime((volume / 100) * 0.5, t + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(noteGain).connect(gain);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    setTimeout(() => setPlaying((current) => (current === side ? null : current)), 1100);
  };

  const startTone = async (hz: number) => {
    stopTone();
    const ctx = await context();
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = hz;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime((volume / 100) * 0.4, ctx.currentTime, 0.02);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    toneRef.current = { osc, gain };
    setToneOn(true);
  };

  const startSweep = async () => {
    await startTone(MIN_F);
    const ctx = contextRef.current;
    const tone = toneRef.current;
    if (!ctx || !tone) return;
    const begin = ctx.currentTime;
    tone.osc.frequency.setValueAtTime(MIN_F, begin);
    tone.osc.frequency.exponentialRampToValueAtTime(MAX_F, begin + SWEEP_SECONDS);
    setSweeping(true);
    const tick = () => {
      const elapsed = ctx.currentTime - begin;
      if (elapsed >= SWEEP_SECONDS) {
        stopTone();
        return;
      }
      setSweepHz(MIN_F * (MAX_F / MIN_F) ** (elapsed / SWEEP_SECONDS));
      sweepFrame.current = requestAnimationFrame(tick);
    };
    sweepFrame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const tone = toneRef.current;
    const ctx = contextRef.current;
    if (!tone || !ctx || sweeping) return;
    tone.osc.frequency.setTargetAtTime(frequency, ctx.currentTime, 0.01);
    tone.osc.type = wave;
  }, [frequency, wave, sweeping]);

  useEffect(() => {
    const tone = toneRef.current;
    const ctx = contextRef.current;
    if (!tone || !ctx) return;
    tone.gain.gain.setTargetAtTime((volume / 100) * 0.4, ctx.currentTime, 0.02);
  }, [volume]);

  const changeOutput = async (id: string) => {
    setOutput(id);
    const ctx = await context();
    await ctx.setSinkId?.(id === "default" ? "" : id).catch(() => undefined);
  };

  return (
    <ToolPage
      title="Speaker Test"
      description="Check that left and right are not swapped on your speakers or headphones, and hear how low and how high they can go."
    >
      <Notice tone="info">Start with a low volume. Very low and very high tones can be louder than they seem.</Notice>

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-full max-w-sm">
          <Slider label="Test volume" value={volume} min={1} max={100} onChange={setVolume} valueText={`${volume}%`} />
        </div>
        {outputs.length > 0 && (
          <Select
            label="Play through"
            options={[{ value: "default", label: "System default" }, ...outputs]}
            value={output}
            onChange={(id) => void changeOutput(id)}
          />
        )}
      </div>

      <section aria-labelledby="stereo-heading" className="flex flex-col gap-4">
        <h2 id="stereo-heading" className="font-mono text-sm font-semibold text-strong">
          Left and right
        </h2>
        <div className="flex max-w-2xl gap-4">
          <SideIndicator side="left" playing={playing === "left" || playing === "both"} />
          <SideIndicator side="right" playing={playing === "right" || playing === "both"} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button label="Play left" variant="secondary" icon={HiOutlinePlay} onClick={() => void playSide("left")} />
          <Button label="Play both" variant="secondary" icon={HiOutlinePlay} onClick={() => void playSide("both")} />
          <Button label="Play right" variant="secondary" icon={HiOutlinePlay} onClick={() => void playSide("right")} />
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {playing ? `Playing a chime on the ${playing === "both" ? "left and right" : playing} side.` : "Each button plays a short chime. If you hear it on the wrong side, your channels are swapped."}
        </p>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="tone-heading" className="flex flex-col gap-4">
          <h2 id="tone-heading" className="font-mono text-sm font-semibold text-strong">
            Tone generator
          </h2>
          <Slider
            label="Pitch"
            value={frequencyToSlider(frequency)}
            min={0}
            max={1000}
            onChange={(value) => setFrequency(sliderToFrequency(value))}
            valueText={formatHz(frequency)}
            hint="Most adults hear from about 20 Hz to between 15 and 17 kHz."
          />
          <SegmentedControl label="Wave shape" options={WAVES} value={wave} onChange={setWave} />
          <div className="flex flex-wrap gap-2">
            {toneOn && !sweeping ? (
              <Button label="Stop tone" variant="secondary" icon={HiOutlineStop} onClick={stopTone} />
            ) : (
              <Button label="Play tone" variant="primary" icon={HiOutlinePlay} onClick={() => void startTone(frequency)} disabled={sweeping} />
            )}
            {[100, 440, 1000, 8000].map((hz) => (
              <Button key={hz} label={formatHz(hz)} variant="ghost" size="sm" onClick={() => setFrequency(hz)} />
            ))}
          </div>
        </section>

        <section aria-labelledby="sweep-heading" className="flex flex-col gap-4">
          <h2 id="sweep-heading" className="font-mono text-sm font-semibold text-strong">
            Frequency sweep
          </h2>
          <p className="text-muted">
            Plays from 20 Hz up to 20 kHz over {SWEEP_SECONDS} seconds. Note where the sound starts and where it fades
            away. Small speakers often start near 100 Hz.
          </p>
          <div className="flex flex-col gap-2 rounded-lg border border-rule bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Now playing</span>
              <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
                {sweepHz === null ? "Off" : formatHz(sweepHz)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-rule bg-raised" aria-hidden="true">
              <div
                className="h-full bg-primary"
                style={{ width: `${sweepHz === null ? 0 : (frequencyToSlider(sweepHz) / 1000) * 100}%` }}
              />
            </div>
          </div>
          {sweeping ? (
            <Button label="Stop sweep" variant="secondary" icon={HiOutlineStop} onClick={stopTone} className="self-start" />
          ) : (
            <Button label="Start sweep" variant="primary" icon={HiOutlinePlay} onClick={() => void startSweep()} className="self-start" />
          )}
        </section>
      </div>
    </ToolPage>
  );
};
