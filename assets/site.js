/* Prosa do Campo: programa comum a todas as páginas. A página ativa vem de <body data-page="..."> */
var PAGE = document.body.getAttribute("data-page");
var PREVIEW = typeof window.claude !== "undefined";
var AWESOME = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
var ICONS = {
  boi: '<path d="M5 8c0 5 3 7 6 7M27 8c0 5-3 7-6 7"/><rect x="10" y="12" width="12" height="14" rx="5"/><path d="M14 19h.01M18 19h.01"/>',
  leite: '<path d="M9 5h14l-2 22H11z"/><path d="M10 12h12"/>',
  grao: '<path d="M16 28V8"/><path d="M16 12c-4 0-5-3-5-5 3 0 5 2 5 5zM16 12c4 0 5-3 5-5-3 0-5 2-5 5zM16 19c-4 0-5-3-5-5 3 0 5 2 5 5zM16 19c4 0 5-3 5-5-3 0-5 2-5 5z"/>',
  cafe: '<ellipse cx="16" cy="16" rx="8" ry="12" transform="rotate(30 16 16)"/><path d="M13 7c5 4 1 9 6 18"/>',
  cesta: '<path d="M5 13h22l-2 13H7z"/><path d="M11 13l5-8 5 8"/>',
  folha: '<path d="M16 28c-6-4-9-9-9-14 5 0 9 3 9 8 0-5 4-8 9-8 0 5-3 10-9 14z"/>'
};
var TEMAS = { boi: "Boi e reposição", leite: "Leite", cafe: "Café", graos: "Grãos", mercado: "Mercado", geada: "Geada", chuva: "Chuva", calor: "Calor", seca: "Seca", geral: "Geral" };
var AREAS = { cafe: "Café", milho: "Milho", soja: "Soja", feijao: "Feijão", geral: "Geral", corte: "Gado de corte", recria: "Recria", leite: "Gado de leite" };

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function safeUrl(u) { return typeof u === "string" && u.indexOf("https://") === 0 ? u : ""; }
function link(t, u) { var s = safeUrl(u); return s ? '<a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(t) + "</a>" : esc(t); }
function $(id) { return document.getElementById(id); }
function getJson(url) {
  var u = PREVIEW ? url : url + "?t=" + Math.floor(Date.now() / 600000);
  return fetch(u).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); });
}
function parseBR(s) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ""); return m ? +m[3] * 10000 + +m[2] * 100 + +m[1] : 0; }
function byDateDesc(a, b) { return parseBR(b.data) - parseBR(a.data); }
function stampText(iso) {
  var d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  var parts = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo", hourCycle: "h23" }).formatToParts(d);
  var g = {}; parts.forEach(function (p) { g[p.type] = p.value; });
  return { text: g.day + "/" + g.month + ", " + g.hour + "h" + g.minute, ageH: (Date.now() - d.getTime()) / 36e5 };
}
function setHtml(id, html) { var e = $(id); if (e) e.innerHTML = html; }
function setText(id, t) { var e = $(id); if (e) e.textContent = t; }
function fail(id, msg) { setHtml(id, '<p class="empty">' + esc(msg) + "</p>"); }

/* Faixa de cotações */
function tickerHtml(items, dup) {
  return items.map(function (t) {
    var arrow = t.dir > 0 ? '<span class="up" aria-label="em alta">▲</span>' : t.dir < 0 ? '<span class="down" aria-label="em queda">▼</span>' : t.dir === 0 ? '<span class="d">estável</span>' : "";
    return '<div class="tk' + (dup ? " tk-dup" : "") + '"' + (dup ? ' aria-hidden="true"' : "") + '><span class="k">' + esc(t.k) + '</span><span class="v">' + esc(t.v) + '</span><span class="u">' + esc(t.u) + "</span>" + arrow + '<span class="d">' + esc(t.d) + "</span></div>";
  }).join("");
}

