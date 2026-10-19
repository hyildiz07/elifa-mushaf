(() => {
  // src/hatim-client.mjs
  function secret(crypto2) {
    return Array.from(crypto2.getRandomValues(new Uint8Array(32)), (v) => v.toString(16).padStart(2, "0")).join("");
  }
  var returnKeyPattern = /^[0-9A-HJKMNP-TV-Z]{20}$/i;
  var validCapability = (value) => typeof value === "string" && (/^[a-f0-9]{64}$/i.test(value) || returnKeyPattern.test(value));
  var normalizeCapability = (value) => returnKeyPattern.test(value) ? value.toUpperCase() : value.toLowerCase();
  function personalReturnCode(code, no, key2) {
    if (!/^[a-z0-9]{6}$/.test(code) || !Number.isInteger(no) || no < 1 || no > 30 || !returnKeyPattern.test(key2)) throw Error("Ki\u015Fisel d\xF6n\xFC\u015F kodu haz\u0131rlanamad\u0131.");
    return ["C1", code.toUpperCase(), String(no).padStart(2, "0"), ...key2.toUpperCase().match(/.{5}/g)].join("-");
  }
  function dueText(date, now = /* @__PURE__ */ new Date()) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const [y, m, d] = date.split("-").map(Number), end = Date.UTC(y, m - 1, d), day = new Date(end);
    if (day.getUTCFullYear() !== y || day.getUTCMonth() !== m - 1 || day.getUTCDate() !== d) return "";
    const days = Math.round((end - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    return days < 0 ? "Hedef tarih ge\xE7ti" : days === 0 ? "Hedef bug\xFCn" : days === 1 ? "Hedef yar\u0131n" : days + " g\xFCn kald\u0131";
  }
  function parseHatimLink(value, base2 = "https://mushaf.elifaplatform.com/") {
    const v = String(value || "").trim();
    if (/^[a-z0-9]{6}$/.test(v)) return { code: v };
    const compact = v.toUpperCase().replace(/[\s\u2010-\u2015-]/g, "");
    const personal = /^C1([A-Z0-9]{6})(0[1-9]|[12][0-9]|30)([0-9A-HJKMNP-TV-Z]{20})$/.exec(compact);
    if (personal) return { code: personal[1].toLowerCase(), no: Number(personal[2]), capability: personal[3] };
    if (/^C1/i.test(v)) return null;
    let u;
    try {
      u = new URL(v, base2);
    } catch {
      return null;
    }
    if (["hatim", "cuz", "key", "capability", "token", "adminToken", "admin"].some((name) => u.searchParams.has(name))) return null;
    const recovery = new URLSearchParams(u.hash.slice(1));
    if ((recovery.has("cuz") || recovery.has("key")) && !recovery.has("hatim")) return null;
    if (recovery.has("hatim")) {
      const code2 = recovery.get("hatim"), no = Number(recovery.get("cuz")), capability = recovery.get("key");
      if (/^[a-z0-9]{6}$/.test(code2) && Number.isInteger(no) && no >= 1 && no <= 30 && (/^[a-f0-9]{64}$/.test(capability) || returnKeyPattern.test(capability))) return { code: code2, no, capability: normalizeCapability(capability) };
      return null;
    }
    const admin = recovery.get("yonetim") || u.searchParams.get("y"), code = u.searchParams.get("k");
    if (admin && /^(?:[a-z0-9]{12}|[a-z0-9]{32})$/.test(admin)) return { admin };
    if (recovery.has("yonetim") || u.searchParams.has("y")) return null;
    return code && /^[a-z0-9]{6}$/.test(code) ? { code } : null;
  }
  function participationUrl(base2, code) {
    const u = new URL(base2);
    u.search = "";
    u.hash = "";
    u.searchParams.set("k", code);
    return u.href;
  }
  function recoveryUrl(base2, code, no, key2) {
    const u = new URL(base2);
    u.search = "";
    u.hash = new URLSearchParams({ hatim: code, cuz: String(no), key: key2 }).toString();
    return u.href;
  }
  function adminUrl(base2, key2) {
    const u = new URL(base2);
    u.search = "";
    u.hash = new URLSearchParams({ yonetim: key2 }).toString();
    return u.href;
  }
  function canonicalHatimUrl(value, code = null) {
    const u = new URL(value);
    if (code !== null && !/^[a-z0-9]{6}$/.test(code)) throw Error("Hatim kodu ge\xE7ersiz.");
    for (const key2 of ["k", "y", "admin", "adminToken", "key", "token", "capability", "hatim", "cuz", "yonetim"]) u.searchParams.delete(key2);
    u.hash = "";
    if (code !== null) u.searchParams.set("k", code);
    return u.href;
  }
  function loadLocal(storage2, key2) {
    const plain = (v) => v && typeof v === "object" && !Array.isArray(v);
    const code = (v) => typeof v === "string" && /^[a-z0-9]{6}$/.test(v);
    const cap = (v) => typeof v === "string" && /^[a-f0-9]{64}$/i.test(v);
    const maps = (value, convert) => {
      const out = {};
      if (plain(value)) for (const [key3, item] of Object.entries(value).slice(0, 2e3)) {
        if (!code(key3)) continue;
        const clean = convert(item);
        if (clean !== void 0) out[key3] = clean;
      }
      return out;
    };
    const tokenMap = (value) => {
      if (!plain(value)) return void 0;
      const out = {};
      for (const [n, t] of Object.entries(value)) if (/^[0-9]{1,2}$/.test(n) && +n >= 1 && +n <= 30 && validCapability(t)) out[n] = normalizeCapability(t);
      return out;
    };
    const operationMap = (value) => {
      if (!plain(value)) return void 0;
      const out = {};
      for (const [n, item] of Object.entries(value)) if (/^[0-9]{1,2}$/.test(n) && +n >= 1 && +n <= 30 && plain(item) && cap(item.token)) out[n] = { token: item.token.toLowerCase(), name: typeof item.name === "string" ? item.name.slice(0, 60) : "", confirmed: item.confirmed === true, createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0 };
      return out;
    };
    const empty = () => ({ mine: [], myName: "", pending: {}, claimed: {}, capabilities: {}, snapshots: {}, pendingClaims: {}, pendingRecovery: {}, guestWarned: false, creation: null });
    try {
      const x = JSON.parse(storage2.getItem(key2) || "null");
      if (!plain(x)) return empty();
      const mine = Array.isArray(x.mine) ? x.mine.filter((m) => plain(m) && code(m.code)).slice(0, 2e3).map((m) => ({ code: m.code, title: typeof m.title === "string" ? m.title.slice(0, 120) : "Hatim", type: m.type === "zikir" ? "zikir" : "hatim", ...typeof m.adminToken === "string" && /^(?:[a-z0-9]{12}|[a-z0-9]{32})$/.test(m.adminToken) ? { adminToken: m.adminToken } : {}, pending: m.pending === true })) : [];
      const creation = plain(x.creation) && cap(x.creation.token) ? { token: x.creation.token.toLowerCase(), title: typeof x.creation.title === "string" ? x.creation.title.slice(0, 120) : "", name: typeof x.creation.name === "string" ? x.creation.name.slice(0, 60) : "", dueDate: typeof x.creation.dueDate === "string" ? x.creation.dueDate : "", public: x.creation.public === true, ...typeof x.creation.signature === "string" ? { signature: x.creation.signature } : {} } : null;
      return { mine, myName: typeof x.myName === "string" ? x.myName.slice(0, 60) : "", pending: maps(x.pending, (v) => Number.isFinite(v) && v >= 0 ? v : void 0), claimed: maps(x.claimed, (v) => Array.isArray(v) ? [...new Set(v.filter((n) => Number.isInteger(n) && n >= 1 && n <= 30))] : void 0), capabilities: maps(x.capabilities, tokenMap), pendingClaims: maps(x.pendingClaims, operationMap), pendingRecovery: maps(x.pendingRecovery, operationMap), snapshots: maps(x.snapshots, (v) => plain(v) ? { title: typeof v.title === "string" ? v.title.slice(0, 120) : "", type: v.type === "zikir" ? "zikir" : "hatim", isAdmin: v.isAdmin === true, archived: v.archived === true, updatedAt: Number.isFinite(v.updatedAt) ? v.updatedAt : 0, items: Array.isArray(v.items) ? v.items.filter((i) => plain(i) && Number.isInteger(i.no) && i.no >= 1 && i.no <= 30 && ["alindi", "okundu"].includes(i.status)).slice(0, 30).map((i) => ({ no: i.no, status: i.status, mine: true })) : [] } : void 0), guestWarned: x.guestWarned === true, creation };
    } catch {
      return empty();
    }
  }
  function createOrgClient({ fetcher, session: session2, base: base2 = "", onError }) {
    return async function api2(payload2) {
      const user2 = session2()?.getUser(), uid = user2?.uid || null, headers = { "Content-Type": "application/json" };
      if (uid) {
        const token = await session2().getIdToken();
        if (!token || session2()?.getUser()?.uid !== uid) throw Error("Hesap de\u011Fi\u015Fti. \u0130\u015Flemi yeniden a\xE7.");
        headers.Authorization = "Bearer " + token;
        payload2 = { ...payload2, expectedUser: uid };
      }
      let result, data;
      try {
        result = await fetcher(base2 + "/api/org", { method: "POST", headers, body: JSON.stringify(payload2), signal: AbortSignal.timeout(2e4) });
        data = await result.json();
      } catch {
        throw Error("Sunucuya ula\u015F\u0131lamad\u0131. \u0130\u015Flem kaydedildi say\u0131lmad\u0131; durumunu kontrol edip yeniden dene.");
      }
      if ((session2()?.getUser()?.uid || null) !== uid) throw Error("Hesap de\u011Fi\u015Fti. \u0130\u015Flemi yeniden a\xE7.");
      if (!result.ok) {
        const e = Object.assign(Error(data.error || "\u0130\u015Flem tamamlanamad\u0131."), { status: result.status });
        onError?.(e);
        throw e;
      }
      if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("Sunucu yan\u0131t\u0131 ge\xE7ersiz. \u0130\u015Flem durumunu yenileyerek kontrol et.");
      if (data.org && typeof data.org === "object" && !Array.isArray(data.org)) {
        const code = data.code || data.org.code;
        if (!/^[a-z0-9]{6}$/.test(code || "")) throw Error("Hatim yan\u0131t\u0131nda ge\xE7erli kod yok.");
        data = { ...data, code, org: { ...data.org, code } };
      }
      return data;
    };
  }

  // src/hatim-report.mjs
  var escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var labels = { bos: "Bo\u015F", alindi: "Okunacak", okundu: "Okundu" };
  var defaults = { paper: "#fffaf0", ink: "#15334c", muted: "#67717a", accent: "#a47a28", line: "#d9ca9f" };
  function dateLabel(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const d = /* @__PURE__ */ new Date(value + "T00:00:00Z");
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === value ? d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
  }
  function hatimReportData(org, { now = /* @__PURE__ */ new Date() } = {}) {
    if (!org || org.type !== "hatim" || !Array.isArray(org.items) || !org.items.length || org.items.length > 30) throw Error("Raporlanacak c\xFCz \xE7al\u0131\u015Fmas\u0131 bulunamad\u0131.");
    const items = org.items.map((item) => {
      if (!item || !Number.isInteger(item.no) || item.no < 1 || item.no > 30 || !Object.hasOwn(labels, item.status)) throw Error("C\xFCz bilgileri ge\xE7ersiz; rapor i\xE7in listeyi yenile.");
      return { no: item.no, name: typeof item.name === "string" ? item.name.trim().slice(0, 60) : "", status: item.status, label: labels[item.status] };
    }).sort((a, b) => a.no - b.no);
    if (new Set(items.map((x) => x.no)).size !== items.length) throw Error("C\xFCz listesi tekrarl\u0131; rapor i\xE7in listeyi yenile.");
    const full = items.length === 30 && items.every((item, i) => item.no === i + 1);
    const done = items.filter((x) => x.status === "okundu").length, available = items.filter((x) => x.status === "bos").length;
    const complete = done === items.length;
    const summary = full ? complete ? "30 c\xFCz\xFCn tamam\u0131 okundu olarak i\u015Faretlendi. Hatim tamamland\u0131." : `30 c\xFCz\xFCn ${done}\u2019i okundu; hatim devam ediyor.` : complete ? `Se\xE7ilen ${items.length} c\xFCzl\xFCk \xE7al\u0131\u015Fma tamamland\u0131.` : `Se\xE7ilen ${items.length} c\xFCz\xFCn ${done}\u2019i okundu; \xE7al\u0131\u015Fma devam ediyor.`;
    return {
      title: String(org.title || "Birlikte Hatim").trim().slice(0, 120),
      code: /^[a-z0-9]{6}$/.test(org.code) ? org.code : "",
      adminName: typeof org.adminName === "string" ? org.adminName.trim().slice(0, 60) : "",
      heading: full ? "Hatim raporu" : "C\xFCz \xE7al\u0131\u015Fmas\u0131 raporu",
      items,
      total: items.length,
      done,
      available,
      taken: items.length - available,
      full,
      complete,
      summary,
      date: new Date(now).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
      dueDate: dateLabel(org.dueDate),
      note: "Durumlar kat\u0131l\u0131mc\u0131lar\u0131n bildirimlerine g\xF6re g\xF6sterilir."
    };
  }
  function themeColors(doc) {
    const css = doc?.defaultView?.getComputedStyle?.(doc.documentElement);
    const keys = { paper: "--zemin", ink: "--ink", muted: "--muted", accent: "--yildiz", line: "--line" };
    const safe = (value) => /^(?:#[\da-f]{3,8}|[a-z]+|(?:rgb|hsl)a?\([\d\s.,%/deg+-]+\))$/i.test(value);
    return Object.fromEntries(Object.entries(keys).map(([key2, name]) => {
      const value = css?.getPropertyValue(name)?.trim();
      return [key2, value && safe(value) ? value : defaults[key2]];
    }));
  }
  function wrap(ctx, value, width) {
    const lines = [];
    let line = "";
    for (const word of String(value || "").split(/\s+/).filter(Boolean)) {
      if (ctx.measureText(word).width > width) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let part = "";
        for (const char of word) {
          if (part && ctx.measureText(part + char).width > width) {
            lines.push(part);
            part = "";
          }
          part += char;
        }
        line = part;
        continue;
      }
      const next = line ? line + " " + word : word;
      if (line && ctx.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }
  async function renderHatimReportCanvas(org, { document: doc = globalThis.document, now = /* @__PURE__ */ new Date() } = {}) {
    const data = hatimReportData(org, { now }), colors = themeColors(doc);
    try {
      await Promise.all([doc.fonts?.load("600 56px Lora"), doc.fonts?.load("500 26px Outfit")]);
    } catch {
    }
    const canvas = doc.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 100;
    let ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Bu taray\u0131c\u0131 rapor g\xF6rseli olu\u015Fturam\u0131yor.");
    const W = 1080, pad = 72, gap = 42, col = (W - pad * 2 - gap) / 2;
    ctx.font = "600 56px Lora, Georgia, serif";
    const titleLines = wrap(ctx, data.title, W - pad * 2);
    ctx.font = "400 27px Outfit, Arial, sans-serif";
    const summaryLines = wrap(ctx, data.summary, W - pad * 2);
    ctx.font = "500 25px Outfit, Arial, sans-serif";
    const half = Math.ceil(data.items.length / 2), rows = [];
    for (let row = 0; row < half; row++) {
      const cells = [data.items[row], data.items[row + half]].map((item) => item ? { ...item, lines: wrap(ctx, item.no + ". c\xFCz \u2014 " + (item.name || "Hen\xFCz se\xE7ilmedi"), col - 24) } : null);
      rows.push({ cells, height: Math.max(...cells.filter(Boolean).map((x) => x.lines.length)) * 32 + 53 });
    }
    const summaryY = 144 + titleLines.length * 68 + 62, tableY = summaryY + summaryLines.length * 36 + 113;
    const footerY = tableY + rows.reduce((n, row) => n + row.height, 0) + 40;
    canvas.height = footerY + 158;
    ctx = canvas.getContext("2d");
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, W, canvas.height);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, canvas.height - 48);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(38, 38, W - 76, canvas.height - 76);
    ctx.textAlign = "center";
    ctx.fillStyle = colors.accent;
    ctx.font = "600 23px Outfit, Arial, sans-serif";
    ctx.fillText("ELIFA \xB7 B\u0130RL\u0130KTE HAT\u0130M", W / 2, 94);
    ctx.fillStyle = colors.ink;
    ctx.font = "600 56px Lora, Georgia, serif";
    titleLines.forEach((line, i) => ctx.fillText(line, W / 2, 160 + i * 68));
    ctx.fillStyle = colors.muted;
    ctx.font = "400 23px Outfit, Arial, sans-serif";
    if (data.adminName) ctx.fillText("Y\xF6netici: " + data.adminName, W / 2, summaryY - 70);
    const metadata = [data.heading, data.date, data.dueDate ? "Hedef: " + data.dueDate : ""].filter(Boolean).join(" \xB7 ");
    ctx.fillText(metadata, W / 2, summaryY - 40);
    ctx.fillStyle = colors.accent;
    ctx.font = "700 62px Outfit, Arial, sans-serif";
    ctx.fillText(data.done + " / " + data.total, W / 2, summaryY + 28);
    ctx.fillStyle = colors.ink;
    ctx.font = "400 27px Outfit, Arial, sans-serif";
    summaryLines.forEach((line, i) => ctx.fillText(line, W / 2, summaryY + 78 + i * 36));
    ctx.textAlign = "left";
    ctx.font = "600 30px Lora, Georgia, serif";
    ctx.fillText("Kat\u0131l\u0131mc\u0131lar ve c\xFCz durumu", pad, tableY - 25);
    let y = tableY;
    for (const row of rows) {
      row.cells.forEach((cell, i) => {
        if (!cell) return;
        const x = pad + i * (col + gap);
        ctx.strokeStyle = colors.line;
        ctx.beginPath();
        ctx.moveTo(x, y + row.height - 11);
        ctx.lineTo(x + col, y + row.height - 11);
        ctx.stroke();
        ctx.fillStyle = colors.ink;
        ctx.font = "500 25px Outfit, Arial, sans-serif";
        cell.lines.forEach((line, k) => ctx.fillText(line, x + 4, y + 27 + k * 32));
        ctx.fillStyle = cell.status === "okundu" ? colors.accent : colors.muted;
        ctx.font = "400 22px Outfit, Arial, sans-serif";
        ctx.fillText(cell.label, x + 4, y + cell.lines.length * 32 + 25);
      });
      y += row.height;
    }
    ctx.textAlign = "center";
    ctx.fillStyle = colors.accent;
    ctx.font = "600 38px Lora, Georgia, serif";
    ctx.fillText("Allah kabul etsin", W / 2, footerY + 32);
    ctx.fillStyle = colors.muted;
    ctx.font = "400 21px Outfit, Arial, sans-serif";
    ctx.fillText(data.note, W / 2, footerY + 76);
    ctx.font = "500 18px Outfit, Arial, sans-serif";
    ctx.fillText("ELIFAPLATFORM.COM" + (data.code ? " \xB7 " + data.code : ""), W / 2, footerY + 113);
    return canvas;
  }
  function hatimReportHtml(org, { now = /* @__PURE__ */ new Date() } = {}) {
    const d = hatimReportData(org, { now });
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(d.heading)} \u2014 ${escape(d.title)}</title><style>
 @page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;background:#f2f1ed;color:#15334c;font:14px Arial,sans-serif}.report{max-width:800px;margin:16px auto;padding:30px;background:#fffef9;border:1px solid #d9ca9f}header{text-align:center;border-bottom:1px solid #d9ca9f;padding-bottom:18px}.brand{color:#a47a28;letter-spacing:2px;font-size:12px}h1{font:600 30px Georgia,serif;overflow-wrap:anywhere;margin:15px 0 10px}.meta,.note{color:#5c6670;font-size:12px}.score{color:#946c21;font:bold 36px Georgia,serif;margin:14px 0 8px}.summary{margin:8px 0}h2{font:600 20px Georgia,serif}table{width:100%;border-collapse:collapse}thead{display:table-header-group}th{text-align:left;background:#f5f0e3}th,td{padding:7px 9px;border-bottom:1px solid #e3d9c1;vertical-align:top;overflow-wrap:anywhere}td:first-child{width:65px}td:last-child{width:105px}tr{break-inside:avoid}.done{color:#86611b;font-weight:bold}footer{text-align:center;margin-top:22px}.blessing{font:600 22px Georgia,serif;color:#946c21}@media print{body{background:white}.report{margin:0;max-width:none;border:0;padding:0}h1{font-size:26px}th,td{padding:5px 8px}.note{font-size:11px}}
 </style></head><body><main class="report" id="reportRoot"><header><div class="brand">ELIFA \xB7 B\u0130RL\u0130KTE HAT\u0130M</div><h1>${escape(d.title)}</h1><div class="meta">${escape(d.heading)} \xB7 ${escape(d.date)}${d.dueDate ? " \xB7 Hedef: " + escape(d.dueDate) : ""}</div>${d.adminName ? '<p class="meta">Y\xF6netici: ' + escape(d.adminName) + "</p>" : ""}<div class="score">${d.done} / ${d.total}</div><p class="summary">${escape(d.summary)}</p></header><h2>Kat\u0131l\u0131mc\u0131lar ve c\xFCz durumu</h2><table><thead><tr><th>C\xFCz</th><th>G\xF6r\xFCnen ad</th><th>Durum</th></tr></thead><tbody>${d.items.map((i) => `<tr><td>${i.no}.</td><td>${escape(i.name || "Hen\xFCz se\xE7ilmedi")}</td><td class="${i.status === "okundu" ? "done" : ""}">${escape(i.label)}</td></tr>`).join("")}</tbody></table><footer><p class="blessing">Allah kabul etsin</p><p class="note">${escape(d.note)}</p><p class="note">ELIFAPLATFORM.COM${d.code ? " \xB7 " + escape(d.code) : ""}</p></footer></main></body></html>`;
  }
  function pdfPreview(org, { document: doc, now }) {
    doc.getElementById("elifaHatimReportPreview")?.remove();
    const colors = themeColors(doc), dialog2 = doc.createElement("dialog");
    dialog2.id = "elifaHatimReportPreview";
    dialog2.setAttribute("aria-label", "Hatim raporu \xB7 PDF \xF6nizleme");
    dialog2.style.cssText = `width:min(900px,96vw);height:min(900px,94dvh);max-height:94dvh;border:1px solid ${colors.line};border-radius:18px;padding:14px;color:${colors.ink};background:${colors.paper};`;
    const header = doc.createElement("header");
    header.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px";
    const heading = doc.createElement("strong");
    heading.textContent = "Rapor \xB7 PDF olarak kaydet";
    const close = doc.createElement("button");
    close.type = "button";
    close.textContent = "Kapat";
    close.addEventListener("click", () => dialog2.close());
    header.append(heading, close);
    const note = doc.createElement("p");
    note.textContent = "Yazd\u0131rma penceresinde \u201CPDF olarak kaydet\u201D se\xE7ene\u011Fini kullanabilirsin.";
    note.style.cssText = "font-size:13px;margin:8px 0";
    const frame = doc.createElement("iframe");
    frame.title = "Hatim raporu \xF6nizlemesi";
    frame.style.cssText = "width:100%;height:calc(100% - 125px);min-height:240px;border:1px solid " + colors.line + ";border-radius:8px;background:white";
    const print = doc.createElement("button");
    print.type = "button";
    print.textContent = "Yazd\u0131r / PDF olarak kaydet";
    print.disabled = true;
    print.style.cssText = `width:100%;padding:12px;margin-top:10px;border-radius:10px;border:1px solid ${colors.accent};background:${colors.paper};color:${colors.ink};font-weight:700`;
    frame.addEventListener("load", () => {
      print.disabled = !frame.contentDocument?.getElementById("reportRoot");
    });
    print.addEventListener("click", () => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch {
        note.textContent = "Yazd\u0131rma a\xE7\u0131lamad\u0131. Bu raporu PNG olarak indirebilirsin.";
      }
    });
    dialog2.addEventListener("close", () => dialog2.remove(), { once: true });
    dialog2.append(header, note, frame, print);
    doc.body.append(dialog2);
    frame.srcdoc = hatimReportHtml(org, { now });
    dialog2.showModal();
    return { format: "pdf", preview: true };
  }
  async function downloadHatimReport(org, { format = "png", document: doc = globalThis.document, window: win = globalThis.window, now = /* @__PURE__ */ new Date() } = {}) {
    if (!["png", "pdf"].includes(format)) throw Error("Desteklenmeyen rapor bi\xE7imi.");
    const data = hatimReportData(org, { now });
    if (format === "pdf") return pdfPreview(org, { document: doc, now });
    const canvas = await renderHatimReportCanvas(org, { document: doc, now });
    const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(Error("Rapor g\xF6rseli olu\u015Fturulamad\u0131.")), "image/png"));
    const url = win.URL.createObjectURL(blob), anchor = doc.createElement("a");
    anchor.download = "hatim-raporu-" + (data.code || "elifa") + ".png";
    anchor.href = url;
    doc.body.append(anchor);
    anchor.click();
    anchor.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(url), 1e3);
    return { format: "png", downloaded: true };
  }

  // src/hatim-community.mjs
  var $ = (id) => document.getElementById(id);
  var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var base = () => window.ELIFA_PUBLIC_BASE || location.origin + "/";
  var session = () => window.elifaAccountSession;
  var user = () => session()?.getUser() || null;
  var legacyKey = "elifa_birlikte_v1";
  var guestKey = "elifa_hatim_guest_v2";
  var storage;
  try {
    storage = window.localStorage;
  } catch {
    storage = { getItem() {
      return null;
    }, setItem() {
      throw Error("Depolama kullan\u0131lam\u0131yor");
    } };
  }
  var owner = user()?.uid || null;
  var key = owner ? "elifa_hatim_user_" + owner : guestKey;
  var local = loadLocal(storage, key);
  var generation = 0;
  var listGeneration = 0;
  var tab = "open";
  var discover = [];
  var accountItems = [];
  var discoverEnabled = null;
  var loading = false;
  var error = "";
  var refreshing = false;
  var current = null;
  var createDraft = null;
  var pendingAction = false;
  var dialogIdentity = 0;
  var activeAction = null;
  var pendingConnectionKey = "elifa_hatim_pending_connection_v1";
  var pendingConnection = null;
  var pendingConnectionPersisted = false;
  var connectionAttempt = 0;
  function connectionStore() {
    return window.sessionStorage;
  }
  function stageConnection(parsed) {
    pendingConnection = parsed;
    pendingConnectionPersisted = false;
    try {
      const target = connectionStore(), raw = JSON.stringify(parsed);
      target.setItem(pendingConnectionKey, raw);
      pendingConnectionPersisted = target.getItem(pendingConnectionKey) === raw;
    } catch {
    }
  }
  function readPendingConnection() {
    try {
      const value = JSON.parse(connectionStore().getItem(pendingConnectionKey) || "null");
      if (!value || typeof value !== "object") return null;
      return value.admin ? parseHatimLink(adminUrl(base(), value.admin)) : value.capability ? parseHatimLink(recoveryUrl(base(), value.code, value.no, value.capability)) : parseHatimLink(value.code);
    } catch {
      return null;
    }
  }
  function completeConnection(parsed) {
    if (!pendingConnection || JSON.stringify(pendingConnection) !== JSON.stringify(parsed)) return;
    pendingConnection = null;
    pendingConnectionPersisted = false;
    try {
      connectionStore().removeItem(pendingConnectionKey);
    } catch {
    }
  }
  function sessionReady() {
    if (session()?.isReady?.()) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false, unsubscribe;
      const finish = () => {
        if (done) return;
        done = true;
        unsubscribe?.();
        window.removeEventListener?.("elifa:account-changed", finish);
        resolve();
      };
      window.addEventListener("elifa:account-changed", finish, { once: true });
      if (session()?.onChange) {
        unsubscribe = session().onChange(finish);
        if (done) unsubscribe?.();
      }
    });
  }
  async function resumeConnection() {
    if (!pendingConnection) return;
    const attempt = ++connectionAttempt, p = pendingConnection;
    await sessionReady();
    if (attempt !== connectionAttempt || pendingConnection !== p) return;
    openTogetherScreen();
    await openParsed(p);
  }
  var previewMode = false;
  var requestApi = createOrgClient({ fetcher: (...a) => fetch(...a), session, base: window.ELIFA_API_BASE || "" });
  var previewNotice = "\xD6nizleme: Buradaki hatim ve c\xFCzler deneme i\xE7indir; canl\u0131 kay\u0131tlar\u0131n\u0131 etkilemez.";
  function renderPreviewNotice() {
    for (const id of ["hcHomePreview", "hcOrgPreview", "hcDialogPreview"]) {
      const node = $(id);
      if (node) {
        node.hidden = !previewMode;
        node.textContent = previewMode ? previewNotice : "";
      }
    }
  }
  function previewNote(id) {
    return `<p id="${id}" class="hc-note" role="note" ${previewMode ? "" : "hidden"}>${previewMode ? previewNotice : ""}</p>`;
  }
  async function api(payload2) {
    const result = await requestApi(payload2);
    if (result.preview === true) {
      previewMode = true;
      renderPreviewNotice();
    }
    return result;
  }
  function save(required = false) {
    try {
      const raw = JSON.stringify(local);
      storage.setItem(key, raw);
      if (storage.getItem(key) !== raw) throw Error("Kay\u0131t do\u011Frulanamad\u0131");
      return true;
    } catch {
      if (required) throw Error("Bu taray\u0131c\u0131 kay\u0131t saklayam\u0131yor. Kat\u0131l\u0131m anahtar\u0131n\u0131 korumak i\xE7in depolamaya izin verip yeniden dene.");
      return false;
    }
  }
  if (!owner) {
    try {
      if (!storage.getItem(guestKey)) {
        local = loadLocal(storage, legacyKey);
        save();
      }
    } catch {
    }
  }
  function capabilities(code) {
    const out = { ...local.capabilities[code] };
    for (const [no, item] of Object.entries(local.pendingClaims[code] || {})) out[no] = item.token;
    return out;
  }
  function assertActionContext() {
    if ((user()?.uid || null) !== owner) throw Error("Hesap haz\u0131rlan\u0131yor. \u0130\u015Flemi g\xFCncel hesapla yeniden a\xE7.");
    if (activeAction && (activeAction.owner !== owner || activeAction.generation !== generation || activeAction.current !== current || activeAction.dialog !== dialogIdentity || !$("hatimDialog").open)) throw Error("Ekran veya hesap de\u011Fi\u015Fti. \u0130\u015Flemin g\xFCncel durumunu yenileyerek kontrol et.");
  }
  function retainPending(code) {
    if (!local.mine.some((m) => m.code === code)) local.mine.unshift({ code, title: current?.code === code ? current.org.title : "Kat\u0131l\u0131m do\u011Frulan\u0131yor", type: "hatim", pending: true });
  }
  function adminToken(code) {
    return local.mine.find((x) => x.code === code)?.adminToken || null;
  }
  function payload(action, code, extra = {}) {
    if ((user()?.uid || null) !== owner) throw Error("Hesap haz\u0131rlan\u0131yor. \u0130\u015Flemi g\xFCncel hesapla yeniden a\xE7.");
    return { action, code, capabilities: capabilities(code), ...adminToken(code) ? { admin: adminToken(code) } : {}, ...extra };
  }
  function remember(org, token) {
    if (!org || !/^[a-z0-9]{6}$/.test(org.code || "")) throw Error("Hatim kayd\u0131n\u0131n kodu do\u011Frulanamad\u0131.");
    const existing = local.mine.find((x) => x.code === org.code), mine = (org.items || []).filter((x) => x.mine);
    if (!existing && !org.isAdmin && !mine.length && !Object.keys(local.pendingClaims[org.code] || {}).length) return;
    const record = { ...existing, code: org.code, title: org.title, type: org.type, pending: false };
    if (org.isAdmin && token) record.adminToken = token;
    else if (!org.isAdmin) delete record.adminToken;
    for (const [no, item] of Object.entries(local.pendingClaims[org.code] || {})) {
      const actual = (org.items || []).find((i) => i.no === +no);
      if (actual?.mine) {
        local.capabilities[org.code] = { ...local.capabilities[org.code], [no]: item.token };
        delete local.pendingClaims[org.code][no];
      } else if (actual && actual.status !== "bos") delete local.pendingClaims[org.code][no];
    }
    for (const no of Object.keys(local.capabilities[org.code] || {})) if (!(org.items || []).some((i) => i.no === +no && i.mine)) delete local.capabilities[org.code][no];
    record.pending = Object.keys(local.pendingClaims[org.code] || {}).length > 0;
    local.mine = [record, ...local.mine.filter((x) => x.code !== org.code)];
    local.snapshots[org.code] = { title: org.title, type: org.type, isAdmin: org.isAdmin, archived: org.archived, items: mine, updatedAt: Date.now() };
    local.claimed[org.code] = mine.filter((x) => x.status === "alindi").map((x) => x.no);
    save();
    payButton();
  }
  function payButton() {
    const b = $("mainPayBtn");
    if (b) b.style.display = Object.values(local.claimed).some((v) => Array.isArray(v) && v.length) ? "flex" : "none";
  }
  function flash(message) {
    if (typeof window.toast === "function") window.toast(message);
    else $("hatimStatus").textContent = message;
  }
  function on(el, event, handler) {
    el?.addEventListener(event, handler);
  }
  function button(label, action, cls = "") {
    return `<button type="button" class="hc-button ${cls}" data-hc="${action}">${label}</button>`;
  }
  function dialog(title, body, actions = []) {
    const d = $("hatimDialog");
    if (d.open) d.close();
    const identity = ++dialogIdentity, context = { owner, generation, current, dialog: identity };
    d.innerHTML = `<form method="dialog"><header><h2>${esc(title)}</h2><button class="hc-close" value="cancel" aria-label="Kapat">\xD7</button></header></form><div class="hc-dialog-body">${previewNote("hcDialogPreview")}${body}<p id="hcError" class="hc-error" role="alert"></p></div><footer>${actions.map((a) => button(a.label, a.id, a.primary ? "primary" : "")).join("")}</footer>`;
    for (const a of actions) on(d.querySelector('[data-hc="' + a.id + '"]'), "click", async (e) => {
      const b = e.currentTarget;
      if (pendingAction) return;
      pendingAction = true;
      activeAction = context;
      b.disabled = true;
      try {
        assertActionContext();
        $("hcError").textContent = "";
        await a.run();
      } catch (err) {
        if (identity === dialogIdentity && d.open) $("hcError").textContent = err.message;
      } finally {
        if (activeAction === context) activeAction = null;
        pendingAction = false;
        b.disabled = false;
      }
    });
    d.showModal();
    return d;
  }
  function closeDialog() {
    if ($("hatimDialog").open) $("hatimDialog").close();
  }
  function updateAddress(code = null) {
    if (pendingConnection && !pendingConnectionPersisted) return;
    const url = canonicalHatimUrl(location.href, code);
    if (url !== location.href) history.replaceState(history.state, "", url);
  }
  function leaveHatimDetail(screen) {
    if (screen !== "home" && screen !== "birlikte") return;
    closeDialog();
    dialogIdentity++;
    generation++;
    listGeneration++;
    clearInterval(window.bkRefreshTimer);
    current = null;
    window.bkCurrent = null;
    updateAddress();
  }
  async function copy(value, label = "Ba\u011Flant\u0131") {
    const scope = { owner, generation, dialog: dialogIdentity };
    const valid = () => scope.owner === owner && scope.generation === generation && scope.dialog === dialogIdentity;
    try {
      await navigator.clipboard.writeText(value);
      if (valid()) flash(label + " kopyaland\u0131.");
    } catch {
      if (valid()) dialog(label + " \xB7 se\xE7ip kopyala", `<textarea readonly class="hc-link" aria-label="${esc(label)}">${esc(value)}</textarea><p>Yukar\u0131daki bilgiyi se\xE7ip kopyalayabilirsin.</p>`);
    }
  }
  async function share(code, title) {
    const url = participationUrl(base(), code);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Birlikte Hatim", text: title, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    await copy(url);
  }
  function accountOpen() {
    if (window.elifaAccount?.open) {
      window.elifaAccount.open();
      return;
    }
    document.querySelector("[data-account-open]")?.click();
    const d = $("accountDialog");
    if (d && !d.open) d.showModal();
  }
  function home() {
    const holder = $("birlikte");
    if (!holder) return;
    holder.innerHTML = `<div class="hc-home"><button type="button" class="hc-button hc-home-back" data-hc="home-back">\u2039 Elifa</button><header class="hc-top"><div><small>B\u0130RL\u0130KTE</small><h1>Hatimde bulu\u015Fal\u0131m</h1><p>Bir c\xFCz se\xE7, ortak niyete kat\u0131l.</p></div><span aria-hidden="true" class="hc-emblem">\u0627</span></header>${previewNote("hcHomePreview")}<div class="hc-main-actions">${button("\uFF0B Hatim olu\u015Ftur", "create", "primary")}${button("Ba\u011Flant\u0131yla kat\u0131l", "join")}</div><div class="hc-return-entry"><button type="button" class="hc-text" data-hc="return-entry">\u21A9 C\xFCz\xFCme geri d\xF6n</button><span>Ayn\u0131 cihazda Benim C\xFCzlerim; ba\u015Fka cihazda \xF6zel kodun.</span></div><nav class="hc-tabs" aria-label="Hatim b\xF6l\xFCmleri">${[["open", "A\xE7\u0131k Hatimler"], ["mine", "Benim C\xFCzlerim"], ["created", "Olu\u015Fturduklar\u0131m"]].map(([id, name]) => `<button type="button" data-tab="${id}" aria-pressed="${id === tab}">${name}</button>`).join("")}</nav><div id="hatimStatus" role="status" aria-live="polite"></div><div id="hatimList"></div></div>`;
    on(holder.querySelector("[data-hc=home-back]"), "click", () => {
      closeDialog();
      clearInterval(window.bkRefreshTimer);
      backFromTogether();
    });
    on(holder.querySelector("[data-hc=create]"), "click", showCreate);
    on(holder.querySelector("[data-hc=join]"), "click", showJoin);
    on(holder.querySelector("[data-hc=return-entry]"), "click", showReturnEntry);
    holder.querySelectorAll("[data-tab]").forEach((b) => on(b, "click", () => {
      tab = b.dataset.tab;
      renderBirlikte();
    }));
    renderList();
  }
  function card(o) {
    const total = o.total || 30, done = o.done ?? o.items?.filter((x) => x.status === "okundu").length ?? 0, available = o.available ?? Math.max(0, total - (o.taken || 0));
    return `<article class="hc-card"><div><h2>${esc(o.title)}</h2><p>${done}/${total} c\xFCz okundu \xB7 ${available} bo\u015F c\xFCz</p>${dueText(o.dueDate) ? `<small>${esc(dueText(o.dueDate))}</small>` : ""}<progress value="${done}" max="${total}" aria-label="${done}/${total} c\xFCz okundu"></progress></div><button class="hc-button" data-open="${esc(o.code)}">${available ? "C\xFCz se\xE7" : "G\xF6r\xFCnt\xFCle"}</button></article>`;
  }
  function renderList() {
    const list = $("hatimList");
    if (!list) return;
    renderPreviewNotice();
    $("hatimStatus").textContent = loading ? "G\xFCncel bilgiler al\u0131n\u0131yor\u2026" : error;
    if (tab === "open") {
      if (loading) list.innerHTML = '<div class="hc-empty"><h2>A\xE7\u0131k hatimler y\xFCkleniyor</h2><p>G\xFCncel liste kontrol ediliyor\u2026</p></div>';
      else if (error) list.innerHTML = '<div class="hc-empty"><h2>A\xE7\u0131k hatimler \u015Fu an al\u0131namad\u0131</h2><p>Bu, listenin kapal\u0131 oldu\u011Fu anlam\u0131na gelmez. Yeniden deneyebilir veya sana g\xF6nderilen ba\u011Flant\u0131yla kat\u0131labilirsin.</p>' + button("Yeniden dene", "discover-retry") + "</div>";
      else if (discoverEnabled === null) list.innerHTML = '<div class="hc-empty"><h2>A\xE7\u0131k hatim durumu hen\xFCz do\u011Frulanmad\u0131</h2><p>G\xFCncel listeyi kontrol etmek i\xE7in yeniden dene.</p>' + button("Yeniden dene", "discover-retry") + "</div>";
      else list.innerHTML = discoverEnabled && discover.length ? discover.map(card).join("") : `<div class="hc-empty"><h2>${discoverEnabled ? "Hen\xFCz a\xE7\u0131k hatim yok" : "Bir ba\u011Flant\u0131yla da kat\u0131labilirsin"}</h2><p>${discoverEnabled ? "\u0130lk hatmi sen ba\u015Flatabilirsin." : "A\xE7\u0131k hatim listesi \u015Fu an kapal\u0131. Sana g\xF6nderilen ba\u011Flant\u0131yla kat\u0131labilir veya \xF6zel bir hatim olu\u015Fturabilirsin."}</p></div>`;
    } else {
      const records = new Map(local.mine.filter((x) => x.type === "hatim").map((m) => [m.code, { ...m, ...local.snapshots[m.code], localOnly: true }]));
      for (const m of accountItems) if (m.type === "hatim") records.set(m.code, { ...records.get(m.code), ...m, localOnly: false });
      const rows = [...records.values()].filter((m) => tab === "created" ? m.isAdmin || m.adminToken : (m.items || []).length || local.claimed[m.code]?.length || Object.keys(capabilities(m.code)).length);
      list.innerHTML = (tab === "mine" ? '<div class="hc-return-row"><p>Ayn\u0131 cihazda c\xFCz\xFCn\xFC a\u015Fa\u011F\u0131dan a\xE7. Kay\u0131t g\xF6r\xFCnm\xFCyorsa \xF6zel d\xF6n\xFC\u015F kodunu kullan.</p>' + button("C\xFCz\xFCme geri d\xF6n", "return-entry") + "</div>" : "") + (!user() ? '<p class="hc-note">Misafir kay\u0131tlar\u0131 bu cihazda tutulur. Cihaz verileri silinirse \xF6zel d\xF6n\xFC\u015F ba\u011Flant\u0131n gerekir. <button class="hc-text" data-hc="account">Hesaba giri\u015F yap</button></p>' : "") + rows.map((m) => `<article class="hc-card"><div><h2>${esc(m.title)}</h2><p>${tab === "created" ? m.archived ? "Ar\u015Fivde" : "Y\xF6netici sensin" : (m.items || []).map((i) => i.no + ". c\xFCz \xB7 " + (i.status === "okundu" ? "Okudum \u2713" : "Okunacak")).join(" / ") || (m.pending ? "Kat\u0131l\u0131m sonucu do\u011Frulanmad\u0131 \xB7 a\xE7\u0131p kontrol et" : "Eski kat\u0131l\u0131m \xB7 y\xF6netici d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131 gerekli")}</p>${m.localOnly ? "<small>Cihaz kayd\u0131 \xB7 a\xE7\u0131nca g\xFCncellenir</small>" : ""}</div><button class="hc-button" data-open="${esc(m.code)}">A\xE7</button></article>`).join("") + (!rows.length ? '<div class="hc-empty"><h2>' + (tab === "created" ? "Hen\xFCz hatim olu\u015Fturmad\u0131n" : "Hen\xFCz c\xFCz se\xE7medin") + "</h2><p>A\xE7\u0131k hatimlerden veya sana g\xF6nderilen ba\u011Flant\u0131dan ba\u015Flayabilirsin.</p></div>" : "");
      if (user()) {
        let guest;
        try {
          guest = loadLocal(storage, guestKey);
        } catch {
        }
        if (guest && (Object.values(guest.capabilities).some((x) => Object.keys(x).length) || Object.values(guest.pendingClaims).some((x) => Object.keys(x).length) || guest.mine.some((x) => x.adminToken))) list.innerHTML += '<div class="hc-note"><b>Bu cihazda misafir kat\u0131l\u0131mlar\u0131 var.</b><p>Sana ait olanlar\u0131 se\xE7erek hesab\u0131na ba\u011Flayabilirsin.</p>' + button("Misafir kat\u0131l\u0131mlar\u0131m\u0131 g\xF6ster", "bind-list") + "</div>";
      }
    }
    list.querySelectorAll("[data-open]").forEach((b) => on(b, "click", () => bkOpen(b.dataset.open)));
    on(list.querySelector("[data-hc=return-entry]"), "click", showReturnEntry);
    on(list.querySelector("[data-hc=discover-retry]"), "click", renderBirlikte);
    on(list.querySelector("[data-hc=account]"), "click", accountOpen);
    on(list.querySelector("[data-hc=bind-list]"), "click", showGuestBindings);
  }
  async function renderBirlikte() {
    const ticket = ++listGeneration;
    home();
    loading = true;
    error = "";
    renderList();
    try {
      if (tab === "open") {
        const d = await api({ action: "discoverList" });
        if (ticket !== listGeneration) return;
        if (typeof d.enabled !== "boolean" || d.enabled && !Array.isArray(d.items)) throw Error("A\xE7\u0131k hatim listesi yan\u0131t\u0131 do\u011Frulanamad\u0131. Yeniden dene.");
        discoverEnabled = d.enabled;
        discover = (d.items || []).filter((x) => x.type === "hatim");
      } else if (user()) {
        let items = [], cursor;
        const seen = /* @__PURE__ */ new Set();
        do {
          if (seen.has(cursor)) throw Error("Kat\u0131l\u0131m listesi tamamlanamad\u0131. Yeniden dene.");
          seen.add(cursor);
          const d = await api({ action: "myList", ...cursor == null ? {} : { cursor } });
          if (ticket !== listGeneration) return;
          if (!Array.isArray(d.items)) throw Error("Kat\u0131l\u0131m listesi yan\u0131t\u0131 ge\xE7ersiz.");
          items.push(...d.items);
          cursor = d.nextCursor;
        } while (cursor != null);
        accountItems = items;
      }
    } catch (e) {
      if (ticket === listGeneration) error = e.message;
    } finally {
      if (ticket === listGeneration) {
        loading = false;
        renderList();
      }
    }
  }
  function showJoin() {
    dialog("Ba\u011Flant\u0131yla kat\u0131l", '<p class="hc-note">Yeni bir hatme kat\u0131lmak i\xE7indir. Daha \xF6nce ald\u0131\u011F\u0131n c\xFCze d\xF6nmek i\xE7in \u201CC\xFCz\xFCme geri d\xF6n\u201D\xFC kullan.</p><label class="hc-field">Kat\u0131l\u0131m ba\u011Flant\u0131s\u0131 veya 6 haneli hatim kodu<input id="hcJoin" autocomplete="off" placeholder="Ba\u011Flant\u0131y\u0131 yap\u0131\u015Ft\u0131r veya 6 haneli kodu yaz"></label>', [{ id: "join", label: "Hatmi a\xE7", primary: true, run: async () => {
      const parsed = parseHatimLink($("hcJoin").value, base());
      if (!parsed) throw Error("Ge\xE7erli bir hatim ba\u011Flant\u0131s\u0131 veya kodu yaz.");
      stageConnection(parsed);
      closeDialog();
      await resumeConnection();
    } }]);
  }
  function showReturnEntry() {
    dialog("C\xFCz\xFCme geri d\xF6n", '<ol class="hc-return-steps"><li><b>Ayn\u0131 cihaz:</b> Benim C\xFCzlerim sekmesinden c\xFCz\xFCn\xFC a\xE7.</li><li><b>Ba\u015Fka cihaz / uygulama:</b> \xD6zel d\xF6n\xFC\u015F kodunu yaz veya ki\u015Fisel ba\u011Flant\u0131n\u0131 yap\u0131\u015Ft\u0131r.</li><li><b>Hesaba ba\u011Fl\u0131ysa:</b> \xD6nce c\xFCz\xFC ald\u0131\u011F\u0131n hesapla giri\u015F yap. Kod tek ba\u015F\u0131na hesab\u0131n yerine ge\xE7mez.</li></ol><label class="hc-field">\xD6zel d\xF6n\xFC\u015F kodu veya ki\u015Fisel ba\u011Flant\u0131<textarea id="hcReturnInput" class="hc-return-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="C1-\u2026 veya ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131n"></textarea></label><p class="hc-note">Bu bilgi sana \xF6zeldir. Genel hatim kodu yaln\u0131z yeni kat\u0131l\u0131m i\xE7indir; c\xFCz\xFCn\xFC geri a\xE7maz.</p>', [
      { id: "return-open", label: "C\xFCz\xFCm\xFC a\xE7", primary: true, run: async () => {
        const parsed = parseHatimLink($("hcReturnInput").value, base());
        if (!parsed) throw Error("\xD6zel d\xF6n\xFC\u015F kodunu veya ki\u015Fisel ba\u011Flant\u0131n\u0131 eksiksiz gir.");
        if (!parsed.capability) throw Error("Bu genel kat\u0131l\u0131m veya y\xF6netici bilgisi. C\xFCz\xFCne d\xF6nmek i\xE7in sana \xF6zel C1 d\xF6n\xFC\u015F kodunu ya da ki\u015Fisel ba\u011Flant\u0131n\u0131 kullan.");
        stageConnection(parsed);
        closeDialog();
        await resumeConnection();
      } },
      { id: "my-juz", label: "Benim C\xFCzlerim", run: async () => {
        closeDialog();
        tab = "mine";
        openTogetherScreen();
        await renderBirlikte();
      } }
    ]);
  }
  async function openParsed(p) {
    if (p.capability) {
      dialog("Ki\u015Fisel c\xFCz ba\u011Flant\u0131s\u0131", `<p>${p.no}. c\xFCz\xFCn ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131 a\xE7\u0131l\u0131yor. Bu ba\u011Flant\u0131 c\xFCz\xFC y\xF6netme yetkisi verir; ba\u015Fkalar\u0131yla payla\u015Fma.</p>`, [{ id: "recover", label: "C\xFCz\xFCm\xFC a\xE7", primary: true, run: async () => {
        const d = await api({ action: "get", code: p.code, capabilities: { [p.no]: p.capability } });
        assertActionContext();
        const it = d.org.items.find((x) => x.no === p.no);
        if (!it?.mine) throw Error("Bu ba\u011Flant\u0131 art\u0131k ge\xE7erli de\u011Fil veya kat\u0131l\u0131m bir hesaba ba\u011Flanm\u0131\u015F. Hesab\u0131na giri\u015F yap ya da y\xF6neticiye ba\u015Fvur.");
        local.capabilities[p.code] = { ...capabilities(p.code), [p.no]: p.capability };
        save(true);
        remember(d.org);
        save(true);
        completeConnection(p);
        closeDialog();
        await bkOpen(p.code);
      } }]);
      return;
    }
    await bkOpen(p.code, p.admin);
  }
  async function bkOpen(code, admin, navOpts = {}) {
    closeDialog();
    dialogIdentity++;
    const ticket = ++generation;
    clearInterval(window.bkRefreshTimer);
    current = null;
    window.bkCurrent = null;
    show("org");
    if (!navOpts.fromHistory && typeof setElifaRoute === "function") setElifaRoute("org", navOpts.replace ? "replace" : "push");
    $("orgView").innerHTML = '<p class="hc-empty" role="status">Hatim a\xE7\u0131l\u0131yor\u2026</p>';
    try {
      const d = await api(payload("get", code, { ...admin ? { admin } : {} }));
      if (ticket !== generation) return;
      if (admin && !d.org.isAdmin) throw Error("Y\xF6netici ba\u011Flant\u0131s\u0131 do\u011Frulanamad\u0131. \xD6zel ba\u011Flant\u0131n\u0131 kontrol et.");
      current = { org: d.org, code: d.code, adminToken: admin || adminToken(d.code), ticket };
      window.bkCurrent = current;
      remember(d.org, admin);
      const pending = pendingConnection;
      if (pending && !pending.capability && (pending.admin && pending.admin === admin && d.org.isAdmin || !pending.admin && pending.code === d.code)) {
        let retained = !pending.admin;
        try {
          if (pending.admin) retained = save(true);
        } catch {
        }
        if (retained) completeConnection(pending);
      }
      updateAddress(d.code);
      renderOrg();
      window.bkRefreshTimer = setInterval(bkSilentRefresh, 6e4);
      return true;
    } catch (e) {
      if (ticket === generation) {
        $("orgView").innerHTML = `${previewNote("hcOrgPreview")}<div class="hc-empty" role="alert"><p>${esc(e.message)}</p>${button("Yeniden dene", "retry")}</div>`;
        on($("orgView").querySelector("[data-hc=retry]"), "click", () => bkOpen(code, admin, { fromHistory: true }));
      }
    }
  }
  async function bkSilentRefresh() {
    const c = current;
    if (!c || refreshing || document.hidden || !$("org").classList.contains("on") || $("hatimDialog").open || pendingAction) return;
    refreshing = true;
    try {
      const d = await api(payload("get", c.code, { ...c.adminToken ? { admin: c.adminToken } : {} }));
      if (current === c && c.ticket === generation) {
        current.org = d.org;
        remember(d.org, c.adminToken);
        renderOrg();
      }
    } catch (e) {
      if (current === c) {
        const hint = $("hcRefreshState");
        if (hint) hint.textContent = "Bilgiler yenilenemedi. " + e.message;
      }
    } finally {
      refreshing = false;
    }
  }
  async function mutate(action, no, extra = {}) {
    assertActionContext();
    const c = current, requestOwner = owner;
    if (!c) throw Error("\xD6nce hatmi a\xE7.");
    const d = await api(payload(action, c.code, { ...c.adminToken ? { admin: c.adminToken } : {}, ...no ? { no, capability: capabilities(c.code)[no] } : {}, ...extra }));
    assertActionContext();
    if (owner !== requestOwner || current !== c || generation !== c.ticket) throw Error("Hatim de\u011Fi\u015Fti. G\xFCncel durumunu yenileyerek kontrol et.");
    remember(d.org, c.adminToken);
    if (current === c && generation === c.ticket) {
      current.org = d.org;
      renderOrg();
    }
    return d;
  }
  function renderOrg() {
    const c = current;
    if (!c) return;
    const o = c.org, items = o.items || [], done = items.filter((x) => x.status === "okundu").length, available = items.filter((x) => x.status === "bos").length;
    if (o.type !== "hatim") {
      renderLegacy(o);
      return;
    }
    $("orgView").innerHTML = `<div class="hc-detail">${previewNote("hcOrgPreview")}<header class="hc-detail-head"><small>${o.fullHatim ? "B\u0130RL\u0130KTE HAT\u0130M" : "C\xDCZ \xC7ALI\u015EMASI"}${o.archived ? " \xB7 AR\u015E\u0130V" : ""}</small><h1>${esc(o.title)}</h1><p>${esc(o.adminName || "")}${o.dueDate ? " \xB7 " + esc(dueText(o.dueDate)) : ""}</p></header><div class="hc-summary"><b>${done}<span> / ${items.length} okundu</span></b><span>${available} bo\u015F c\xFCz</span><progress value="${done}" max="${items.length}" aria-label="Okunan c\xFCzler"></progress></div>${o.complete ? '<p class="hc-success">' + (o.fullHatim ? "Hatim tamamland\u0131." : "C\xFCz \xE7al\u0131\u015Fmas\u0131 tamamland\u0131.") + " Allah kabul etsin.</p>" : ""}${o.archived ? '<p class="hc-note">Bu \xE7al\u0131\u015Fma ar\u015Fivde. Kay\u0131tlar korunur; yeni c\xFCz almak i\xE7in y\xF6netici yeniden a\xE7abilir.</p>' : ""}<div class="hc-detail-actions">${button("Kat\u0131l\u0131m ba\u011Flant\u0131s\u0131n\u0131 payla\u015F", "share")}${button("Yenile", "refresh")}${o.isAdmin ? button("Y\xF6net", "manage") : ""}</div><p class="hc-note">Bo\u015F bir c\xFCz se\xE7ebilirsin. Okumak veya dinlemek, c\xFCz\xFC kendili\u011Finden \u201COkudum\u201D yapmaz.</p><div class="hc-grid">${items.map((i) => `<button type="button" class="hc-juz ${i.mine ? "mine " : ""}${i.status}" data-cuz="${i.no}" aria-label="${i.no}. c\xFCz, ${i.mine ? "Bende, " : ""}${i.status === "bos" ? "Bo\u015F" : i.status === "okundu" ? "Okundu" : "Al\u0131nd\u0131"}${i.name ? ", " + esc(i.name) : ""}"><b>${i.no}</b><span>${i.status === "bos" ? "Bo\u015F" : i.status === "okundu" ? "Okundu \u2713" : i.mine ? "Bende" : "Al\u0131nd\u0131"}</span>${i.name ? `<small>${esc(i.name)}</small>` : ""}</button>`).join("")}</div><p id="hcRefreshState" class="hc-note" role="status">${user() ? "Hesab\u0131na ba\u011Fl\u0131 kat\u0131l\u0131mlar di\u011Fer cihazlarda da g\xF6r\xFCn\xFCr." : "Misafirsen ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131n\u0131 sakla."}</p></div>`;
    on($("orgView").querySelector("[data-hc=share]"), "click", () => share(c.code, o.title));
    on($("orgView").querySelector("[data-hc=refresh]"), "click", bkSilentRefresh);
    on($("orgView").querySelector("[data-hc=manage]"), "click", showManage);
    $("orgView").querySelectorAll("[data-cuz]").forEach((b) => on(b, "click", () => showJuz(Number(b.dataset.cuz))));
  }
  function showJuz(no) {
    const c = current, i = c?.org.items.find((x) => x.no === no);
    if (!i) return;
    if (i.status === "bos") {
      if (c.org.archived) return flash("Bu \xE7al\u0131\u015Fma ar\u015Fivde.");
      showClaim(no);
      return;
    }
    const actions = [{ id: "read", label: "Okumaya ba\u015Fla", primary: true, run: async () => {
      closeDialog();
      await gotoPage(JUZ_PAGE[no - 1], { returnTo: "org" });
    } }];
    if (i.mine) {
      actions.push({ id: "done", label: i.status === "okundu" ? "Okudum i\u015Faretini geri al" : "Okudum \u2713", run: async () => {
        await mutate(i.status === "okundu" ? "undo" : "complete", no);
        closeDialog();
      } });
      actions.push({ id: "release", label: "C\xFCz\xFC b\u0131rak", run: () => confirmRelease(no) });
      if (capabilities(c.code)[no]) actions.push({ id: "return", label: "\xD6zel d\xF6n\xFC\u015F kodum / ba\u011Flant\u0131m", run: () => showRecovery(c.code, no, capabilities(c.code)[no], !!user()) });
    } else actions.push({ id: "close", label: "Kapat", run: closeDialog });
    dialog(no + ". c\xFCz", `<p>${esc(i.name || "Kat\u0131l\u0131mc\u0131")} \xB7 ${i.status === "okundu" ? "Okundu" : "Al\u0131nd\u0131"}</p>${!i.mine ? "<p>Bu c\xFCz\xFC yaln\u0131z sahibi y\xF6netebilir." + (i.legacy ? " Eski kat\u0131l\u0131m\u0131nsa y\xF6neticiden ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131 iste." : "") + "</p>" : ""}`, actions);
  }
  function confirmRelease(no) {
    const c = current;
    dialog("C\xFCz\xFC b\u0131rak", `<p>${no}. c\xFCz yeniden se\xE7ilebilir olacak. Mevcut ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131n\u0131n yetkisi sona erecek.</p>`, [{ id: "release", label: "Evet, c\xFCz\xFC b\u0131rak", primary: true, run: async () => {
      await mutate("release", no);
      delete local.capabilities[c.code]?.[no];
      delete local.pendingClaims[c.code]?.[no];
      save();
      closeDialog();
    } }, { id: "cancel", label: "Vazge\xE7", run: closeDialog }]);
  }
  function showClaim(no) {
    const c = current, guest = !user();
    dialog(no + ". c\xFCz\xFC al", `<label class="hc-field">G\xF6r\xFCnen ad veya takma ad<input id="hcName" minlength="2" maxlength="60" value="${esc(user()?.displayName || local.myName)}" autocomplete="nickname"></label><p class="hc-note">Bu ad hatimde c\xFCz\xFCn\xFCn alt\u0131nda g\xF6r\xFCn\xFCr. Ger\xE7ek ad kullanmak zorunda de\u011Filsin.</p>${guest ? '<div class="hc-warning">Hesaps\u0131z kat\u0131l\u0131yorsun. Bu cihaz\u0131n verileri silinirse eri\u015Fimini kaybedebilirsin. Kat\u0131l\u0131mdan sonra ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131n\u0131 sakla; daha sonra hesab\u0131na da ba\u011Flayabilirsin.</div>' : ""}`, [{ id: "claim", label: "Bu c\xFCz\xFC al", primary: true, run: async () => {
      const name = $("hcName").value.trim();
      if (name.length < 2 || name.length > 60) throw Error("2\u201360 karakterlik ad veya takma ad yaz.");
      if (current !== c) throw Error("Hatim de\u011Fi\u015Fti. C\xFCz\xFC yeniden se\xE7.");
      const token = local.pendingClaims[c.code]?.[no]?.token || secret(crypto);
      local.pendingClaims[c.code] = { ...local.pendingClaims[c.code], [no]: { token, name, createdAt: Date.now() } };
      local.myName = name;
      retainPending(c.code);
      save(true);
      try {
        await mutate("claim", no, { name, capability: token });
        closeDialog();
        showRecovery(c.code, no, token, !!user());
      } catch (e) {
        if (e.status === 409) {
          delete local.pendingClaims[c.code]?.[no];
          save();
        }
        throw e;
      }
    } }, { id: "cancel", label: "Vazge\xE7", run: closeDialog }]);
  }
  function showRecovery(code, no, token, accountBound = false, forParticipant = false) {
    const link = recoveryUrl(base(), code, no, token);
    let returnCode = null, preparing = false;
    dialog(
      forParticipant ? "Kat\u0131l\u0131mc\u0131ya \xF6zel d\xF6n\xFC\u015F bilgisi" : no + ". c\xFCz sende",
      '<p class="hc-warning">' + (forParticipant ? "Bu kod ve ba\u011Flant\u0131y\u0131 yaln\u0131z c\xFCz\xFCn ger\xE7ek sahibine ilet. Genel hatim grubuna g\xF6nderme." : accountBound ? "Bu c\xFCz hesab\u0131na ba\u011Fl\u0131. Di\u011Fer cihazda ayn\u0131 hesapla giri\u015F yap; \xF6zel kod tek ba\u015F\u0131na hesab\u0131n\u0131n yerine ge\xE7mez." : "Bu kod ve ba\u011Flant\u0131 c\xFCz\xFCn\xFC y\xF6netir. Yaln\u0131z kendin i\xE7in sakla; kat\u0131l\u0131m ba\u011Flant\u0131s\u0131 olarak payla\u015Fma.") + '</p><ol class="hc-return-steps"><li><b>Ayn\u0131 cihazda</b> Birlikte \u2192 Benim C\xFCzlerim.</li><li><b>Uygulamada</b> Birlikte \u2192 C\xFCz\xFCme geri d\xF6n \u2192 \xF6zel kodu gir.</li><li><b>Web\u2019de</b> ki\u015Fisel ba\u011Flant\u0131n\u0131 a\xE7; ard\u0131ndan C\xFCz\xFCm\xFC a\xE7\u2019a dokun.</li></ol><div class="hc-return-code"><label for="hcPersonalCode">\xD6zel d\xF6n\xFC\u015F kodu</label><textarea id="hcPersonalCode" readonly rows="2" aria-describedby="hcReturnStatus" placeholder="Kod haz\u0131rlan\u0131yor\u2026"></textarea><small id="hcReturnStatus" role="status" aria-live="polite">\xD6zel kod haz\u0131rlan\u0131yor. Ba\u011Flant\u0131n\u0131 hemen kopyalayabilirsin.</small></div><details class="hc-private-link"><summary>Ki\u015Fisel web ba\u011Flant\u0131s\u0131n\u0131 g\xF6ster</summary><textarea readonly class="hc-link" aria-label="Ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131">' + esc(link) + "</textarea></details>",
      [
        { id: "copy-code", label: "\xD6zel kodu kopyala", primary: true, run: () => {
          if (!returnCode) throw Error("\xD6zel kod hen\xFCz haz\u0131r de\u011Fil. Kodu yeniden haz\u0131rla veya ki\u015Fisel ba\u011Flant\u0131n\u0131 kopyala.");
          return copy(returnCode, "\xD6zel d\xF6n\xFC\u015F kodu");
        } },
        { id: "copy", label: "Ki\u015Fisel ba\u011Flant\u0131y\u0131 kopyala", run: () => copy(link, "Ki\u015Fisel ba\u011Flant\u0131") },
        { id: "return-retry", label: "Kodu yeniden haz\u0131rla", run: () => prepareCode() },
        { id: "ok", label: "Tamam", run: closeDialog }
      ]
    );
    const scope = { owner, generation, dialog: dialogIdentity }, stillHere = () => scope.owner === owner && scope.generation === generation && scope.dialog === dialogIdentity && $("hatimDialog").open;
    const prepareCode = async () => {
      if (preparing || !stillHere()) return;
      preparing = true;
      const copyButton = $("hatimDialog").querySelector('[data-hc="copy-code"]'), retry = $("hatimDialog").querySelector('[data-hc="return-retry"]');
      if (copyButton) copyButton.disabled = true;
      if (retry) retry.hidden = true;
      $("hcReturnStatus").textContent = "\xD6zel kod haz\u0131rlan\u0131yor. Ba\u011Flant\u0131n\u0131 hemen kopyalayabilirsin.";
      try {
        const data = await api(payload("returnCode", code, { no, capability: token }));
        if (!stillHere()) return;
        returnCode = personalReturnCode(code, no, data.returnKey);
        $("hcPersonalCode").value = returnCode;
        $("hcReturnStatus").textContent = "Kodu g\xFCvenli bir yere kaydet. Bo\u015Fluklar\u0131 ve \xE7izgileri yazmadan da girebilirsin.";
        if (copyButton) copyButton.disabled = false;
      } catch (e) {
        if (stillHere()) {
          $("hcReturnStatus").textContent = "\xD6zel kod haz\u0131rlanamad\u0131. Yeniden deneyebilir veya ki\u015Fisel ba\u011Flant\u0131n\u0131 kullanabilirsin.";
          if (retry) retry.hidden = false;
        }
      } finally {
        preparing = false;
      }
    };
    prepareCode();
  }
  function showCreate() {
    let visibilityStatus = "loading", visibilityEnabled = null;
    createDraft = local.creation || { token: secret(crypto), title: "", name: user()?.displayName || local.myName, dueDate: "", public: false };
    dialog("Hatim olu\u015Ftur", `<p class="hc-note">30 c\xFCzl\xFCk bir hatim ba\u015Flat. Kat\u0131l\u0131mc\u0131lar hesap a\xE7madan da c\xFCz se\xE7ebilir.</p>${!user() ? '<p class="hc-warning">Hesaps\u0131z olu\u015Fturuyorsun. Cihaz verileri silinirse y\xF6netici eri\u015Fimini kaybedebilirsin. Olu\u015Fturma sonunda \xF6zel y\xF6netici ba\u011Flant\u0131n\u0131 sakla.</p>' : ""}<label class="hc-field">Hatmin ad\u0131 / niyeti<input id="hcTitle" maxlength="120" value="${esc(createDraft.title)}" placeholder="\xD6rn. Ailemizin haftal\u0131k hatmi"></label><label class="hc-field">Y\xF6netici g\xF6r\xFCnen ad\u0131<input id="hcAdminName" maxlength="60" value="${esc(createDraft.name)}" placeholder="Ad veya takma ad"></label><label class="hc-field">Hedef tarih \xB7 iste\u011Fe ba\u011Fl\u0131<input type="date" id="hcDue" value="${esc(createDraft.dueDate)}"></label><fieldset class="hc-visibility"><legend>Kimler kat\u0131labilsin?</legend><div id="hcVisibilityOptions" aria-live="polite"><p>Kat\u0131l\u0131m se\xE7enekleri kontrol ediliyor\u2026</p></div></fieldset>`, [{ id: "create", label: "Hatmi olu\u015Ftur", primary: true, run: async () => {
      if (createDraft.public && visibilityEnabled !== true) throw Error("\xD6nceki a\xE7\u0131k hatim iste\u011Fini g\xFCvenle s\xFCrd\xFCrmek i\xE7in kat\u0131l\u0131m se\xE7eneklerinin do\u011Frulanmas\u0131n\u0131 bekle veya yeniden dene.");
      const form = { title: $("hcTitle").value.trim(), name: $("hcAdminName").value.trim(), dueDate: $("hcDue").value, public: !!document.querySelector("input[name=hcVisibility][value=public]:checked") };
      if (!form.title) throw Error("Hatme bir ad ver.");
      const signature = JSON.stringify(form);
      if (createDraft.signature && createDraft.signature !== signature) createDraft.token = secret(crypto);
      createDraft = { ...createDraft, ...form, signature };
      local.creation = createDraft;
      save(true);
      const d = await api({ action: "create", creationToken: createDraft.token, org: { type: "hatim", title: form.title, adminName: form.name, dueDate: form.dueDate || null, public: form.public, items: Array.from({ length: 30 }, (_, i) => ({ no: i + 1 })) } });
      assertActionContext();
      remember(d.org, d.adminToken);
      local.creation = null;
      save();
      closeDialog();
      await bkOpen(d.code, d.adminToken);
      showAdminBackup(d.code, d.adminToken);
    } }, { id: "cancel", label: "Vazge\xE7", run: closeDialog }]);
    const scope = { owner, generation, dialog: dialogIdentity };
    const visibilityCurrent = () => scope.owner === owner && scope.generation === generation && scope.dialog === dialogIdentity && $("hatimDialog").open;
    const renderVisibility = () => {
      if (!visibilityCurrent()) return;
      $("hcVisibilityOptions").innerHTML = '<label><input type="radio" name="hcVisibility" value="private" ' + (!createDraft.public ? "checked" : "") + "> Ba\u011Flant\u0131ya sahip olanlar</label>" + (visibilityStatus === "ready" && visibilityEnabled ? '<label><input type="radio" name="hcVisibility" value="public" ' + (createDraft.public ? "checked" : "") + "> Uygulamadaki herkes</label>" : "") + (visibilityStatus === "loading" ? "<small>Uygulamadaki herkese a\xE7ma se\xE7ene\u011Fi kontrol ediliyor\u2026</small>" : visibilityStatus === "error" ? '<small>A\xE7\u0131k kat\u0131l\u0131m durumu do\u011Frulanamad\u0131. Ba\u011Flant\u0131yla kat\u0131l\u0131m se\xE7ene\u011Fi kullan\u0131labilir.</small><button type="button" class="hc-text" id="hcVisibilityRetry">Yeniden dene</button>' : visibilityEnabled ? "" : "<small>A\xE7\u0131k hatim listesi \u015Fu an kapal\u0131.</small>");
      on($("hcVisibilityRetry"), "click", loadVisibility);
    };
    const loadVisibility = async () => {
      visibilityStatus = "loading";
      visibilityEnabled = null;
      renderVisibility();
      try {
        const d = await api({ action: "discoverConfig" });
        if (!visibilityCurrent()) return;
        if (typeof d.enabled !== "boolean") throw Error("Kat\u0131l\u0131m se\xE7enekleri do\u011Frulanamad\u0131.");
        visibilityEnabled = d.enabled;
        discoverEnabled = d.enabled;
        visibilityStatus = "ready";
      } catch {
        if (!visibilityCurrent()) return;
        visibilityStatus = "error";
      }
      renderVisibility();
    };
    loadVisibility();
  }
  function showAdminBackup(code, token) {
    const link = adminUrl(base(), token);
    dialog("Hatmin haz\u0131r", `<p>Kat\u0131l\u0131m ba\u011Flant\u0131s\u0131n\u0131 istedi\u011Fin ki\u015Filerle payla\u015Fabilirsin. A\u015Fa\u011F\u0131daki <b>y\xF6netici ba\u011Flant\u0131s\u0131 sana \xF6zeldir</b>; ayr\u0131 sakla.</p><textarea readonly class="hc-link" aria-label="\xD6zel y\xF6netici ba\u011Flant\u0131s\u0131">${esc(link)}</textarea>`, [{ id: "admin-copy", label: "Y\xF6netici ba\u011Flant\u0131s\u0131n\u0131 sakla", run: () => copy(link) }, { id: "share", label: "Kat\u0131l\u0131m ba\u011Flant\u0131s\u0131n\u0131 payla\u015F", primary: true, run: () => share(code, local.mine.find((m) => m.code === code)?.title || "Hatim") }, { id: "ok", label: "Tamam", run: closeDialog }]);
  }
  function showManage() {
    const c = current, o = c.org;
    dialog("Hatmi y\xF6net", `<label class="hc-field">Hatmin ad\u0131<input id="hcEditTitle" maxlength="120" value="${esc(o.title)}"></label><label class="hc-field">Hedef tarih<input id="hcEditDue" type="date" value="${esc(o.dueDate || "")}"></label><p class="hc-note">${o.public ? "A\xE7\u0131k hatimler listesinde." : "Yaln\u0131z ba\u011Flant\u0131yla kat\u0131l\u0131m."}</p>`, [
      { id: "save", label: "De\u011Fi\u015Fiklikleri kaydet", primary: true, run: async () => {
        await mutate("update", null, { title: $("hcEditTitle").value.trim(), dueDate: $("hcEditDue").value || null });
        closeDialog();
      } },
      { id: "visibility", label: o.public ? "A\xE7\u0131k listeden kald\u0131r" : "A\xE7\u0131k hatimlerde g\xF6ster", run: async () => {
        await mutate("publish", null, { public: !o.public });
        closeDialog();
      } },
      { id: "fix", label: "C\xFCz durumunu d\xFCzelt / eri\u015Fim ver", run: showAdminCuz },
      { id: "report-png", label: "PNG raporu indir", run: () => exportReport("png") },
      { id: "report-pdf", label: "PDF / yazd\u0131rma g\xF6r\xFCn\xFCm\xFC", run: () => exportReport("pdf") },
      ...c.adminToken ? [{ id: "backup", label: "\xD6zel y\xF6netici ba\u011Flant\u0131m", run: () => showAdminBackup(c.code, c.adminToken) }] : [],
      { id: "archive", label: o.archived ? "Ar\u015Fivden \xE7\u0131kar" : "Ar\u015Five al", run: () => dialog(o.archived ? "Hatmi yeniden a\xE7" : "Hatmi ar\u015Fivle", "<p>Okuma kay\u0131tlar\u0131 ve ki\u015Fisel ba\u011Flant\u0131lar korunur. Ar\u015Fivdeyken yeni c\xFCz al\u0131namaz; \xE7al\u0131\u015Fma a\xE7\u0131k listeden \xE7\u0131kar.</p>", [{ id: "confirm", label: o.archived ? "Yeniden a\xE7" : "Ar\u015Five al", primary: true, run: async () => {
        await mutate(o.archived ? "reopen" : "archive");
        closeDialog();
      } }]) }
    ]);
  }
  async function exportReport(format) {
    assertActionContext();
    const c = current, requestOwner = owner;
    if (!c) throw Error("\xD6nce hatmi a\xE7.");
    const d = await api(payload("get", c.code, { ...c.adminToken ? { admin: c.adminToken } : {} }));
    assertActionContext();
    if (current !== c || owner !== requestOwner || generation !== c.ticket) throw Error("Hatim de\u011Fi\u015Fti. Raporu yeniden a\xE7.");
    if (!d.org.isAdmin) throw Error("Rapor i\xE7in g\xFCncel y\xF6netici yetkisi gerekiyor.");
    await downloadHatimReport({ ...d.org, code: d.code }, { format });
  }
  function showAdminCuz() {
    const c = current;
    dialog("C\xFCz y\xF6netimi", `<label class="hc-field">C\xFCz<select id="hcAdminJuz">${c.org.items.map((i) => `<option value="${i.no}">${i.no}. c\xFCz \xB7 ${esc(i.name || "Bo\u015F")}</option>`).join("")}</select></label><p class="hc-note">Durum d\xFCzeltme kat\u0131l\u0131mc\u0131y\u0131 de\u011Fi\u015Ftirmez. Ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131 \xFCretmek \xF6nceki eri\u015Fimi iptal eder; yaln\u0131z do\u011Fru ki\u015Fiye ilet.</p>`, [
      { id: "done", label: "Okundu i\u015Faretle", run: async () => {
        await mutate("adminSet", Number($("hcAdminJuz").value), { status: "okundu" });
        closeDialog();
      } },
      { id: "undo", label: "Okunacak olarak d\xFCzelt", run: async () => {
        await mutate("adminSet", Number($("hcAdminJuz").value), { status: "alindi" });
        closeDialog();
      } },
      { id: "free", label: "Bo\u015Fa \xE7\u0131kar", run: () => {
        const no = Number($("hcAdminJuz").value);
        dialog("C\xFCz\xFC bo\u015Fa \xE7\u0131kar", `<p>${no}. c\xFCz\xFCn mevcut ki\u015Fisel eri\u015Fimi iptal edilecek ve yeniden se\xE7ilebilecek.</p>`, [{ id: "confirm", label: "Bo\u015Fa \xE7\u0131kar", run: async () => {
          await mutate("adminSet", no, { status: "bos" });
          closeDialog();
        } }]);
      } },
      { id: "recovery", label: "Ki\u015Fisel d\xF6n\xFC\u015F ba\u011Flant\u0131s\u0131 haz\u0131rla", run: () => {
        const no = Number($("hcAdminJuz").value);
        dialog("Kat\u0131l\u0131mc\u0131 eri\u015Fimini yenile", `<p>${no}. c\xFCz\xFCn \xF6nceki hesap ve ba\u011Flant\u0131 eri\u015Fimi iptal edilir. Yeni ba\u011Flant\u0131y\u0131 yaln\u0131z bu c\xFCz\xFCn ger\xE7ek sahibine ilet.</p>`, [{ id: "confirm", label: "Yeni ba\u011Flant\u0131 olu\u015Ftur", primary: true, run: async () => {
          const pending = local.pendingRecovery[c.code]?.[no], token = pending && !pending.confirmed ? pending.token : secret(crypto);
          local.pendingRecovery[c.code] = { ...local.pendingRecovery[c.code], [no]: { token, confirmed: false, createdAt: Date.now() } };
          save(true);
          await mutate("issueRecovery", no, { capability: token });
          local.pendingRecovery[c.code][no].confirmed = true;
          save();
          showRecovery(c.code, no, token, false, true);
        } }]);
      } }
    ]);
  }
  function showGuestBindings() {
    const guest = loadLocal(storage, guestKey), entries = [];
    for (const m of guest.mine) {
      const proof = { ...guest.capabilities[m.code] };
      for (const [no, item] of Object.entries(guest.pendingClaims[m.code] || {})) proof[no] = item.token;
      for (const [n, t] of Object.entries(proof)) entries.push({ code: m.code, no: Number(n), token: t, title: m.title });
      if (m.adminToken) entries.push({ code: m.code, admin: m.adminToken, title: m.title });
    }
    dialog("Sana ait kat\u0131l\u0131mlar\u0131 se\xE7", `<p>Yaln\u0131z sana ait olanlar\u0131 hesab\u0131na ba\u011Fla. Ba\u015Fka ki\u015Finin bu cihazdaki kat\u0131l\u0131m\u0131n\u0131 se\xE7me.</p><div class="hc-bind-list">${entries.map((x, i) => `<label><input type="checkbox" value="${i}"> ${esc(x.title)} \xB7 ${x.admin ? "Y\xF6netici eri\u015Fimi" : x.no + ". c\xFCz"}</label>`).join("")}</div>`, [{ id: "bind", label: "Se\xE7tiklerimi hesab\u0131ma ba\u011Fla", primary: true, run: async () => {
      const selected = [...$("hatimDialog").querySelectorAll("input:checked")].map((x) => entries[Number(x.value)]);
      if (!selected.length) throw Error("En az bir kat\u0131l\u0131m se\xE7.");
      for (const e of selected) {
        assertActionContext();
        const d = await api({ action: e.admin ? "bindAdmin" : "bind", code: e.code, ...e.admin ? { admin: e.admin } : { no: e.no, capability: e.token } });
        assertActionContext();
        if (e.token) local.capabilities[e.code] = { ...capabilities(e.code), [e.no]: e.token };
        remember(d.org, e.admin);
        save(true);
        if (e.token) {
          delete guest.capabilities[e.code]?.[e.no];
          delete guest.pendingClaims[e.code]?.[e.no];
        }
        if (e.admin) {
          const m = guest.mine.find((x) => x.code === e.code);
          if (m) delete m.adminToken;
        }
        storage.setItem(guestKey, JSON.stringify(guest));
        save(true);
      }
      closeDialog();
      await renderBirlikte();
    } }]);
  }
  function renderLegacy(o) {
    const c = current, pend = local.pending[c.code] || 0;
    $("orgView").innerHTML = `<div class="hc-detail">${previewNote("hcOrgPreview")}<small>\xD6NCEK\u0130 ORTAK N\u0130YET KAYDI</small><h1>${esc(o.title)}</h1><p>${esc(o.zikirAd || "")} \xB7 ${o.toplam || 0} / ${o.hedef || 0}</p><p class="hc-note">Bu eski ba\u011Flant\u0131 ve kay\u0131tlar\u0131 korunuyor.</p><div class="hc-main-actions">${button("\uFF0B Okudum (" + pend + ")", "tap")}${button("Pay\u0131m\u0131 ekle", "send", "primary")}</div><p id="hcLegacyStatus" role="status"></p></div>`;
    on($("orgView").querySelector("[data-hc=tap]"), "click", () => {
      local.pending[c.code] = (local.pending[c.code] || 0) + 1;
      save();
      renderLegacy(o);
    });
    on($("orgView").querySelector("[data-hc=send]"), "click", () => {
      if (!local.pending[c.code]) return;
      dialog("Pay\u0131n\u0131 ekle", `<label class="hc-field">Ad veya takma ad<input id="hcLegacyName" maxlength="60" value="${esc(local.myName)}"></label>`, [{ id: "send", label: "G\xF6nder", primary: true, run: async () => {
        const amount = local.pending[c.code], name = $("hcLegacyName").value.trim();
        if (name.length < 2) throw Error("Ad veya takma ad yaz.");
        const d = await api(payload("contribute", c.code, { name, amount }));
        assertActionContext();
        local.pending[c.code] = Math.max(0, (local.pending[c.code] || 0) - amount);
        save();
        if (current === c) {
          current.org = d.org;
          renderOrg();
        }
        closeDialog();
      } }]);
    });
  }
  window.bkOpen = bkOpen;
  window.bkCurrent = null;
  window.bkRefreshTimer = null;
  window.renderBirlikte = renderBirlikte;
  window.renderOrg = renderOrg;
  window.renderMainPayBtn = payButton;
  window.bkOpenDiscover = () => {
    tab = "open";
    openTogetherScreen();
  };
  window.bkDiscoverInit = async () => {
  };
  window.bkApi = api;
  window.bkDue = (o) => ({ late: dueText(o.dueDate) === "Hedef tarih ge\xE7ti", txt: dueText(o.dueDate) });
  window.elifaHatimNavigation = leaveHatimDetail;
  on($("orgBack"), "click", () => {
    closeDialog();
    dialogIdentity++;
    ++generation;
    clearInterval(window.bkRefreshTimer);
    current = null;
    window.bkCurrent = null;
    openTogetherScreen();
  });
  on(document, "visibilitychange", () => {
    if (!document.hidden) bkSilentRefresh();
  });
  on(window, "focus", bkSilentRefresh);
  on(window, "elifa:account-changed", (e) => {
    const uid = e.detail?.user?.uid || null;
    if (uid === owner) {
      if (pendingConnection && !current) resumeConnection().catch((err) => flash(err.message));
      return;
    }
    save();
    owner = uid;
    key = uid ? "elifa_hatim_user_" + uid : guestKey;
    local = loadLocal(storage, key);
    accountItems = [];
    dialogIdentity++;
    ++generation;
    ++listGeneration;
    clearInterval(window.bkRefreshTimer);
    const code = current?.code;
    current = null;
    window.bkCurrent = null;
    closeDialog();
    payButton();
    if (pendingConnection) resumeConnection().catch((err) => flash(err.message));
    else if (code) bkOpen(code, null, { fromHistory: true });
    else if ($("birlikte")?.classList.contains("on")) renderBirlikte();
  });
  payButton();
  var initial = parseHatimLink(location.href, base()) || readPendingConnection();
  if (initial) {
    stageConnection(initial);
    if (pendingConnectionPersisted) updateAddress();
    openTogetherScreen();
    const hint = $("hatimStatus");
    if (hint) hint.textContent = "Ba\u011Flant\u0131n korunuyor. Hesap durumu haz\u0131rlan\u0131yor\u2026";
    resumeConnection().catch((err) => flash(err.message));
  }
})();
