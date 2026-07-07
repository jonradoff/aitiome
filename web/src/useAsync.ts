import { useEffect, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): T | null {
  const [val, setVal] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    fn().then((v) => {
      if (alive) setVal(v);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return val;
}
