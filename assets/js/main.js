/* ============================================================
   ムラツムギ 公式サイト 共通スクリプト
   コンテンツは /content/*.json から読み込んで描画します。
   日常の更新は JSON ファイル(または管理画面)の編集だけで完結し、
   このファイルを触る必要はありません。
   ============================================================ */

// ---------- 小さなユーティリティ ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 改行区切りテキスト → 段落HTML(URLは自動リンク)
function paragraphs(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map(p => `<p>${esc(p.trim()).replace(/\n/g, "<br>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')}</p>`)
    .join("");
}

// 見出し(## / ###)・区切り線(⸻)・図解([図解])対応の本文HTML
function richText(text, imageSrc, imageAlt) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map(block => {
      const b = block.trim();
      if (b === "[図解]") {
        return imageSrc
          ? `<figure class="rich-figure"><img src="${esc(imageSrc)}" alt="${esc(imageAlt || "")}" loading="lazy"></figure>`
          : "";
      }
      if (b === "⸻" || b === "---") return `<hr class="rich-hr">`;
      if (b.startsWith("### ")) return `<h3>${esc(b.slice(4))}</h3>`;
      if (b.startsWith("## ")) return `<h2>${esc(b.slice(3))}</h2>`;
      return `<p>${esc(b).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path} の読み込みに失敗しました`);
  return res.json();
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- ナビゲーション開閉(モバイル) ----------
const toggle = $(".nav-toggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// ---------- 現在ページのナビ強調 ----------
{
  const here = location.pathname.split("/").pop() || "index.html";
  $$(".global-nav a").forEach(a => {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });
}

// ---------- 波線ディバイダー(ロゴのモチーフをSVGで再現) ----------
$$(".wave").forEach(el => {
  // 幅60pxの浅い弧を繰り返す。ロゴの波線と同じ「ぬいとり」のリズム。
  let d = "";
  for (let x = 0; x <= 2400; x += 60) d += `M ${x} 14 Q ${x + 30} 30 ${x + 60} 14 `;
  el.innerHTML =
    `<svg viewBox="0 0 2400 28" preserveAspectRatio="none" aria-hidden="true">
       <path d="${d}" fill="none" stroke="#EA5413" stroke-width="2.5" stroke-linecap="round"/>
     </svg>`;
});

// ---------- スクロールリビール ----------
// 注意: コンテンツはJSONから後で挿入されるため、描画完了(content-ready)の
// たびに新しい .reveal 要素を監視対象に加える。
{
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  const watchReveals = () => $$(".reveal:not(.is-visible)").forEach(el => io.observe(el));
  watchReveals();
  document.addEventListener("content-ready", watchReveals);
}

// 活動カード(トップページ用。url があればカード全体がリンクに)
function activityCard(a, idx) {
  const num = String(idx + 1).padStart(2, "0");
  const inner = `
      <p class="card-number">${num}</p>
      <span class="card-tag">${esc(a.tag)}</span>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.summary)}</p>
      ${a.url ? `<span class="card-link-hint">ウェブサイトへ ↗</span>` : ""}`;
  return a.url
    ? `<a class="stitch-card reveal" href="${esc(a.url)}" target="_blank" rel="noopener">${inner}</a>`
    : `<div class="stitch-card reveal">${inner}</div>`;
}

// 活動詳細行(活動内容ページ用。写真枠は未設定でも確保)
function activityRow(a, idx) {
  const num = String(idx + 1).padStart(2, "0");
  const photo = a.photo
    ? `<img class="activity-photo" src="${esc(a.photo)}" alt="${esc(a.title)}">`
    : `<div class="activity-photo activity-photo--placeholder">写真準備中</div>`;
  const title = a.url
    ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)} ↗</a>`
    : esc(a.title);
  return `
    <div class="activity-row reveal">
      ${photo}
      <div>
        <p class="activity-number">${num}</p>
        <h2>${title}</h2>
        <span class="card-tag">${esc(a.tag)}</span>
        <p class="activity-desc">${esc(a.description || a.summary)}</p>
        ${a.url ? `<p class="activity-link"><a class="btn" href="${esc(a.url)}" target="_blank" rel="noopener">家史のウェブサイトへ ↗</a></p>` : ""}
      </div>
    </div>`;
}

// ---------- ページ別レンダリング ----------
const page = document.body.dataset.page;

const renderers = {

  async home() {
    const [site, news, activities] = await Promise.all([
      loadJSON("content/site.json"),
      loadJSON("content/news.json"),
      loadJSON("content/activities.json"),
    ]);

    // 活動ダイジェスト(先頭3件)
    const actWrap = $("#home-activities");
    if (actWrap) actWrap.innerHTML = activities.items.map((a, i) => activityCard(a, i)).join("");

    // お知らせ最新3件
    const newsWrap = $("#home-news");
    if (newsWrap) {
      const items = [...news.items].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 3);
      newsWrap.innerHTML = items.map(n => `
        <li><a href="news.html#${esc(n.id)}">
          <span class="news-date">${fmtDate(n.date)}</span>
          <span class="news-cat">${esc(n.category)}</span>
          <span class="news-title">${esc(n.title)}</span>
        </a></li>`).join("");
    }

    // Noteリンク
    $$("[data-note-url]").forEach(a => a.href = site.note_url);
    document.dispatchEvent(new Event("content-ready"));
  },

  async about() {
    const [site, about] = await Promise.all([
      loadJSON("content/site.json"),
      loadJSON("content/about.json"),
    ]);
    $("#about-body").innerHTML = paragraphs(about.body);
    if (about.philosophy_title) {
      $("#philosophy-title").textContent = about.philosophy_title;
      $("#philosophy-body").innerHTML = richText(
        about.philosophy_body, about.philosophy_image,
        "ムラツムギの考え方の図解: 変化への抵抗シナリオと適応シナリオ");
    }
    $("#org-table").innerHTML = site.org.map(row =>
      `<dt>${esc(row.label)}</dt><dd>${paragraphs(row.value)}</dd>`).join("");
    document.dispatchEvent(new Event("content-ready"));
  },

  async activities() {
    const data = await loadJSON("content/activities.json");
    $("#activities-list").innerHTML = data.items.map((a, i) => activityRow(a, i)).join("");
    document.dispatchEvent(new Event("content-ready"));
  },


  async works() {
    const data = await loadJSON("content/works.json");
    $("#works-list").innerHTML = data.items.map((w, i) => {
      const num = String(i + 1).padStart(2, "0");
      const photo = w.photo
        ? `<img class="activity-photo" src="${esc(w.photo)}" alt="${esc(w.title)}">`
        : `<div class="activity-photo activity-photo--placeholder">写真準備中</div>`;
      return `
        <div class="activity-row reveal">
          ${photo}
          <div>
            <p class="activity-number">${num}</p>
            <h2>${esc(w.title)}</h2>
            ${w.meta ? `<span class="card-tag">${esc(w.meta)}</span>` : ""}
            <div class="activity-desc">${paragraphs(w.description)}</div>
          </div>
        </div>`;
    }).join("");
    document.dispatchEvent(new Event("content-ready"));
  },

  async members() {
    const data = await loadJSON("content/members.json");

    const photo = (m, cls = "") => m.photo
      ? `<img class="member-photo ${cls}" src="${esc(m.photo)}" alt="${esc(m.name)}">`
      : `<div class="member-photo member-photo--placeholder ${cls}">${esc((m.name || "?").charAt(0))}</div>`;

    $("#member-grid").innerHTML = data.members.map(m => `
      <div class="member reveal">
        <div class="member-photo-frame">${photo(m)}</div>
        <div class="member-name">${esc(m.name)}<small>${esc(m.romaji || "")}</small></div>
        <div class="member-role">${esc(m.role)}</div>
        <p class="member-bio">${esc(m.bio)}</p>
      </div>`).join("");

    const simple = $("#simple-member-list");
    if (simple) {
      const list = data.simple_members || [];
      simple.innerHTML = list.map(m => `<li>${esc(m.name)}</li>`).join("");
      simple.closest(".simple-member-block").style.display = list.length ? "" : "none";
    }

    $("#advisor-list").innerHTML = data.advisors.map(a => `
      <div class="advisor reveal">
        <div class="member-photo-frame">${photo(a)}</div>
        <div>
          <div class="advisor-name">${esc(a.name)}</div>
          <div class="advisor-affil">${esc(a.affiliation)}</div>
          <p class="advisor-bio">${esc(a.bio)}</p>
        </div>
      </div>`).join("");
    document.dispatchEvent(new Event("content-ready"));
  },

  async message() {
    const data = await loadJSON("content/message.json");
    $("#message-title").textContent = data.title;
    $("#message-body").innerHTML = paragraphs(data.body);
    $("#message-sign").innerHTML =
      `<small>${esc(data.sign_title)}</small>${esc(data.sign_name)}`;
    document.dispatchEvent(new Event("content-ready"));
  },

  async news() {
    const data = await loadJSON("content/news.json");
    const items = [...data.items].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("#news-articles").innerHTML = items.map(n => `
      <article class="news-article" id="${esc(n.id)}">
        <span class="news-date">${fmtDate(n.date)}</span>
        <span class="news-cat">${esc(n.category)}</span>
        <h2>${esc(n.title)}</h2>
        ${n.photo ? `<img class="news-photo" src="${esc(n.photo)}" alt="">` : ""}
        <div class="news-body">${paragraphs(n.body)}</div>
      </article>`).join("");
    // ハッシュ指定があればスクロール
    if (location.hash) $(location.hash)?.scrollIntoView();
    document.dispatchEvent(new Event("content-ready"));
  },

  async contact() {
    const site = await loadJSON("content/site.json");
    const wrap = $("#form-embed");
    if (site.contact_form_url) {
      wrap.innerHTML = `<iframe src="${esc(site.contact_form_url)}"
        title="お問い合わせフォーム" loading="lazy">読み込んでいます…</iframe>`;
    } else {
      wrap.innerHTML = `<div class="form-placeholder">
        お問い合わせフォームは準備中です。<br>
        (管理画面の「サイト基本情報」で GoogleフォームのURL を設定すると、ここに表示されます)
      </div>`;
    }
    document.dispatchEvent(new Event("content-ready"));
  },
};

if (page && renderers[page]) {
  renderers[page]().catch(err => {
    console.error(err);
  });
}
