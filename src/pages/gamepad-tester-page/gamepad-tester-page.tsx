import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { HiArrowPath, HiOutlineBolt } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";

interface IPadState {
  index: number;
  id: string;
  mapping: string;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  canVibrate: boolean;
}

const STANDARD_LABELS = [
  "A", "B", "X", "Y", "LB", "RB", "LT", "RT", "View", "Menu", "L3", "R3", "Up", "Down", "Left", "Right", "Home",
];

const snapshot = (): IPadState[] =>
  Array.from(navigator.getGamepads?.() ?? [])
    .filter((pad): pad is Gamepad => pad !== null)
    .map((pad) => ({
      index: pad.index,
      id: pad.id,
      mapping: pad.mapping,
      buttons: pad.buttons.map((button) => ({ pressed: button.pressed, value: Math.round(button.value * 100) / 100 })),
      axes: pad.axes.map((axis) => Math.round(axis * 100) / 100),
      canVibrate: Boolean(pad.vibrationActuator),
    }));

const Stick = ({ label, x, y, pressed }: { label: string; x: number; y: number; pressed: boolean }) => {
  const distance = Math.min(1, Math.hypot(x, y));
  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        className={clsx(
          "relative h-32 w-32 rounded-full border-2 bg-surface",
          pressed ? "border-primary" : "border-line"
        )}
        aria-hidden="true"
      >
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-rule" />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-rule" />
        <span
          className={clsx(
            "absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full",
            pressed ? "bg-primary" : "bg-strong"
          )}
          style={{ left: `${50 + x * 42}%`, top: `${50 + y * 42}%` }}
        />
      </div>
      <figcaption className="text-center">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block font-mono text-xs tabular-nums text-muted">
          x {x.toFixed(2)}, y {y.toFixed(2)}
        </span>
        <span className={clsx("block text-xs", distance > 0.1 && distance < 0.5 ? "text-warning" : "text-muted")}>
          {distance > 0.1 && distance < 0.5 ? "Off center, check for drift" : distance >= 0.5 ? "Moving" : "Centered"}
        </span>
      </figcaption>
    </figure>
  );
};

const Trigger = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="font-mono text-xs tabular-nums text-muted">{Math.round(value * 100)}%</span>
    </div>
    <div className="h-3 overflow-hidden rounded-full border border-rule bg-surface" aria-hidden="true">
      <div className="h-full bg-primary" style={{ width: `${value * 100}%` }} />
    </div>
  </div>
);

