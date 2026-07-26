(function () {
  "use strict";
  function text(value) { return value == null ? "" : String(value); }
  function youtubeId(url) {
    var match = text(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return match ? match[1] : "";
  }
  function renderBlock(block) {
    var type = block && block.type;
    if (type === "heading") {
      var h = document.createElement("h2"); h.textContent = text(block.text); return h;
    }
    if (type === "quote") {
      var q = document.createElement("blockquote"); q.textContent = text(block.text); return q;
    }
    if (type === "image" && block.url) {
      var figure = document.createElement("figure");
      var image = document.createElement("img"); image.src = block.url; image.alt = text(block.caption);
      figure.appendChild(image);
      if (block.caption) { var caption = document.createElement("figcaption"); caption.textContent = block.caption; figure.appendChild(caption); }
      return figure;
    }
    if (type === "video" && youtubeId(block.url)) {
      var wrap = document.createElement("div"); wrap.className = "news-video";
      var frame = document.createElement("iframe"); frame.src = "https://www.youtube-nocookie.com/embed/" + youtubeId(block.url);
      frame.title = "Supporting video"; frame.loading = "lazy"; frame.allowFullscreen = true;
      wrap.appendChild(frame); return wrap;
    }
    var p = document.createElement("p"); p.textContent = text(block.text); return p;
  }
  async function load() {
    var slug = new URLSearchParams(location.search).get("slug");
    var loading = document.getElementById("news-article-loading");
    if (!slug) { loading.textContent = "Article not found."; return; }
    var result = await window.diriSupabase.from("news_articles").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (result.error || !result.data) { loading.textContent = "This article is unavailable."; return; }
    var article = result.data;
    document.title = article.title + " — DIRI";
    document.getElementById("news-article-category").textContent = article.category;
    document.getElementById("news-article-date").textContent = new Date(article.published_at).toLocaleDateString(undefined, { day:"numeric", month:"long", year:"numeric" });
    document.getElementById("news-article-title").textContent = article.title;
    document.getElementById("news-article-summary").textContent = article.summary;
    document.getElementById("news-article-reviewer").textContent = article.reviewer || "DIRI Editorial Desk";
    var hero = article.preview_image_url || article.image_url;
    if (hero) document.getElementById("news-article-hero").src = hero;
    else document.getElementById("news-article-hero-wrap").hidden = true;
    var body = document.getElementById("news-article-body");
    var blocks = Array.isArray(article.content_blocks) && article.content_blocks.length
      ? article.content_blocks
      : (article.body || []).map(function (paragraph) { return { type:"paragraph", text:paragraph }; });
    blocks.forEach(function (block) { body.appendChild(renderBlock(block)); });
    loading.hidden = true; document.getElementById("news-article-content").hidden = false;
  }
  document.addEventListener("DOMContentLoaded", function () { load().catch(function () {
    document.getElementById("news-article-loading").textContent = "The article could not be loaded.";
  }); });
})();
