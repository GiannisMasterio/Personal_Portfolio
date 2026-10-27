let D, P; const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ytId = u => (u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/) || [])[1];
const ttId = u => (u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/) || [])[1];
const kind = u => ytId(u) ? "YOUTUBE" : ttId(u) ? "TIKTOK" : /instagram\.com/.test(u) ? "INSTAGRAM" : "LINK";
const bg = u => u ? `style="background-image:url('${esc(u)}')"` : "";

const slug = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function adapt(c) {
  const sec = (id, type, k) => ({ id, type, title: k.title || id, note: k.note || "", items: (k.items || []).map((it, i) => type === "videos" ? { ...it, id: id + i } :
    { ...it, id: slug(it.title) || id + i, blocks: [it.body && { t: "p", v: it.body }, ...(it.gallery || []).map(v => ({ t: "img", v })), it.video && { t: "video", v: it.video }, it.link_url && { t: "link", v: it.link_url, label: it.link_label }].filter(Boolean) }) });
  return { profile: c.profile, sections: [sec("others", "videos", c.others || {}), sec("personal", "videos", c.personal || {}), sec("software", "projects", c.software || {})] };
}
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2200) }

const vCard = v => {
  const y = ytId(v.url), img = v.thumb || (y ? `https://img.youtube.com/vi/${y}/hqdefault.jpg` : "");
  return `<div class="card" data-open="${esc(v.url)}"><div class="thumb" ${bg(img)}><span class="badge">${kind(v.url)}</span><div class="play"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></div>
  <div class="body"><h3>${esc(v.title)}</h3>${v.desc ? `<p>${esc(v.desc)}</p>` : ""}</div></div>`;
};
const pCard = p => `<a class="card proj" href="#/p/${esc(p.id)}"><div class="thumb" ${bg(p.image)}>${p.image ? "" : '<span class="badge">PROJECT</span>'}</div>
  <div class="body"><h3>${esc(p.title)}</h3>${p.summary ? `<p>${esc(p.summary)}</p>` : ""}<div class="more">Δες αναλυτικά →</div></div></a>`;

function render() {
  document.title = `${P.name} — Portfolio`;
  $("logoName").textContent = P.handle;
  const setImg = (el, u) => { el.style.backgroundImage = u ? `url('${u}')` : ""; el.textContent = u ? "" : (P.name.match(/\b\w/g) || []).slice(0, 2).join("") };
  setImg($("logoImg"), P.logo || P.photo); setImg($("photo"), P.photo || P.logo);
  $("kicker").textContent = P.kicker; $("pv").textContent = P.editing; $("pe").textContent = P.engineering;
  const [first, ...rest] = P.name.split(" ");
  $("h1").innerHTML = `<span class="a">${esc(first)}</span><span>${esc(rest.join(" "))}</span><span class="c">Portfolio</span>`;
  $("foot").textContent = `© ${new Date().getFullYear()} ${P.name}`;
  const vis = D.sections.filter(s => s.items.length);
  $("nav").innerHTML = vis.map(s => `<a href="#${esc(s.id)}" data-jump="${esc(s.id)}">${esc(s.title)}</a>`).join("") + `<a class="cta" href="#contact" data-jump="contact">Contact</a>`;
  $("sections").innerHTML = vis.map((s, i) => `<section class="sec" id="${esc(s.id)}"><div class="wrap">
    <div class="sh"><span class="n">0${i + 1}</span><h2 class="serif">${esc(s.title)}</h2></div>
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}
    <div class="grid">${s.items.map(it => s.type === "videos" ? vCard(it) : pCard(it)).join("")}</div></div></section>`).join("");
  $("contactN").textContent = "0" + (vis.length + 1);
  $("mailShow").textContent = P.email;
  $("links").innerHTML = (P.links || []).filter(l => l.url).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("");
}

document.addEventListener("click", e => {
  const j = e.target.closest("[data-jump]");
  if (j) { e.preventDefault(); if (location.hash.startsWith("#/p/")) location.hash = "#/"; setTimeout(() => $(j.dataset.jump)?.scrollIntoView({ behavior: "smooth" }), 40); return }
  const o = e.target.closest("[data-open]"); if (o) openVideo(o.dataset.open);
});

function openVideo(u) {
  const y = ytId(u), t = ttId(u);
  if (!y && !t) { window.open(u, "_blank", "noopener"); return }
  const src = y ? `https://www.youtube-nocookie.com/embed/${y}?autoplay=1&rel=0` : `https://www.tiktok.com/embed/v2/${t}`;
  const o = document.createElement("div"); o.className = "ov";
  o.innerHTML = `<div class="vbox ${t ? 'tall' : ''}"><button class="xbtn">✕</button><iframe src="${src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  const k = e => { if (e.key === "Escape") close() }, close = () => { o.remove(); document.removeEventListener("keydown", k) };
  o.onclick = e => { if (e.target === o || e.target.className === "xbtn") close() };
  document.addEventListener("keydown", k); document.body.append(o);
}

function copyMail() { navigator.clipboard?.writeText(P.email); toast("Αντιγράφηκε το email") }
function sendMail(mode) {
  if (!$("cform").reportValidity()) return;
  const subj = `Μήνυμα από το portfolio — ${$("cn").value}`, body = `Όνομα: ${$("cn").value}\nEmail: ${$("ce").value}\n\n${$("cm").value}`;
  if (mode === "gmail") window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(P.email)}&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`, "_blank", "noopener");
  else location.href = `mailto:${P.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
}

function route() {
  const m = location.hash.match(/^#\/p\/(.+)$/);
  let p; if (m) for (const s of D.sections) if (s.type === "projects") p ||= s.items.find(x => x.id === m[1]);
  $("home").style.display = p ? "none" : "block"; $("detail").style.display = p ? "block" : "none";
  if (!p) return;
  $("dTitle").textContent = p.title; $("dSum").textContent = p.summary || "";
  const c = $("dCover"); c.style.display = p.image ? "block" : "none"; if (p.image) c.src = p.image;
  $("dContent").innerHTML = (p.blocks || []).map(b => {
    if (b.t === "h2") return `<h2>${esc(b.v)}</h2>`;
    if (b.t === "img") return `<img src="${esc(b.v)}" alt="">`;
    if (b.t === "link") return `<a class="lnk" href="${esc(b.v)}" target="_blank" rel="noopener">${esc(b.label || b.v)} ↗</a>`;
    if (b.t === "video") { const y = ytId(b.v); return y ? `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${y}" allowfullscreen></iframe></div>` : `<a class="lnk" href="${esc(b.v)}" target="_blank" rel="noopener">Δες το βίντεο ↗</a>` }
    return `<p>${esc(b.v)}</p>`;
  }).join("");
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
fetch('data/content.json',{cache:'no-cache'}).then(r=>r.json()).then(c=>{D=adapt(c);P=D.profile;render();route()}).catch(()=>document.body.insertAdjacentHTML('beforeend','<p style="padding:40px">Δεν φόρτωσε το περιεχόμενο. Άνοιξε το site από server (Netlify/GitHub Pages), όχι με διπλό κλικ.</p>'));