export const GamepadTesterPage = () => {
  const [pads, setPads] = useState<IPadState[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [tested, setTested] = useState<Record<number, number[]>>({});
  const lastKey = useRef("");

  useEffect(() => {
    let frame = 0;
    const poll = () => {
      const next = snapshot();
      const key = JSON.stringify(next);
      if (key !== lastKey.current) {
        lastKey.current = key;
        setPads(next);
        setTested((previous) => {
          let changed = false;
          const updated = { ...previous };
          for (const pad of next) {
            const seen = new Set(updated[pad.index] ?? []);
            pad.buttons.forEach((button, i) => {
              if (button.pressed && !seen.has(i)) {
                seen.add(i);
                changed = true;
              }
            });
            updated[pad.index] = [...seen];
          }
          return changed ? updated : previous;
        });
      }
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);

  const pad = pads.find((item) => item.index === selected) ?? pads[0] ?? null;
  const standard = pad?.mapping === "standard";
  const testedButtons = pad ? tested[pad.index] ?? [] : [];

  const vibrate = () => {
    const live = pad ? navigator.getGamepads()[pad.index] : null;
    live?.vibrationActuator?.playEffect("dual-rumble", {
      duration: 700,
      strongMagnitude: 0.9,
      weakMagnitude: 0.6,
    });
  };

  return (
    <ToolPage
      title="Gamepad Tester"
      description="Check every button, stick and trigger on a game controller. Works with USB and Bluetooth controllers."
      actions={
        pad && (
          <>
            {pad.canVibrate && <Button label="Test vibration" variant="secondary" icon={HiOutlineBolt} onClick={vibrate} />}
            <Button
              label="Reset test"
              variant="ghost"
              icon={HiArrowPath}
              onClick={() => setTested((previous) => ({ ...previous, [pad.index]: [] }))}
            />
          </>
        )
      }
    >
      {!pad ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-rule bg-surface px-6 py-10">
          <p className="font-medium text-ink">No controller found yet</p>
          <p className="max-w-prose text-muted">
            Connect a controller and press any button on it. Browsers only show a controller to a page after a button
            press, so it may not appear until then.
          </p>
        </div>
      ) : (
        <>
          {pads.length > 1 && (
            <SegmentedControl
              label="Controller"
              options={pads.map((item) => ({ value: item.index, label: `Player ${item.index + 1}` }))}
              value={pad.index}
              onChange={setSelected}
            />
          )}
          <SummaryStrip
            label="Controller summary"
            items={[
              {
                label: "Buttons tested",
                value: `${testedButtons.length} of ${pad.buttons.length}`,
                context: testedButtons.length === pad.buttons.length ? "Every button works" : "Press each button once",
                lead: true,
              },
              { label: "Sticks and axes", value: pad.axes.length },
              { label: "Layout", value: standard ? "Standard" : "Custom", context: standard ? "Labels match an Xbox pad" : "Buttons are numbered" },
            ]}
          />
          <p className="-mt-2 text-sm break-all text-muted">{pad.id}</p>

          <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
            <section aria-labelledby="sticks-heading" className="flex flex-col gap-4">
              <h2 id="sticks-heading" className="text-sm font-medium text-ink">
                Sticks
              </h2>
              <div className="flex flex-wrap gap-8">
                {pad.axes.length >= 2 && (
                  <Stick label="Left stick" x={pad.axes[0]} y={pad.axes[1]} pressed={Boolean(pad.buttons[10]?.pressed)} />
                )}
                {pad.axes.length >= 4 && (
                  <Stick label="Right stick" x={pad.axes[2]} y={pad.axes[3]} pressed={Boolean(pad.buttons[11]?.pressed)} />
                )}
              </div>
              {standard && pad.buttons.length > 7 && (
                <div className="grid grid-cols-2 gap-4">
                  <Trigger label="Left trigger" value={pad.buttons[6].value} />
                  <Trigger label="Right trigger" value={pad.buttons[7].value} />
                </div>
              )}
            </section>

            <section aria-labelledby="buttons-heading" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="buttons-heading" className="text-sm font-medium text-ink">
                  Buttons
                </h2>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Legend">
                  <li className="flex items-center gap-1.5">
                    <span className="h-3.5 w-4 rounded-sm bg-primary" aria-hidden="true" />
                    Held now
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-3.5 w-4 rounded-sm border border-line bg-tint shadow-[inset_0_-3px_0_var(--color-primary)]" aria-hidden="true" />
                    Tested
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-3.5 w-4 rounded-sm border border-rule bg-raised" aria-hidden="true" />
                    Not tested
                  </li>
                </ul>
              </div>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-6">
                {pad.buttons.map((button, i) => {
                  const wasTested = testedButtons.includes(i);
                  const label = standard ? STANDARD_LABELS[i] ?? `Button ${i}` : `Button ${i}`;
                  return (
                    <li
                      key={i}
                      className={clsx(
                        "flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2.5 text-center transition-colors duration-75",
                        button.pressed
                          ? "border-primary bg-primary text-on-primary"
                          : wasTested
                            ? "border-line bg-tint text-strong shadow-[inset_0_-3px_0_var(--color-primary)]"
                            : "border-rule bg-raised text-muted"
                      )}
                    >
                      <span className="font-mono text-sm font-semibold">{label}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {button.value > 0 && button.value < 1 ? `${Math.round(button.value * 100)}%` : `#${i}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}
    </ToolPage>
  );
};
