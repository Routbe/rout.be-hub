import eyouSvg from "@/assets/brand/eyou.svg?raw";
import mastodonSvg from "@/assets/brand/mastodon.svg?raw";
import keycloakSvg from "@/assets/brand/keycloak.svg?raw";

/**
 * Third-party brand marks, bundled at build time and inlined as data URIs.
 *
 * These are consumed as CSS mask images, so the shape inherits `currentColor`
 * and the original brand colour is discarded. Inlining (instead of hot-linking
 * the vendor URL) guarantees there is no unstyled flash or missing icon on slow
 * or offline connections — the mask ships inside the CSS-in-JS style value.
 */
const toDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;

export const BRAND_MARKS = {
  eyou: toDataUri(eyouSvg),
  mastodon: toDataUri(mastodonSvg),
  keycloak: toDataUri(keycloakSvg),
} as const;
