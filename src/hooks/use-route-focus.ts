import { useEffect, useRef } from "react";

let pendingFocus = false;

export const requestRouteFocus = () => {
  pendingFocus = true;
};

export const useRouteFocus = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!pendingFocus) return;
    pendingFocus = false;
    ref.current?.focus();
  }, []);

  return ref;
};