/* Quadros de cotação */
function cell(c) {
  if (typeof c === "string") c = { t: c };
  return "<td" + (c.cls ? ' class="' + esc(c.cls) + '"' : "") + ">" + esc(c.t) + (c.s ? '<span class="unit">' + esc(c.s) + "</span>" : "") + "</td>";
}
function bloco(b) {
  var h = b.titulo ? "<h4>" + esc(b.titulo) + "</h4>" : "";
  h += '<div class="scroll"><table><thead><tr>' + b.colunas.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
    b.linhas.map(function (l) { return "<tr>" + l.map(cell).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  var fs = b.fontes || [];
  var nota = fs.map(function (f) { return link(f.t, f.u); }).join(" · ");
  if (nota) h += '<p class="sub" style="margin:10px 0 0">' + nota + "</p>";
  return h;
}
function painel(p) {
  var h = '<div class="panel q' + (p.wide ? " wide" : "") + '"><h3><span class="ttl"><svg class="ico" viewBox="0 0 32 32" aria-hidden="true">' + (ICONS[p.icone] || "") + "</svg>" + esc(p.titulo) + "</span>" + (p.sub ? ' <span class="sub">' + esc(p.sub) + "</span>" : "") + "</h3>";
  if (p.vazio) h += '<p class="empty">' + esc(p.vazio) + "</p>";
  var bl = p.blocos || [];
  if (p.duasColunas && bl.length) h += '<div class="cafe-grid"><div>' + bloco(bl[0]) + '</div><div class="stack">' + bl.slice(1).map(function (b) { return "<div>" + bloco(b) + "</div>"; }).join("") + "</div></div>";
  else h += bl.map(bloco).join("");
  if (p.rodape) h += '<p class="sub" style="margin:14px 0 0">' + esc(p.rodape) + "</p>";
  return h + "</div>";
}

/* Notícias: item com tema, fonte, data e por que importa */
function noticia(n) {
  var tema = TEMAS[n.tema] || n.categoria || "";
  var meta = [tema, n.regiao, n.fonte, n.data].filter(Boolean).map(esc).join(" · ");
  var why = n.impacto || n.impacto_mg;
  return '<li><div class="meta">' + meta + "</div>" + link(n.titulo, n.url) + (why ? '<span class="why"><b>Por que importa:</b> ' + esc(why) + "</span>" : "") + "</li>";
}
function newsList(items) { return items.length ? items.map(noticia).join("") : '<li class="sub">Nenhuma notícia neste filtro.</li>'; }
/* Filtros em botões (chips) sobre uma lista */
function chipFilter(chipsId, listId, items, keyFn, labels, renderFn) {
  var box = $(chipsId), list = $(listId);
  if (!box || !list) return;
  var keys = [], seen = {};
  items.forEach(function (n) { var k = keyFn(n); if (k && !seen[k]) { seen[k] = 1; keys.push(k); } });
  function draw(sel) {
    list.innerHTML = renderFn(sel === "todas" ? items : items.filter(function (n) { return keyFn(n) === sel; }));
    Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-k") === sel ? "true" : "false"); });
  }
  box.innerHTML = ['todas'].concat(keys).map(function (k) { return '<button type="button" data-k="' + esc(k) + '" aria-pressed="false">' + esc(k === "todas" ? "Todas" : (labels[k] || k)) + "</button>"; }).join("");
  Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) { b.addEventListener("click", function () { draw(b.getAttribute("data-k")); }); });
  draw("todas");
}

/* Dicas e artigos */
function dicaCard(d) {
  var meta = [AREAS[d.area || d.cultura] || d.area || d.cultura, d.epoca].filter(Boolean).map(esc).join(" · ");
  return '<article class="tip-card"><div class="meta">' + meta + "</div><h3>" + esc(d.titulo) + "</h3><p>" + esc(d.texto) + '</p><div class="src">Fonte: ' + link(d.fonte, d.url) + (d.data ? ", " + esc(d.data) : "") + "</div></article>";
}
function artigoLi(a) {
  var meta = [AREAS[a.area || a.cultura] || "", a.fonte, a.data].filter(Boolean).map(esc).join(" · ");
  return '<li><div class="meta">' + meta + "</div>" + link(a.titulo, a.url) + "</li>";
}
function dicaDoDia(dicas) {
  if (!dicas.length) return "";
  var now = new Date(), start = new Date(now.getFullYear(), 0, 0);
  var doy = Math.floor((now - start) / 864e5);
  var d = dicas[doy % dicas.length];
  var meta = [AREAS[d.area || d.cultura] || "", d.epoca].filter(Boolean).map(esc).join(" · ");
  return '<div class="tip-day"><div class="meta">Dica do dia · ' + meta + "</div><h3>" + esc(d.titulo) + "</h3><p>" + esc(d.texto) + '</p><div class="sub">Fonte: ' + link(d.fonte, d.url) + (d.data ? ", " + esc(d.data) : "") + "</div></div>";
}

