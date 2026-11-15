const form = document.querySelector("#lens-search");
const queryInput = document.querySelector("#lens-query");
const grid = document.querySelector("#photo-grid");
const status = document.querySelector("#search-status");
const resultsHeading = document.querySelector("#results-heading");
const resultsSummary = document.querySelector("#results-summary");
const flickrSearchLink = document.querySelector("#flickr-search-link");
const suggestions = [...document.querySelectorAll("[data-query]")];

let activeRequest = 0;

function normalize(value) {
  return value.toLocaleLowerCase("et").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function searchTags(query) {
  const ignored = new Set(["lens", "objektiiv", "the", "for", "mount"]);
  return [...new Set(normalize(query).split(" ").filter((part) => part.length > 1 && !ignored.has(part)))].slice(0, 6);
}

function relevance(item, tokens, query) {
  const title = normalize(item.title || "");
  const tags = normalize(item.tags || "");
  const haystack = `${title} ${tags}`;
  const exact = haystack.includes(normalize(query)) ? 30 : 0;
  const tokenMatches = tokens.reduce((score, token) => score + (haystack.includes(token) ? 6 : 0), 0);
  const titleMatches = tokens.reduce((score, token) => score + (title.includes(token) ? 3 : 0), 0);
  const descriptiveTitle = title && title !== "untitled" ? Math.min(title.length, 40) / 40 : 0;
  return exact + tokenMatches + titleMatches + descriptiveTitle;
}

function authorName(author) {
  const match = String(author || "").match(/\("(.+)"\)/);
  return match ? match[1] : "Flickr-i autor";
}

function largerImage(url) {
  return String(url || "").replace(/_m(\.[a-z]+)$/i, "_z$1");
}

function makeCard(item, index, query) {
  const article = document.createElement("article");
  article.className = `photo-card${index === 0 ? " card-large" : ""}`;
  const link = document.createElement("a");
  link.className = "photo-link";
  link.href = item.link;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `Ava ${item.title || "foto"} Flickr-is`);
  const image = document.createElement("img");
  image.src = largerImage(item.media?.m);
  image.alt = item.title || `Näidisfoto objektiiviga ${query}`;
  image.loading = index < 3 ? "eager" : "lazy";
  image.addEventListener("error", () => { if (image.src !== item.media?.m) image.src = item.media?.m; }, { once: true });
  const overlay = document.createElement("span");
  overlay.className = "image-overlay";
  const topline = document.createElement("span");
  topline.className = "card-topline";
  const pill = document.createElement("span");
  pill.className = `pill${index < 3 ? " best-match" : ""}`;
  pill.textContent = index < 3 ? "PARIM VASTE" : "FLICKR";
  const arrow = document.createElement("span");
  arrow.className = "arrow-bubble";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  topline.append(pill, arrow);
  const copy = document.createElement("span");
  copy.className = "card-copy";
  const lens = document.createElement("span");
  lens.className = "card-lens";
  lens.textContent = query;
  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = item.title || "Pealkirjata foto";
  const author = document.createElement("span");
  author.className = "card-author";
  author.textContent = `${authorName(item.author)} · Flickr`;
  copy.append(lens, title, author);
  link.append(image, overlay, topline, copy);
  article.append(link);
  return article;
}

function setStatus(kind, title, message) {
  status.className = `search-status ${kind}`;
  status.hidden = false;
  status.innerHTML = "";
  const mark = document.createElement("span");
  mark.className = "status-mark";
  mark.textContent = kind === "loading" ? "···" : kind === "error" ? "!" : "VL";
  const copy = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  copy.append(strong, paragraph);
  status.append(mark, copy);
}

function requestFeed(tags, tagmode, requestId) {
  return new Promise((resolve, reject) => {
    const callbackName = `vintagelensFeed${requestId}${tagmode}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => finish(new Error("Flickr-i vastus võttis liiga kaua aega.")), 12000);
    function finish(error, data) {
      window.clearTimeout(timer);
      script.remove();
      delete window[callbackName];
      error ? reject(error) : resolve(data?.items || []);
    }
    window[callbackName] = (data) => finish(null, data);
    script.onerror = () => finish(new Error("Flickr-i fotovoogu ei saanud laadida."));
    const params = new URLSearchParams({ tags: tags.join(","), tagmode, format: "json", jsoncallback: callbackName });
    script.src = `https://www.flickr.com/services/feeds/photos_public.gne?${params}`;
    document.head.append(script);
  });
}

async function runSearch(query) {
  const requestId = ++activeRequest;
  const tokens = searchTags(query);
  if (!tokens.length) return;
  grid.hidden = true;
  resultsHeading.hidden = true;
  setStatus("loading", `Otsin: ${query}`, "Laen Flickr-ist objektiivi nimele vastavaid fotosid…");
  try {
    let items = await requestFeed(tokens, "all", requestId);
    if (!items.length) items = await requestFeed(tokens, "any", requestId);
    if (requestId !== activeRequest) return;
    const unique = [...new Map(items.filter((item) => item.link && item.media?.m).map((item) => [item.link, item])).values()];
    const ranked = unique.map((item) => ({ item, score: relevance(item, tokens, query) })).sort((a, b) => b.score - a.score).map(({ item }) => item);
    flickrSearchLink.href = `https://www.flickr.com/search/?text=${encodeURIComponent(query)}`;
    resultsHeading.hidden = false;
    if (!ranked.length) {
      grid.replaceChildren();
      setStatus("empty", "Pilte ei leitud", "Proovi lühemat nime, jäta ava või bajonett välja või kasuta ainult tootjat ja fookuskaugust.");
      resultsSummary.textContent = `Otsing „${query}“`;
      return;
    }
    grid.replaceChildren(...ranked.map((item, index) => makeCard(item, index, query)));
    grid.hidden = false;
    status.hidden = true;
    resultsSummary.textContent = `${ranked.length} tulemust · parimad vasted eespool`;
  } catch (error) {
    if (requestId !== activeRequest) return;
    setStatus("error", "Otsing ebaõnnestus", error.message || "Palun proovi mõne hetke pärast uuesti.");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();
  if (query) runSearch(query);
});

for (const suggestion of suggestions) {
  suggestion.addEventListener("click", () => {
    queryInput.value = suggestion.dataset.query;
    runSearch(suggestion.dataset.query);
  });
}
