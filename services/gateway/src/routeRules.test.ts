import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveRoute, routeRules, pathMatchesPrefix } from "./routeRules.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoutesPath = join(
  __dirname,
  "../../../apps/web/utils/ApiRoutes.ts"
);
const source = readFileSync(apiRoutesPath, "utf8");

/**
 * apps/web/utils/ApiRoutes.ts builds every exported endpoint constant from a
 * `${HOST}/api/...` template literal, often via an intermediate, non-exported base
 * constant (e.g. `const USER_ROUTE = `${HOST}/api/user`;`, then
 * `export const UPDATE_USER = `${USER_ROUTE}/update-user`;`), plus a couple of plain
 * aliases (`export const RESOURCES_API_ROUTE = RESOURCES_ROUTE;`).
 *
 * Rather than pulling in a bundler to import that file for real (it also has a
 * `CHAT_SOCKET_URL` export unrelated to gateway routing), this walks the same two
 * declaration shapes with regex to recover each exported constant's path — the part
 * after HOST — so we can assert every one of them resolves through routeRules.ts.
 */
function extractRoutePaths(src: string): Map<string, string> {
  const knownPaths = new Map<string, string>(); // any const name -> resolved "/api/..." path
  const exported = new Set<string>();

  const templateDeclRe =
    /^(export )?const (\w+) = `\$\{(\w+)\}([^`$]*)`;/gm;
  for (const match of src.matchAll(templateDeclRe)) {
    const [, exportKeyword, name, base, suffix] = match;
    const basePath = base === "HOST" ? "" : knownPaths.get(base);
    if (basePath === undefined) continue; // base not resolved (e.g. depends on a later const)
    knownPaths.set(name, `${basePath}${suffix}`);
    if (exportKeyword) exported.add(name);
  }

  // Plain aliases: `export const NAME = OTHER_CONST;`
  const aliasDeclRe = /^export const (\w+) = (\w+);/gm;
  for (const match of src.matchAll(aliasDeclRe)) {
    const [, name, ref] = match;
    const refPath = knownPaths.get(ref);
    if (refPath === undefined) continue;
    knownPaths.set(name, refPath);
    exported.add(name);
  }

  const result = new Map<string, string>();
  for (const name of exported) {
    const path = knownPaths.get(name);
    if (path && path.startsWith("/api/")) result.set(name, path);
  }
  return result;
}

const routePaths = extractRoutePaths(source);

describe("gateway routeRules", () => {
  test("extracted at least one /api path from apps/web/utils/ApiRoutes.ts", () => {
    // Guards against the regex above silently matching nothing if ApiRoutes.ts is
    // restructured — a passing suite with zero extracted paths would be a false negative.
    expect(routePaths.size).toBeGreaterThan(10);
  });

  test.each([...routePaths.entries()])(
    "%s (%s) resolves to exactly one upstream",
    (_name, path) => {
      const matches = routeRules.filter((rule) =>
        pathMatchesPrefix(path, rule.prefix)
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(resolveRoute(path)).toBe(matches[0]);
    }
  );

  test("the three moved profile paths resolve to identity, not core", () => {
    for (const path of [
      "/api/user/get-user-by-id",
      "/api/user/update-user",
      "/api/user/get-all-users",
    ]) {
      expect(resolveRoute(path)?.upstream).toBe("identity");
    }
  });

  test("everything else on /api/user (community + learning reads + dashboard) resolves to core", () => {
    for (const path of [
      "/api/user/get-all-groups",
      "/api/user/groups/discover",
      "/api/user/groups/joined/1",
      "/api/user/groups/some-group-slug",
      "/api/user/connections/summary/1",
      "/api/user/connect-user-to-mentor",
      "/api/user/connect-user-to-group",
      "/api/user/get-connected-groups/1",
      "/api/user/get-connected-users/1",
      "/api/user/get-unfollowed-mentors/1",
      "/api/user/get-unassociated-groups/1",
      "/api/user/events",
      "/api/user/projects",
      "/api/user/projects/some-project-slug",
      "/api/user/dashboard/1",
    ]) {
      expect(resolveRoute(path)?.upstream).toBe("core");
    }
  });

  test("/api/resources resolves to core, folded in during B07", () => {
    expect(resolveRoute("/api/resources")?.upstream).toBe("core");
    expect(resolveRoute("/api/resources/some-resource-slug")?.upstream).toBe("core");
  });

  test("/api/messages is rewritten to /api/chat on the chat upstream", () => {
    const rule = resolveRoute("/api/messages/get-messages");
    expect(rule?.upstream).toBe("chat");
    expect(rule?.rewriteFrom).toBe("/api/messages");
    expect(rule?.rewriteTo).toBe("/api/chat");
  });

  test("/api/db resolves to identity", () => {
    expect(resolveRoute("/api/db/seed")?.upstream).toBe("identity");
  });

  test("an unknown prefix resolves to nothing", () => {
    expect(resolveRoute("/api/unknown-service/ping")).toBeUndefined();
  });
});