/* Dólar */
var fmt3 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
function pctTxt(p) { return (p >= 0 ? "+" : "−") + Math.abs(p).toFixed(2).replace(".", ",") + "%"; }
function showDollar(d) {
  var dir = d.variacaoPct < 0 ? "down" : d.variacaoPct > 0 ? "up" : "";
  var arrow = d.variacaoPct < 0 ? "▼ " : d.variacaoPct > 0 ? "▲ " : "";
  var v = "R$ " + fmt3.format(d.valor);
  setText("nav-v", v);
  setText("nav-pct", arrow + Math.abs(d.variacaoPct).toFixed(2).replace(".", ",") + "%");
  if ($("nav-pct")) $("nav-pct").className = dir;
  setText("nav-t", d.hora);
  if ($("nav-usd")) $("nav-usd").title = "Dólar à vista às " + d.hora + " de " + d.data + ". " + (d.live ? "Atualizado ao abrir a página." : "Fonte: " + d.fonte + ".");
  if (!$("usd-val")) return;
  setText("usd-val", v);
  setText("usd-chg", arrow + pctTxt(d.variacaoPct) + " às " + d.hora);
  $("usd-chg").className = "chg " + dir;
  setText("usd-date", d.data);
  setText("usd-type", d.tipo);
  setText("usd-ptax", d.ptax || "—");
}
function renderDollarTable(d) {
  if (!$("usd-rows")) return;
  setHtml("usd-rows", d.linhas.map(function (l) {
    return "<tr><td>" + esc(l.hora) + (l.sub ? '<span class="unit">' + esc(l.sub) + "</span>" : "") + '</td><td class="val">' + esc(l.valor) + "</td><td" + (l.cls ? ' class="' + esc(l.cls) + '"' : "") + ">" + esc(l.variacao) + "</td><td>" + link(l.fonte, l.url) + "</td></tr>";
  }).join(""));
  setText("usd-note", d.nota || "");
}
function liveDollar(base) {
  fetch(AWESOME).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); }).then(function (j) {
    var u = j.USDBRL, valor = +u.ask, pct = +u.pctChange;
    if (!isFinite(valor) || !isFinite(pct) || valor < 3 || valor > 10) throw new Error("valor");
    var m = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(u.create_date || "");
    if (!m) throw new Error("data");
    showDollar({ valor: valor, variacaoPct: pct, hora: m[4] + "h" + m[5], data: m[3] + "/" + m[2] + "/" + m[1], tipo: "Ao vivo, atualizado ao abrir a página", ptax: base.ptax, fonte: "AwesomeAPI", live: true });
  }).catch(function () {});
}

