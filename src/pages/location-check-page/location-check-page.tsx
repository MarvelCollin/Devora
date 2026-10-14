import { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineMapPin, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { Button } from "../../components/common/button/button";
import { Switch } from "../../components/common/switch/switch";
import { Notice } from "../../components/common/notice/notice";
import { SummaryStrip } from "../../components/common/summary-strip/summary-strip";
import { ValueList } from "../../components/common/value-list/value-list";
import type { IValueRow } from "../../components/common/value-list/value-list";
import { CopyButton } from "../../components/common/copy-button/copy-button";

interface IFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  speed: number | null;
  heading: number | null;
  time: Date;
}

const toFix = (position: GeolocationPosition): IFix => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy,
  altitude: position.coords.altitude,
  altitudeAccuracy: position.coords.altitudeAccuracy,
  speed: position.coords.speed,
  heading: position.coords.heading,
  time: new Date(position.timestamp),
});

const toDms = (value: number, positive: string, negative: string) => {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = ((minutesFull - minutes) * 60).toFixed(1);
  return `${degrees}° ${minutes}′ ${seconds}″ ${value >= 0 ? positive : negative}`;
};

const distanceMeters = (a: IFix, b: IFix) => {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
};

const accuracyVerdict = (meters: number) => {
  if (meters <= 20) return "GPS level, very precise";
  if (meters <= 100) return "Wi-Fi level, good for a street";
  if (meters <= 1000) return "Rough, about your neighborhood";
  return "Very rough, about your city";
};

const COMPASS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];

const describeError = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location access was blocked. Click the location icon in the address bar, allow access, then try again. On a phone, also check that location is on in system settings.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your device could not find its location. Turn on location services or Wi-Fi, or move closer to a window, then try again.";
  }
  return "Finding your location took too long. Try again, or step outside for a better GPS signal.";
};

export const LocationCheckPage = () => {
  const [fix, setFix] = useState<IFix | null>(null);
  const [first, setFirst] = useState<IFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);
  const [watching, setWatching] = useState(false);
  const [updates, setUpdates] = useState(0);
  const watchRef = useRef<number | null>(null);
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const stopWatching = useCallback(() => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setWatching(false);
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  const accept = (position: GeolocationPosition) => {
    const next = toFix(position);
    setFix(next);
    setFirst((previous) => previous ?? next);
    setUpdates((count) => count + 1);
    setError(null);
    setFinding(false);
  };

  const fail = (failure: GeolocationPositionError) => {
    setError(describeError(failure));
    setFinding(false);
    stopWatching();
  };

  const findOnce = () => {
    setFinding(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(accept, fail, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };

  const toggleWatch = (on: boolean) => {
    if (!on) {
      stopWatching();
      return;
    }
    setFinding(true);
    setFirst(null);
    setUpdates(0);
    watchRef.current = navigator.geolocation.watchPosition(accept, fail, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });
    setWatching(true);
  };

  const coords = fix ? `${fix.latitude.toFixed(6)}, ${fix.longitude.toFixed(6)}` : "";
  const moved = fix && first && watching ? distanceMeters(first, fix) : null;
  const mapUrl = fix
    ? `https://www.openstreetmap.org/?mlat=${fix.latitude.toFixed(6)}&mlon=${fix.longitude.toFixed(6)}#map=17/${fix.latitude.toFixed(6)}/${fix.longitude.toFixed(6)}`
    : "";

  const rows: IValueRow[] = fix
    ? [
        { label: "Latitude", value: fix.latitude.toFixed(6), note: toDms(fix.latitude, "N", "S") },
        { label: "Longitude", value: fix.longitude.toFixed(6), note: toDms(fix.longitude, "E", "W") },
        {
          label: "Altitude",
          value: fix.altitude === null ? "Not reported" : `${Math.round(fix.altitude)} m`,
          note: fix.altitudeAccuracy ? `Give or take ${Math.round(fix.altitudeAccuracy)} m` : "Usually only reported by GPS",
          copy: false,
        },
        {
          label: "Speed",
          value: fix.speed === null ? "Not reported" : `${(fix.speed * 3.6).toFixed(1)} km/h`,
          copy: false,
        },
        {
          label: "Heading",
          value:
            fix.heading === null || Number.isNaN(fix.heading)
              ? "Not reported"
              : `${Math.round(fix.heading)}°, ${COMPASS[Math.round(fix.heading / 45) % 8]}`,
          note: "Only known while you are moving",
          copy: false,
        },
        { label: "Last update", value: fix.time.toLocaleTimeString(), copy: false },
      ]
    : [];

  return (
    <ToolPage
      title="Location Check"
      description="Check that location permission and GPS work, and see how precise your device's position is. Your location stays on this device."
      actions={
        supported && (
          <Button label="Find my location" variant="primary" icon={HiOutlineMapPin} onClick={findOnce} loading={finding && !watching} />
        )
      }
    >
      {!supported ? (
        <Notice tone="error">This browser cannot share a location. Try a recent Chrome, Edge, Firefox or Safari.</Notice>
      ) : (
        <>
          <Switch label="Keep updating as I move" checked={watching} onChange={toggleWatch} />
          {error && (
            <Notice tone="error" action={<Button label="Try again" variant="secondary" size="sm" onClick={findOnce} />}>
              {error}
            </Notice>
          )}

          {fix ? (
            <>
              <section aria-labelledby="coords-heading" className="flex flex-col gap-2">
                <h2 id="coords-heading" className="text-sm text-muted">
                  Your coordinates
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{coords}</p>
                  <CopyButton value={coords} variant="secondary" />
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-strong hover:bg-tint"
                  >
                    Open in OpenStreetMap
                    <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </section>
              <SummaryStrip
                label="Location quality"
                items={[
                  {
                    label: "Accuracy",
                    value: `± ${Math.round(fix.accuracy).toLocaleString()} m`,
                    context: accuracyVerdict(fix.accuracy),
                    lead: true,
                  },
                  ...(watching
                    ? [
                        { label: "Updates", value: updates, context: "Since you turned on live updates" },
                        { label: "Moved", value: moved === null ? "0 m" : `${Math.round(moved)} m`, context: "From the first reading" },
                      ]
                    : []),
                ]}
              />
              <ValueList rows={rows} />
            </>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-lg border border-rule bg-surface px-6 py-10">
              <p className="font-medium text-ink">{finding ? "Finding your location" : "No location yet"}</p>
              <p className="max-w-prose text-muted">
                {finding
                  ? "Your browser may ask for permission first. Outdoors, GPS can take up to a minute to lock on."
                  : "Press Find my location. Your browser will ask for permission before sharing anything."}
              </p>
            </div>
          )}
          <p className="text-sm text-muted">
            Nothing is sent anywhere. The map link only opens OpenStreetMap if you click it.
          </p>
        </>
      )}
    </ToolPage>
  );
};
