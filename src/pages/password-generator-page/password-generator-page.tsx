import { useState } from "react";
import { clsx } from "clsx";
import { HiArrowPath } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { CopyButton } from "../../components/common/copy-button/copy-button";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Slider } from "../../components/common/slider/slider";
import { Switch } from "../../components/common/switch/switch";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";
import {
  generatePassphrase,
  generatePassword,
  passphraseBits,
  poolSize,
  rateStrength,
} from "../../services/password-service";
import type { ICharacterOptions, IPassphraseOptions } from "../../services/password-service";

type Mode = "characters" | "passphrase";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "characters", label: "Random characters" },
  { value: "passphrase", label: "Passphrase" },
];

const SEPARATORS = [
  { value: "-", label: "Dash" },
  { value: ".", label: "Dot" },
  { value: "_", label: "Underscore" },
  { value: " ", label: "Space" },
];

const DEFAULT_CHARS: ICharacterOptions = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  avoidLookalikes: false,
};

const DEFAULT_PHRASE: IPassphraseOptions = {
  words: 6,
  separator: "-",
  capitalize: true,
  addNumber: true,
};

const LEVEL_TONES = ["text-danger", "text-warning", "text-success", "text-success"];
const LEVEL_BARS = ["bg-danger", "bg-warning", "bg-success", "bg-success"];

const ColoredSecret = ({ value }: { value: string }) => (
  <>
    {Array.from(value).map((char, i) => (
      <span
        key={i}
        className={
          /[0-9]/.test(char)
            ? "text-strong"
            : /[a-zA-Z]/.test(char)
              ? "text-ink"
              : "text-accent-strong"
        }
      >
        {char}
      </span>
    ))}
  </>
);

const create = (mode: Mode, chars: ICharacterOptions, phrase: IPassphraseOptions) =>
  mode === "characters" ? generatePassword(chars) : generatePassphrase(phrase);

export const PasswordGeneratorPage = () => {
  const [mode, setMode] = usePersistentState<Mode>("password:mode", "characters");
  const [chars, setChars] = usePersistentState<ICharacterOptions>("password:chars", DEFAULT_CHARS);
  const [phrase, setPhrase] = usePersistentState<IPassphraseOptions>("password:phrase", DEFAULT_PHRASE);
  const [secret, setSecret] = useState(() => create(mode, chars, phrase));

  const apply = (nextMode: Mode, nextChars: ICharacterOptions, nextPhrase: IPassphraseOptions) => {
    setMode(nextMode);
    setChars(nextChars);
    setPhrase(nextPhrase);
    setSecret(create(nextMode, nextChars, nextPhrase));
  };

  const updateChars = (patch: Partial<ICharacterOptions>) => apply(mode, { ...chars, ...patch }, phrase);
  const updatePhrase = (patch: Partial<IPassphraseOptions>) => apply(mode, chars, { ...phrase, ...patch });

  const noSets = mode === "characters" && poolSize(chars) === 0;
  const bits =
    mode === "characters" ? (noSets ? 0 : chars.length * Math.log2(poolSize(chars))) : passphraseBits(phrase);
  const strength = rateStrength(bits);

  return (
    <ToolPage
      title="Password Generator"
      description="Make strong passwords with your browser's secure random generator. Nothing is stored or sent anywhere."
      actions={
        <SegmentedControl
          label="Type"
          options={MODE_OPTIONS}
          value={mode}
          onChange={(next) => apply(next, chars, phrase)}
        />
      }
    >
      <section aria-labelledby="password-heading" className="flex flex-col gap-4 border-y border-rule py-6">
        <h2 id="password-heading" className="sr-only">
          Generated password
        </h2>
        {noSets ? (
          <Notice tone="error">Turn on at least one character type to make a password.</Notice>
        ) : (
          <p className="font-mono text-2xl leading-snug font-semibold tracking-wide [overflow-wrap:anywhere] sm:text-3xl">
            <ColoredSecret value={secret} />
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={secret} variant="primary" label="Copy password" />
          <Button
            label="Generate another"
            variant="secondary"
            size="sm"
            icon={HiArrowPath}
            onClick={() => setSecret(create(mode, chars, phrase))}
            disabled={noSets}
          />
        </div>
        {!noSets && (
          <div className="flex max-w-xl flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className={clsx("font-semibold", LEVEL_TONES[strength.level])}>{strength.label}</p>
              <p className="font-mono text-sm text-muted">{Math.round(strength.bits)} bits of entropy</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={clsx(
                    "h-1.5 rounded-full",
                    step <= strength.level ? LEVEL_BARS[strength.level] : "bg-rule"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted">
              A fast offline attack at ten billion guesses a second would need {strength.crackTime}.
            </p>
          </div>
        )}
      </section>

      {mode === "characters" ? (
        <div className="grid max-w-4xl gap-8 md:grid-cols-2">
          <Slider
            label="Length"
            value={chars.length}
            min={6}
            max={128}
            onChange={(length) => updateChars({ length })}
            valueText={`${chars.length} characters`}
            hint="16 or more is a good default for accounts."
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-ink">Include</legend>
            <Switch label="Uppercase letters A to Z" checked={chars.upper} onChange={(upper) => updateChars({ upper })} />
            <Switch label="Lowercase letters a to z" checked={chars.lower} onChange={(lower) => updateChars({ lower })} />
            <Switch label="Digits 0 to 9" checked={chars.digits} onChange={(digits) => updateChars({ digits })} />
            <Switch label="Symbols like ! @ # $" checked={chars.symbols} onChange={(symbols) => updateChars({ symbols })} />
            <Switch
              label="Avoid look alikes like l, 1, O and 0"
              checked={chars.avoidLookalikes}
              onChange={(avoidLookalikes) => updateChars({ avoidLookalikes })}
            />
          </fieldset>
        </div>
      ) : (
        <div className="grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Slider
              label="Words"
              value={phrase.words}
              min={3}
              max={10}
              onChange={(words) => updatePhrase({ words })}
              valueText={`${phrase.words} words`}
              hint="Six or more words is easy to type and hard to guess."
            />
            <SegmentedControl
              label="Separator"
              options={SEPARATORS}
              value={phrase.separator}
              onChange={(separator) => updatePhrase({ separator })}
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-ink">Style</legend>
            <Switch
              label="Capitalize each word"
              checked={phrase.capitalize}
              onChange={(capitalize) => updatePhrase({ capitalize })}
            />
            <Switch
              label="Add a digit to one word"
              checked={phrase.addNumber}
              onChange={(addNumber) => updatePhrase({ addNumber })}
            />
            <p className="mt-2 text-sm text-muted">
              Words come from the EFF short word list, licensed CC BY 3.0.
            </p>
          </fieldset>
        </div>
      )}
    </ToolPage>
  );
};