/* Preços (todas as páginas usam a faixa e o dólar; Início e Cotações usam mais) */
function loadCotacoes() {
  getJson("data/cotacoes.json").then(function (data) {
    setHtml("ticker", tickerHtml(data.ticker, false) + tickerHtml(data.ticker, true));
    showDollar({ valor: data.dolar.valor, variacaoPct: data.dolar.variacaoPct, hora: data.dolar.hora, data: data.dolar.data, tipo: data.dolar.tipo, ptax: data.dolar.ptax, fonte: data.dolar.fonte, live: false });
    liveDollar(data.dolar);
    var st = stampText(data.atualizadoEm), tag = $("cot-tag");
    if (tag && st) {
      if (st.ageH > 30) { tag.textContent = "Preços de " + st.text + ", podem estar desatualizados"; tag.className = "tag"; }
      else { tag.textContent = "Atualizado em " + st.text; tag.className = "tag live"; }
    }
    if (PAGE === "cotacoes") {
      setText("aviso", data.aviso || "");
      setHtml("panel-agro", data.paineis.map(painel).join(""));
      renderDollarTable(data.dolar);
    }
    if (PAGE === "inicio") {
      setHtml("home-stats", data.ticker.map(function (t) {
        var arrow = t.dir > 0 ? '<span class="up" aria-label="em alta"> ▲</span>' : t.dir < 0 ? '<span class="down" aria-label="em queda"> ▼</span>' : "";
        return '<div class="stat"><div class="k">' + esc(t.k) + '</div><div class="v">' + esc(t.v) + arrow + '</div><div class="u">' + esc(t.u) + '</div><div class="d">' + esc(t.d) + "</div></div>";
      }).join(""));
    }
  }).catch(function () {
    setHtml("ticker", "");
    if ($("aviso")) setText("aviso", "Não foi possível carregar as cotações agora. Atualize a página em instantes.");
    if ($("panel-agro")) setHtml("panel-agro", "");
    if ($("cot-tag")) { setText("cot-tag", "Indisponível"); $("cot-tag").className = "tag"; }
    if ($("home-stats")) fail("home-stats", "Preços indisponíveis agora.");
  });
}

/* Notícias do mercado */
function loadNoticias() {
  getJson("data/noticias.json").then(function (d) {
    var itens = (d.itens || []).slice().sort(byDateDesc);
    var st = stampText(d.atualizadoEm);
    if (st) setText("news-stamp", "Atualizado em " + st.text);
    if (PAGE === "inicio") setHtml("home-news", newsList(itens.slice(0, 6)));
    if (PAGE === "noticias") chipFilter("news-chips", "news-list", itens, function (n) { return n.tema; }, TEMAS, newsList);
    if (PAGE === "cotacoes") setHtml("cot-news", newsList(itens.filter(function (n) { return n.tema !== "geral"; }).slice(0, 6)));
  }).catch(function () {
    ["home-news", "news-list", "cot-news"].forEach(function (id) { if ($(id)) setHtml(id, '<li class="sub">Notícias indisponíveis agora. Atualize a página em instantes.</li>'); });
  });
}

/* Notícias do clima e links oficiais */
function loadClimaDados() {
  getJson("data/clima.json").then(function (d) {
    var itens = (d.noticias || []).slice().sort(byDateDesc);
    if (PAGE === "inicio") setHtml("home-clima-news", newsList(itens.slice(0, 3)));
    if (PAGE === "clima") {
      chipFilter("clima-chips", "clima-news", itens, function (n) { return n.regiao; }, {}, newsList);
      setHtml("clima-links", (d.links || []).map(function (l) {
        var u = safeUrl(l.url);
        return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener"><strong>' + esc(l.nome) + "</strong><span>" + esc(l.serve_para) + "</span></a>" : "";
      }).join(""));
      var s = d.sazonal;
      if (s && s.texto) {
        setHtml("clima-sazonal", '<div class="panel outlook"><h3>Perspectiva para os próximos meses</h3><p style="margin:0 0 8px">' + esc(s.texto) + '</p><p class="sub" style="margin:0">Fonte: ' + link(s.fonte, s.url) + (s.data ? ", " + esc(s.data) : "") + "</p></div>");
      } else if ($("clima-sazonal")) $("clima-sazonal").hidden = true;
    }
  }).catch(function () {
    ["home-clima-news", "clima-news"].forEach(function (id) { if ($(id)) setHtml(id, '<li class="sub">Notícias do clima indisponíveis agora.</li>'); });
  });
}

