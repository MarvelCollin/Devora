import { useEffect, useState } from "react";
import { requestRouteFocus } from "./use-route-focus";

const readRoute = (): string | null => {
  const id = window.location.hash.replace(/^#\/?/, "").trim();
  return id === "" ? null : id;
};

export const routeHref = (id: string | null): string =>
  id ? `#/${id}` : "#/";

export const useHashRoute = (): string | null => {
  const [route, setRoute] = useState<string | null>(readRoute);

  useEffect(() => {
    const handleChange = () => {
      requestRouteFocus();
      setRoute(readRoute());
    };
    window.addEventListener("hashchange", handleChange);
    return () => window.removeEventListener("hashchange", handleChange);
  }, []);

  return route;
};
