const $ = id => document.getElementById(id), clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2, 9);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid();
let D = (() => { try { return JSON.parse(localStorage.getItem("gm_draft")) } catch { } })() || clone(window.SITE_CONTENT);
let cur = "profile", dirty = !!localStorage.getItem("gm_draft");
const save = () => { try { localStorage.setItem("gm_draft", JSON.stringify(D)); dirty = true } catch { alert("Γέμισε ο χώρος του browser — χρησιμοποίησε μικρότερες εικόνες ή κάνε Export.") } render() };
const E = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); kids.flat().forEach(k => e.append(k)); return e };

function readImg(file, max = 1600) { return new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = E("canvas"); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .85)) }; im.src = r.result }; r.readAsDataURL(file) }) }

function text(label, o, k, area, ph) { const i = E(area ? "textarea" : "input", { value: o[k] || "", placeholder: ph || "" }); i.oninput = () => o[k] = i.value; return E("div", { className: "fld" }, E("label", { textContent: label }), i) }
function image(label, o, k) {
  const w = E("div", { className: "fld" }), draw = () => {
    w.innerHTML = ""; w.append(E("label", { textContent: label }));
    if (o[k]) w.append(E("img", { className: "prev", src: o[k].startsWith("data:") ? o[k] : "../" + o[k].replace(/^\.\//, "") }));
    const url = E("input", { placeholder: "Path/URL (π.χ. images/logo.png) ή ανέβασε αρχείο", value: o[k]?.startsWith("data:") ? "" : o[k] || "" }); url.onchange = () => { o[k] = url.value.trim(); draw() };
    const f = E("input", { type: "file", accept: "image/*", hidden: true }); f.onchange = async () => { if (f.files[0]) { o[k] = await readImg(f.files[0]); draw() } };
    const up = E("button", { type: "button", className: "btn", textContent: "⬆ Ανέβασμα", onclick: () => f.click() });
    const rm = E("button", { type: "button", className: "btn", textContent: "Αφαίρεση", onclick: () => { o[k] = ""; draw() } });
    w.append(url, E("div", { style: "margin-top:6px;display:flex;gap:6px" }, up, o[k] ? rm : ""), f)
  }; draw(); return w
}
function dialog(title, fields, onSave) {
  const o = E("div", { className: "ov" }), x = () => o.remove();
  o.append(E("div", { className: "dlg" }, E("h3", { textContent: title }), ...fields, E("div", { className: "act" },
    E("button", { className: "btn", textContent: "Άκυρο", onclick: x }),
    E("button", { className: "btn p", textContent: "Αποθήκευση", onclick: () => { if (onSave() !== false) x() } }))));
  document.body.append(o)
}

function blocks(arr) {
  const T = { h2: "Τίτλος", p: "Κείμενο", img: "Εικόνα", video: "YouTube", link: "Link" }, w = E("div", { className: "fld" });
  const draw = () => {
    w.innerHTML = ""; w.append(E("label", { textContent: "Περιεχόμενο σελίδας" }));
    arr.forEach((b, i) => {
      const cell = E("div");
      if (b.t === "img") cell.append(image("", b, "v"));
      else { const inp = E(b.t === "p" ? "textarea" : "input", { value: b.v || "" }); inp.oninput = () => b.v = inp.value; cell.append(inp);
        if (b.t === "link") { const l = E("input", { placeholder: "Κείμενο κουμπιού", value: b.label || "", style: "margin-top:6px" }); l.oninput = () => b.label = l.value; cell.append(l) } }
      const mv = d => () => { const j = i + d; if (j >= 0 && j < arr.length) { [arr[i], arr[j]] = [arr[j], arr[i]]; draw() } };
      w.append(E("div", { className: "brow" }, E("span", { textContent: T[b.t], style: "color:#9a9a9a;padding-top:10px" }), cell,
        E("div", { style: "display:flex;gap:4px" }, E("button", { type: "button", className: "btn", textContent: "↑", onclick: mv(-1) }), E("button", { type: "button", className: "btn", textContent: "↓", onclick: mv(1) }), E("button", { type: "button", className: "btn d", textContent: "✕", onclick: () => { arr.splice(i, 1); draw() } }))))
    });
    w.append(E("div", { style: "display:flex;gap:6px;flex-wrap:wrap" }, ...Object.entries(T).map(([k, n]) => E("button", { type: "button", className: "btn", textContent: "+ " + n, onclick: () => { arr.push({ t: k, v: "" }); draw() } }))))
  }; draw(); return w
}

function editItem(s, id) {
  const isV = s.type === "videos", old = id && s.items.find(x => x.id === id);
  const it = old ? clone(old) : isV ? { id: uid(), title: "", url: "", desc: "", thumb: "" } : { id: uid(), title: "", summary: "", image: "", blocks: [] };
  const fields = isV ? [text("Τίτλος", it, "title"), text("Link (YouTube / TikTok / Instagram)", it, "url", 0, "https://..."), text("Περιγραφή (προαιρετικό)", it, "desc"), image("Εξώφυλλο (προαιρετικό — χρήσιμο για TikTok)", it, "thumb")]
    : [text("Τίτλος", it, "title"), text("Σύντομη περιγραφή", it, "summary", 1), image("Εικόνα καρτέλας", it, "image"), blocks(it.blocks)];
  dialog(old ? "Επεξεργασία" : "Νέο", fields, () => {
    if (!it.title.trim() || (isV && !it.url.trim())) { alert("Συμπλήρωσε τα βασικά πεδία"); return false }
    const i = s.items.findIndex(x => x.id === it.id); i >= 0 ? s.items[i] = it : s.items.unshift(it); save()
  })
}

function render() {
  const side = $("side"); side.innerHTML = ""; side.append(E("h1", { textContent: "Portfolio CMS" }));
  const tab = (k, n) => side.append(E("button", { className: "tab" + (cur === k ? " on" : ""), textContent: n, onclick: () => { cur = k; render() } }));
  tab("profile", "Προφίλ & Επικοινωνία"); D.sections.forEach(s => tab(s.id, s.title));
  side.append(E("button", { className: "tab", textContent: "+ Νέα ενότητα", onclick: () => { const t = prompt("Τίτλος ενότητας;"); if (!t) return; const ty = confirm("OK = βίντεο, Άκυρο = projects") ? "videos" : "projects"; D.sections.push({ id: slug(t), title: t, note: "", type: ty, items: [] }); cur = slug(t); save() } }),
    E("div", { className: "sp" }),
    E("button", { className: "btn p", textContent: "⬇ Export (zip)", onclick: exportZip }),
    E("button", { className: "btn", textContent: "↺ Επαναφορά draft", onclick: () => { if (confirm("Χάνονται οι μη εξαγμένες αλλαγές.")) { localStorage.removeItem("gm_draft"); D = clone(window.SITE_CONTENT); dirty = false; cur = "profile"; render() } } }));
  const m = $("main"); m.innerHTML = "";
  m.append(E("div", { className: "hint", innerHTML: "Οι αλλαγές αποθηκεύονται ως <b>draft στον browser</b>. Πάτα <b>Export (zip)</b> και αντικατάστησε στο site το <code>data/content.js</code> και τον φάκελο <code>images/</code> — μετά ανέβασέ το ξανά (host)." + (dirty ? " <b>• Έχεις μη εξαγμένες αλλαγές.</b>" : "") }));
  if (cur === "profile") {
    const P = D.profile; P.links ||= [];
    m.append(E("h2", { textContent: "Προφίλ" }), image("Logo (πάνω αριστερά)", P, "logo"), image("Φωτογραφία (hero)", P, "photo"),
      text("Όνομα", P, "name"), text("Handle", P, "handle"), text("Badge (κεφαλίδα)", P, "kicker"), text("Video Editing — περιγραφή", P, "editing"), text("Software — περιγραφή", P, "engineering"), text("Email", P, "email"));
    const lw = E("div", { className: "fld" }), dl = () => { lw.innerHTML = "<label>Social links</label>"; P.links.forEach((l, i) => { const a = E("input", { value: l.label, placeholder: "Όνομα" }), b = E("input", { value: l.url, placeholder: "https://..." }); a.oninput = () => l.label = a.value; b.oninput = () => l.url = b.value;
      lw.append(E("div", { style: "display:grid;grid-template-columns:140px 1fr auto;gap:6px;margin-bottom:6px" }, a, b, E("button", { className: "btn d", textContent: "✕", onclick: () => { P.links.splice(i, 1); dl() } }))) }); lw.append(E("button", { className: "btn", textContent: "+ Link", onclick: () => { P.links.push({ label: "", url: "" }); dl() } })) }; dl();
    m.append(lw, E("button", { className: "btn p", textContent: "Αποθήκευση", onclick: () => { save(); alert("Αποθηκεύτηκε (draft)") } }));
    return
  }
  const s = D.sections.find(x => x.id === cur); if (!s) { cur = "profile"; return render() }
  m.append(E("h2", { textContent: s.title }), text("Τίτλος ενότητας", s, "title"), text("Σημείωση (προαιρετικό)", s, "note", 1),
    E("div", { style: "display:flex;gap:8px;margin:12px 0 18px" }, E("button", { className: "btn p", textContent: "+ Νέο " + (s.type === "videos" ? "βίντεο" : "project"), onclick: () => editItem(s) }), E("button", { className: "btn", textContent: "Αποθήκευση τίτλου", onclick: save }),
      E("button", { className: "btn d", textContent: "Διαγραφή ενότητας", onclick: () => { if (confirm("Διαγραφή ολόκληρης της ενότητας;")) { D.sections = D.sections.filter(x => x !== s); cur = "profile"; save() } } })));
  s.items.forEach((it, i) => {
    const img = s.type === "videos" ? it.thumb : it.image, mv = d => () => { const j = i + d; if (j >= 0 && j < s.items.length) { [s.items[i], s.items[j]] = [s.items[j], s.items[i]]; save() } };
    m.append(E("div", { className: "row" }, img ? E("img", { src: img.startsWith("data:") ? img : "../" + img }) : E("img"), E("div", { className: "t" }, E("b", { textContent: it.title }), E("span", { textContent: it.url || it.summary || "", style: "color:#9a9a9a;font-size:12px" })),
      E("button", { className: "btn", textContent: "↑", onclick: mv(-1) }), E("button", { className: "btn", textContent: "↓", onclick: mv(1) }), E("button", { className: "btn", textContent: "✎", onclick: () => editItem(s, it.id) }),
      E("button", { className: "btn d", textContent: "✕", onclick: () => { if (confirm("Διαγραφή;")) { s.items.splice(i, 1); save() } } })))
  });
  if (!s.items.length) m.append(E("p", { textContent: "Δεν υπάρχει περιεχόμενο ακόμα.", style: "color:#9a9a9a" }))
}

async function exportZip() {
  const out = clone(D), zip = new JSZip(), imgs = zip.folder("images"); let n = 0;
  const walk = o => { for (const k in o) { const v = o[k]; if (typeof v === "string" && v.startsWith("data:image")) { const name = `img-${Date.now().toString(36)}-${++n}.jpg`; imgs.file(name, v.split(",")[1], { base64: true }); o[k] = "images/" + name } else if (v && typeof v === "object") walk(v) } };
  walk(out);
  zip.file("data/content.js", "window.SITE_CONTENT = " + JSON.stringify(out, null, 2) + ";\n");
  const a = E("a", { href: URL.createObjectURL(await zip.generateAsync({ type: "blob" })), download: "portfolio-update.zip" }); a.click();
  D = out; localStorage.setItem("gm_draft", JSON.stringify(D)); dirty = false; render()
}
render();