/* Dicas e artigos técnicos */
var AREA_GRUPOS = { lavoura: ["cafe", "milho", "soja", "feijao", "geral"], pecuaria: ["corte", "recria", "leite"] };
function loadDicas() {
  getJson("data/dicas.json").then(function (d) {
    var dicas = d.dicas || [], artigos = (d.artigos || []);
    if (PAGE === "inicio") setHtml("home-dica", dicaDoDia(dicas) || '<p class="sub">Sem dicas no momento.</p>');
    if (PAGE === "dicas") {
      var st = stampText(d.atualizadoEm);
      if (st) setText("dicas-stamp", "Atualizado em " + st.text);
      chipFilter("dicas-chips", "dicas-list", dicas, function (x) { return x.area || x.cultura; }, AREAS, function (l) { return l.length ? l.map(dicaCard).join("") : '<p class="sub">Nenhuma dica neste filtro.</p>'; });
      setHtml("artigos-lav", artigos.filter(function (a) { return AREA_GRUPOS.lavoura.indexOf(a.area || a.cultura) >= 0; }).map(artigoLi).join("") || '<li class="sub">Sem leituras no momento.</li>');
      setHtml("artigos-pec", artigos.filter(function (a) { return AREA_GRUPOS.pecuaria.indexOf(a.area || a.cultura) >= 0; }).map(artigoLi).join("") || '<li class="sub">Sem leituras no momento.</li>');
    }
    if (PAGE === "noticias") {
      setHtml("prod-lav", artigos.filter(function (a) { return AREA_GRUPOS.lavoura.indexOf(a.area || a.cultura) >= 0; }).slice(0, 5).map(artigoLi).join("") || '<li class="sub">Sem leituras no momento.</li>');
      setHtml("prod-pec", artigos.filter(function (a) { return AREA_GRUPOS.pecuaria.indexOf(a.area || a.cultura) >= 0; }).slice(0, 5).map(artigoLi).join("") || '<li class="sub">Sem leituras no momento.</li>');
    }
  }).catch(function () {
    ["home-dica", "dicas-list", "artigos-lav", "artigos-pec", "prod-lav", "prod-pec"].forEach(function (id) { if ($(id)) setHtml(id, '<p class="sub">Conteúdo indisponível agora. Atualize a página em instantes.</p>'); });
  });
}

