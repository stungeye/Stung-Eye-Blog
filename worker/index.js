// Worker for www.stungeye.com (Phase C, PLAN F35).
//
// Static assets (./_site) and _redirects answer every request they can. This script runs only
// when no asset matches (no run_worker_first), and handles the two kinds of legacy URL that
// _redirects can't express:
//   * unpadded dates from the old CodeIgniter footers: /archive/by_date/2010/9, /2010/01/5
//   * old CodeIgniter item links: /post/view/<id>[/<slug>] (table from tools/build-redirects.mjs)
// It 301s only when the target page exists; everything else gets the assets 404 page.
import postView from "./post-view.json";

const pad = (n) => n.padStart(2, "0");

function legacyTarget(path) {
  let m = path.match(/^\/archive\/by_date\/(\d{4})(?:\/(\d{1,2}))?(?:\/(\d{1,2}))?\/?$/);
  if (m) {
    const [, y, mo, d] = m;
    let t = `/archive/by_date/${y}/`;
    if (mo) t += `${pad(mo)}/`;
    if (mo && d) t += `${pad(d)}/`;
    return t === path ? null : t;
  }
  m = path.match(/^\/post\/view\/(\d+)(?:\/.*)?$/);
  if (m) return postView[m[1]] || null;
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      const target = legacyTarget(url.pathname);
      if (target) {
        const probe = await env.ASSETS.fetch(new Request(new URL(target, url), { method: "HEAD" }));
        if (probe.status === 200) {
          return new Response(null, { status: 301, headers: { Location: target } });
        }
      }
    }
    return env.ASSETS.fetch(request);
  },
};
