// Captura, persiste e recupera parâmetros UTM da URL
const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
const STORAGE_KEY = "lv_utms";

export type Utms = Record<(typeof KEYS)[number], string>;

const empty = (): Utms => ({
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
});

export function captureUtms(): Utms {
  if (typeof window === "undefined") return empty();
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utms = empty();
  let hasAny = false;
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) {
      fromUrl[k] = v;
      hasAny = true;
    }
  }
  if (hasAny) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return { ...empty(), ...JSON.parse(stored) };
  } catch {
    /* ignore */
  }
  return empty();
}