/* Clima */
var CITIES = [
  { n: "Alfenas", lat: -21.43, lon: -45.95, g: "Sul de Minas" },
  { n: "Andradas", lat: -22.07, lon: -46.57, g: "Sul de Minas" },
  { n: "Areado", lat: -21.36, lon: -46.14, g: "Sul de Minas" },
  { n: "Boa Esperança", lat: -21.09, lon: -45.57, g: "Sul de Minas" },
  { n: "Cambuquira", lat: -21.85, lon: -45.30, g: "Sul de Minas" },
  { n: "Campanha", lat: -21.84, lon: -45.40, g: "Sul de Minas" },
  { n: "Campos Gerais", lat: -21.24, lon: -45.76, g: "Sul de Minas" },
  { n: "Carmo de Minas", lat: -22.12, lon: -45.13, g: "Sul de Minas" },
  { n: "Cássia", lat: -20.58, lon: -46.92, g: "Sul de Minas" },
  { n: "Caxambu", lat: -21.98, lon: -44.93, g: "Sul de Minas" },
  { n: "Elói Mendes", lat: -21.61, lon: -45.57, g: "Sul de Minas" },
  { n: "Extrema", lat: -22.85, lon: -46.32, g: "Sul de Minas" },
  { n: "Guaxupé", lat: -21.31, lon: -46.71, g: "Sul de Minas" },
  { n: "Itajubá", lat: -22.42, lon: -45.45, g: "Sul de Minas" },
  { n: "Lavras", lat: -21.25, lon: -45.00, g: "Sul de Minas" },
  { n: "Machado", lat: -21.68, lon: -45.92, g: "Sul de Minas" },
  { n: "Monte Santo de Minas", lat: -21.19, lon: -46.98, g: "Sul de Minas" },
  { n: "Muzambinho", lat: -21.37, lon: -46.53, g: "Sul de Minas" },
  { n: "Nepomuceno", lat: -21.23, lon: -45.23, g: "Sul de Minas" },
  { n: "Ouro Fino", lat: -22.28, lon: -46.37, g: "Sul de Minas" },
  { n: "Paraguaçu", lat: -21.55, lon: -45.74, g: "Sul de Minas" },
  { n: "Passos", lat: -20.72, lon: -46.61, g: "Sul de Minas" },
  { n: "Poços de Caldas", lat: -21.79, lon: -46.56, g: "Sul de Minas" },
  { n: "Pouso Alegre", lat: -22.23, lon: -45.94, g: "Sul de Minas" },
  { n: "Santa Rita do Sapucaí", lat: -22.25, lon: -45.71, g: "Sul de Minas" },
  { n: "São Lourenço", lat: -22.12, lon: -45.05, g: "Sul de Minas" },
  { n: "São Sebastião do Paraíso", lat: -20.92, lon: -46.99, g: "Sul de Minas" },
  { n: "Três Corações", lat: -21.69, lon: -45.25, g: "Sul de Minas" },
  { n: "Três Pontas", lat: -21.37, lon: -45.51, g: "Sul de Minas" },
  { n: "Varginha", lat: -21.55, lon: -45.43, g: "Sul de Minas" },
  { n: "Campo Belo", lat: -20.90, lon: -45.28, g: "Centro-Oeste" },
  { n: "Divinópolis", lat: -20.14, lon: -44.88, g: "Centro-Oeste" },
  { n: "Araguari", lat: -18.65, lon: -48.19, g: "Triângulo" },
  { n: "Uberaba", lat: -19.75, lon: -47.93, g: "Triângulo" },
  { n: "Uberlândia", lat: -18.92, lon: -48.28, g: "Triângulo" },
  { n: "Patos de Minas", lat: -18.58, lon: -46.52, g: "Alto Paranaíba" },
  { n: "Patrocínio", lat: -18.94, lon: -46.99, g: "Alto Paranaíba" },
  { n: "Paracatu", lat: -17.22, lon: -46.87, g: "Noroeste" },
  { n: "Unaí", lat: -16.36, lon: -46.91, g: "Noroeste" },
  { n: "Montes Claros", lat: -16.73, lon: -43.86, g: "Norte de Minas" },
  { n: "Governador Valadares", lat: -18.85, lon: -41.95, g: "Vale do Rio Doce" },
  { n: "Juiz de Fora", lat: -21.76, lon: -43.35, g: "Zona da Mata" },
  { n: "Manhuaçu", lat: -20.26, lon: -42.03, g: "Zona da Mata" },
  { n: "Belo Horizonte", lat: -19.92, lon: -43.94, g: "Região Central" }
];
var current = CITIES.filter(function (c) { return c.n === "Varginha"; })[0];
var WMO = function (c) {
  if (c === 0) return "Céu limpo";
  if (c <= 2) return "Poucas nuvens";
  if (c === 3) return "Nublado";
  if (c === 45 || c === 48) return "Neblina";
  if (c >= 51 && c <= 57) return "Garoa";
  if (c >= 61 && c <= 67) return "Chuva";
  if (c >= 80 && c <= 82) return "Pancadas";
  if (c >= 95) return "Trovoadas";
  return "Variável";
};
function sampleWeather() {
  var t0 = new Date(), days = [], mins = [4.5, 2.5, 1.5, 6, 9], maxs = [24, 21, 19, 22, 25], rain = [0, 2, 0, 34, 12], codes = [1, 3, 0, 82, 61];
  for (var i = 0; i < 5; i++) days.push({ date: new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i), min: mins[i], max: maxs[i], rain: rain[i], code: codes[i] });
  return { now: { temp: 21, code: 1 }, days: days, live: false };
}
function fetchWeather(c) {
  var url = "https://api.open-meteo.com/v1/forecast?latitude=" + c.lat + "&longitude=" + c.lon +
    "&current=temperature_2m,weather_code&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code&timezone=America%2FSao_Paulo&forecast_days=5";
  return fetch(url).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); }).then(function (j) {
    var days = j.daily.time.map(function (s, i) {
      var p = s.split("-");
      return { date: new Date(+p[0], +p[1] - 1, +p[2]), min: j.daily.temperature_2m_min[i], max: j.daily.temperature_2m_max[i], rain: j.daily.precipitation_sum[i], code: j.daily.weather_code[i] };
    });
    return { now: { temp: j.current.temperature_2m, code: j.current.weather_code }, days: days, live: true };
  });
}
var fmtDay = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
function placeHtml(c) {
  return esc(c.n) + " · " + esc(c.g) + (PAGE === "inicio" ? ' <a href="clima.html">trocar cidade</a>' : "");
}
function renderWeather(c, w) {
  setHtml("wx-place", placeHtml(c));
  setText("wx-temp", Math.round(w.now.temp) + " °C");
  setText("wx-cond", WMO(w.now.code));
  var st = $("wx-status");
  if (st) { st.textContent = w.live ? "Previsão ao vivo" : "Exemplo da pré-visualização"; st.className = "tag" + (w.live ? " live" : ""); }
  var al = [];
  w.days.forEach(function (d, i) {
    var when = i === 0 ? "Hoje" : (i === 1 ? "Amanhã" : fmtDay.format(d.date));
    if (d.min <= 1) al.push({ k: "crit", t: "Geada provável · " + when, m: "Mínima prevista de " + Math.round(d.min) + " °C." });
    else if (d.min <= 3) al.push({ k: "warn", t: "Risco de geada · " + when, m: "Mínima prevista de " + Math.round(d.min) + " °C." });
    if (d.rain >= 50) al.push({ k: "crit", t: "Chuva muito forte · " + when, m: "Cerca de " + Math.round(d.rain) + " mm previstos." });
    else if (d.rain >= 30) al.push({ k: "warn", t: "Chuva forte · " + when, m: "Cerca de " + Math.round(d.rain) + " mm previstos." });
  });
  setHtml("alerts", al.length
    ? al.map(function (a) { return '<div class="alert ' + a.k + '"><strong>' + esc(a.t) + "</strong>" + esc(a.m) + "</div>"; }).join("")
    : '<div class="alert ok"><strong>Sem alertas nos próximos 5 dias</strong>Nenhuma geada nem chuva forte prevista.</div>');
  setHtml("days", w.days.map(function (d, i) {
    var cls = "day" + (d.min <= 3 ? " frost" : "") + (d.rain >= 30 ? " heavy" : "");
    var name = i === 0 ? "Hoje" : fmtDay.format(d.date).replace(".", "");
    return '<div class="' + cls + '"><div class="dn">' + esc(name) + '</div><div class="dc">' + esc(WMO(d.code)) +
      '</div><div class="mm"><span>' + Math.round(d.min) + "°</span> / " + Math.round(d.max) + '°</div><div class="rain">' + Math.round(d.rain) + " mm</div></div>";
  }).join(""));
}
function weatherUnavailable(c) {
  setHtml("wx-place", placeHtml(c));
  setText("wx-temp", "—");
  setText("wx-cond", "Previsão indisponível agora");
  var st = $("wx-status"); if (st) { st.textContent = "Indisponível"; st.className = "tag"; }
  setHtml("alerts", '<div class="alert warn"><strong>Não foi possível obter a previsão</strong>Atualize a página em instantes e consulte o INMET e a Defesa Civil.</div>');
  setHtml("days", "");
}
function saveCity() { try { localStorage.setItem("prosa-cidade", JSON.stringify(current)); } catch (e) {} }
function loadWeather() {
  var c = current;
  fetchWeather(c).then(function (w) { if (current === c) renderWeather(c, w); })
    .catch(function () { if (current !== c) return; if (PREVIEW) renderWeather(c, sampleWeather()); else weatherUnavailable(c); });
}
function restoreCity() {
  try {
    var saved = JSON.parse(localStorage.getItem("prosa-cidade") || "null");
    if (saved && typeof saved.n === "string" && isFinite(saved.lat) && isFinite(saved.lon) && saved.lat < -14 && saved.lat > -23.5 && saved.lon > -52 && saved.lon < -39) {
      var known = CITIES.filter(function (c) { return c.n === saved.n; })[0];
      current = known || { n: saved.n.slice(0, 60), lat: +saved.lat, lon: +saved.lon, g: "Minas Gerais" };
    }
  } catch (e) {}
}
function buildCitySelect() {
  var sel = $("city"), groups = [], byGroup = {};
  CITIES.forEach(function (c, i) { if (!byGroup[c.g]) { byGroup[c.g] = []; groups.push(c.g); } byGroup[c.g].push(i); });
  var html = "";
  groups.forEach(function (g) {
    html += '<optgroup label="' + esc(g) + '">' + byGroup[g].map(function (i) { return '<option value="' + i + '">' + esc(CITIES[i].n) + "</option>"; }).join("") + "</optgroup>";
  });
  html += '<optgroup label="Cidade buscada" id="custom-group" hidden><option value="custom" id="custom-opt"></option></optgroup>';
  sel.innerHTML = html;
}
function syncSelect() {
  var idx = CITIES.indexOf(current);
  if (idx >= 0) { $("city").value = String(idx); $("custom-group").hidden = true; return; }
  $("custom-opt").textContent = current.n;
  $("custom-group").hidden = false;
  $("city").value = "custom";
}
function chooseCity(c) { current = c; saveCity(); syncSelect(); loadWeather(); }
function inMinas(x) {
  return x && x.admin1 === "Minas Gerais" && isFinite(x.latitude) && isFinite(x.longitude) && x.latitude < -14 && x.latitude > -23.5 && x.longitude > -52 && x.longitude < -39;
}
function searchCity(q) {
  var url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(q) + "&count=20&language=pt&format=json&countryCode=BR";
  return fetch(url).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); }).then(function (j) {
    var seen = {}, out = [];
    (j.results || []).filter(inMinas).forEach(function (x) {
      var k = x.name + "|" + x.latitude.toFixed(1) + "|" + x.longitude.toFixed(1);
      if (!seen[k]) { seen[k] = 1; out.push({ n: x.name, lat: +x.latitude, lon: +x.longitude, g: "Minas Gerais" }); }
    });
    return out;
  });
}
function showResults(list, msg) {
  var box = $("city-results");
  box.hidden = false;
  if (msg) { box.innerHTML = '<span class="sub">' + esc(msg) + "</span>"; return; }
  box.innerHTML = list.map(function (c, i) { return '<button type="button" data-i="' + i + '">' + esc(c.n) + "</button>"; }).join("");
  Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () { box.hidden = true; $("city-q").value = ""; chooseCity(list[+b.getAttribute("data-i")]); });
  });
}
function initCityControls() {
  buildCitySelect();
  syncSelect();
  $("city").addEventListener("change", function () {
    var v = $("city").value;
    if (v === "custom") return;
    chooseCity(CITIES[+v]);
  });
  $("city-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var q = $("city-q").value.trim();
    if (q.length < 2) { showResults([], "Digite pelo menos 2 letras do nome da cidade."); return; }
    showResults([], "Buscando…");
    searchCity(q).then(function (list) {
      if (!list.length) showResults([], "Nenhuma cidade de Minas Gerais encontrada com esse nome.");
      else showResults(list);
    }).catch(function () { showResults([], "Não foi possível buscar agora. Escolha uma cidade da lista."); });
  });
}

