import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Live test of https://<handle>.rout.be/.well-known/atproto-did — run on the
 * server so the dashboard is not blocked by cross-origin rules.
 */
export const testAtprotoDid = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        handle: z
          .string()
          .trim()
          .min(1)
          .max(63)
          .regex(/^[a-z0-9-]+$/),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const url = `https://${data.handle}.rout.be/.well-known/atproto-did`;
    try {
      const res = await fetch(url, { headers: { accept: "text/plain" } });
      const body = (await res.text()).trim().slice(0, 200);
      return {
        url,
        ok: res.ok && body.startsWith("did:"),
        status: res.status,
        body,
      };
    } catch (error) {
      return {
        url,
        ok: false,
        status: 0,
        body: error instanceof Error ? error.message : "Request failed",
      };
    }
  });
