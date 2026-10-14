import { useEffect, useState } from "react";
import { HiOutlineArchiveBox, HiXMark } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { DropZone } from "../../components/common/drop-zone/drop-zone";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { TextInput } from "../../components/common/text-input/text-input";
import { ColorField } from "../../components/common/color-field/color-field";
import { Slider } from "../../components/common/slider/slider";
import { Switch } from "../../components/common/switch/switch";
import { Button } from "../../components/common/button/button";
import { CodeBlock } from "../../components/common/code-block/code-block";
import { Notice } from "../../components/common/notice/notice";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { HTML_SNIPPET, OUTPUT_SIZES, buildFaviconZip, renderIcon } from "../../services/favicon-service";
import type { IIconSettings } from "../../services/favicon-service";

const DEFAULTS: IIconSettings = {
  source: "text",
  text: "D",
  font: "mono",
  background: "#0f6353",
  transparent: false,
  foreground: "#f6fbf9",
  padding: 10,
  radius: 22,
};

const SOURCES: { value: IIconSettings["source"]; label: string }[] = [
  { value: "text", label: "Letters" },
  { value: "image", label: "Image" },
];

const FONTS: { value: IIconSettings["font"]; label: string }[] = [
  { value: "mono", label: "Mono" },
  { value: "sans", label: "Sans" },
];

const PREVIEW_SIZES = [16, 32, 48, 64, 180];

const TabMock = ({ icon, dark, title }: { icon: string; dark: boolean; title: string }) => (
  <div className={dark ? "rounded-t-lg bg-[#202124] p-2 pb-0" : "rounded-t-lg bg-[#dee1e6] p-2 pb-0"}>
    <div
      className={
        dark
          ? "flex w-56 items-center gap-2 rounded-t-md bg-[#35363a] px-3 py-2 text-xs text-[#e8eaed]"
          : "flex w-56 items-center gap-2 rounded-t-md bg-white px-3 py-2 text-xs text-[#3c4043]"
      }
    >
      <img src={icon} alt="" width={16} height={16} className="h-4 w-4" />
      <span className="flex-1 truncate">{title || "My app"}</span>
      <HiXMark className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
    </div>
  </div>
);

