const cards = [...document.querySelectorAll(".photo-card")];
const filterButtons = [...document.querySelectorAll(".filter-chip")];
const search = document.querySelector("#photo-search");
const emptyState = document.querySelector("#empty-state");
let activeFilter = "all";

function updateGallery() {
  const term = search.value.trim().toLocaleLowerCase("et");
  let visible = 0;

  for (const card of cards) {
    const matchesFilter = activeFilter === "all" || card.dataset.kind === activeFilter;
    const matchesSearch = !term || card.dataset.search.toLocaleLowerCase("et").includes(term);
    const show = matchesFilter && matchesSearch;
    card.hidden = !show;
    if (show) visible += 1;
  }

  emptyState.hidden = visible > 0;
}

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    for (const item of filterButtons) {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    }
    updateGallery();
  });
}

search.addEventListener("input", updateGallery);

for (const image of document.querySelectorAll(".photo-card img, .hero-image img")) {
  image.addEventListener("error", () => {
    image.closest(".photo-link, .hero-image").classList.add("image-unavailable");
  }, { once: true });
}