/* Abas Agro e Dólar (Cotações); o endereço cotacoes.html#dolar abre a aba do dólar */
function initTabs() {
  var tabs = [["tab-agro", "panel-agro"], ["tab-usd", "panel-usd"]];
  function select(id) {
    tabs.forEach(function (o) {
      var on = o[0] === id;
      $(o[0]).setAttribute("aria-selected", on ? "true" : "false");
      $(o[1]).hidden = !on;
    });
  }
  tabs.forEach(function (t) { $(t[0]).addEventListener("click", function () { select(t[0]); }); });
  if (location.hash === "#dolar") select("tab-usd");
  window.addEventListener("hashchange", function () { select(location.hash === "#dolar" ? "tab-usd" : "tab-agro"); });
}

(function init() {
  setText("today", new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()));
  loadCotacoes();
  if (PAGE === "inicio" || PAGE === "noticias" || PAGE === "cotacoes") loadNoticias();
  if (PAGE === "inicio" || PAGE === "clima") loadClimaDados();
  if (PAGE === "inicio" || PAGE === "dicas" || PAGE === "noticias") loadDicas();
  if (PAGE === "inicio" || PAGE === "clima") { restoreCity(); if (PAGE === "clima") initCityControls(); loadWeather(); }
  if (PAGE === "cotacoes") initTabs();
})();