export const FaviconGeneratorPage = () => {
  const [settings, setSettings] = usePersistentState<IIconSettings>("favicon:settings", DEFAULTS);
  const [appName, setAppName] = usePersistentState("favicon:name", "My app");
  const [image, setImage] = useState<{ name: string; element: HTMLImageElement } | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [building, setBuilding] = useState(false);

  const update = (patch: Partial<IIconSettings>) => setSettings({ ...settings, ...patch });
  const activeImage = settings.source === "image" ? image?.element ?? null : null;

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const next: Record<number, string> = {};
      for (const size of PREVIEW_SIZES) next[size] = renderIcon(size, settings, activeImage).toDataURL("image/png");
      setPreviews(next);
    });
    return () => {
      cancelled = true;
    };
  }, [settings, activeImage]);

  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage({ tone: "error", text: `${file.name} is not an image. Use a PNG, JPEG, WebP or SVG file.` });
      return;
    }
    const url = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => {
      setImage({ name: file.name, element });
      setMessage(
        element.naturalWidth < 512 || element.naturalHeight < 512
          ? {
              tone: "info",
              text: `${file.name} is ${element.naturalWidth} × ${element.naturalHeight}. Large icons may look soft. A 512 pixel square image works best.`,
            }
          : null
      );
    };
    element.onerror = () => {
      setMessage({ tone: "error", text: `${file.name} could not be opened. The file may be damaged.` });
      URL.revokeObjectURL(url);
    };
    element.src = url;
  };

  const download = async () => {
    setBuilding(true);
    try {
      await document.fonts.ready;
      const blob = await buildFaviconZip(settings, activeImage, appName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "favicons.zip";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBuilding(false);
    }
  };

  const missingImage = settings.source === "image" && !image;
  const missingText = settings.source === "text" && !settings.text.trim();

  return (
    <ToolPage
      title="Favicon Generator"
      description="Make every icon size a website needs from one image or a few letters, then download them as a ZIP."
      actions={
        <Button
          label="Download ZIP"
          variant="primary"
          icon={HiOutlineArchiveBox}
          onClick={download}
          loading={building}
          disabled={missingImage || missingText}
        />
      }
    >
      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section aria-labelledby="favicon-settings" className="flex flex-col gap-6">
          <h2 id="favicon-settings" className="sr-only">
            Settings
          </h2>
          <SegmentedControl
            label="Make it from"
            options={SOURCES}
            value={settings.source}
            onChange={(source) => update({ source })}
            fullWidth
          />

          {settings.source === "image" ? (
            <>
              <DropZone
                onFiles={(files) => loadImage(files[0])}
                title={image ? `Using ${image.name}` : "Drop your logo here"}
                activeTitle="Release to use this image"
                subtitle="A square image of 512 pixels or more works best"
                buttonLabel={image ? "Choose another" : "Choose an image"}
              />
              <Switch
                label="Transparent background"
                checked={settings.transparent}
                onChange={(transparent) => update({ transparent })}
              />
            </>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <TextInput
                label="Letters"
                hint="Up to 3"
                value={settings.text}
                onChange={(text) => update({ text: Array.from(text).slice(0, 3).join("") })}
                size="lg"
              />
              <SegmentedControl label="Font" options={FONTS} value={settings.font} onChange={(font) => update({ font })} />
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {(settings.source === "text" || !settings.transparent) && (
              <ColorField label="Background" value={settings.background} onChange={(background) => update({ background })} />
            )}
            {settings.source === "text" && (
              <ColorField label="Letter color" value={settings.foreground} onChange={(foreground) => update({ foreground })} />
            )}
          </div>
          <Slider
            label="Padding"
            value={settings.padding}
            min={0}
            max={30}
            onChange={(padding) => update({ padding })}
            valueText={`${settings.padding}%`}
          />
          <Slider
            label="Corner roundness"
            value={settings.radius}
            min={0}
            max={50}
            onChange={(radius) => update({ radius })}
            valueText={settings.radius === 50 ? "Circle" : `${settings.radius}%`}
          />
          <TextInput label="App name" hint="Used in the web manifest" value={appName} onChange={setAppName} />
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
        </section>

        <section aria-labelledby="favicon-preview" className="flex min-w-0 flex-col gap-6">
          <h2 id="favicon-preview" className="text-sm font-medium text-ink">
            Preview
          </h2>
          {missingImage ? (
            <p className="rounded-lg border border-rule bg-surface px-4 py-10 text-center text-muted">
              Add an image on the left to see your icons.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-6 rounded-lg border border-rule bg-surface p-6">
                {PREVIEW_SIZES.map((size) =>
                  previews[size] ? (
                    <figure key={size} className="flex flex-col items-center gap-2">
                      <img
                        src={previews[size]}
                        alt={`Icon at ${size} pixels`}
                        width={Math.min(size, 128)}
                        height={Math.min(size, 128)}
                        style={{ imageRendering: size <= 32 ? "pixelated" : "auto" }}
                      />
                      <figcaption className="font-mono text-xs text-muted">{size}px</figcaption>
                    </figure>
                  ) : null
                )}
              </div>
              {previews[16] && (
                <div className="flex flex-wrap gap-4">
                  <TabMock icon={previews[32]} dark={false} title={appName} />
                  <TabMock icon={previews[32]} dark title={appName} />
                </div>
              )}
            </>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">
              The ZIP has favicon.ico with 16, 32 and 48 pixel sizes, PNG icons for {OUTPUT_SIZES.map((s) => s.size).join(", ")} pixels, and a site.webmanifest. Put them in your site root and add this to the head:
            </p>
            <CodeBlock label="HTML" code={HTML_SNIPPET} />
          </div>
        </section>
      </div>
    </ToolPage>
  );
};
