// ============================================================
// Binge & Bound: script.js
// This one file powers all four pages. Each function below
// checks whether its page is open, and only runs if it is.
// ============================================================


// ---------- 1. SETTINGS YOU EDIT ONCE ----------
// These come from https://giscus.app (see README.md for the steps).
// Until you fill them in, the comment boxes show a friendly notice.
const GISCUS = {
  repo: "YOUR-USERNAME/binge-and-bound",
  repoId: "PASTE-REPO-ID",
  category: "Announcements",
  categoryId: "PASTE-CATEGORY-ID",
};


// ---------- 2. SMALL HELPERS ----------

// Makes text safe to drop into HTML, so a title like "Tom & Jerry"
// shows up correctly instead of breaking the page.
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Reads data/months.json and returns the list of months.
// The newest month is first in the file, so months[0] is "this month".
async function loadMonths() {
  const response = await fetch("data/months.json");
  if (!response.ok) {
    throw new Error("Could not load data/months.json");
  }
  const data = await response.json();
  return data.months;
}

// Loads a giscus comment box into a container.
// "term" is the name of the discussion thread, like "reviews-2026-10".
function loadGiscus(container, term) {
  container.innerHTML = "";

  if (GISCUS.repo.includes("YOUR-USERNAME")) {
    container.innerHTML =
      '<p class="status">Comments aren\'t set up yet. Open script.js and fill in the GISCUS settings at the top.</p>';
    return;
  }

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", GISCUS.repo);
  script.setAttribute("data-repo-id", GISCUS.repoId);
  script.setAttribute("data-category", GISCUS.category);
  script.setAttribute("data-category-id", GISCUS.categoryId);
  script.setAttribute("data-mapping", "specific");
  script.setAttribute("data-term", term);
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", "light");
  script.setAttribute("data-lang", "en");
  container.appendChild(script);
}


// ---------- 3. HOME PAGE: THIS MONTH ----------

// Builds one colored band (a "spine" on the shelf) for a book, show, or movie.
function band(kind, label, item) {
  return `
    <article class="band band-${kind}">
      <p class="kind">${label}</p>
      <div class="band-body">
        <h3>${esc(item.title)}</h3>
        <p class="by">${esc(item.creator)}</p>
        <p class="detail">${esc(item.detail)}</p>
        <p class="where">${esc(item.where)}</p>
      </div>
    </article>`;
}

async function renderThisMonth() {
  const target = document.querySelector("#this-month");
  if (!target) return; // not the home page

  try {
    const months = await loadMonths();
    const m = months[0];

    target.innerHTML = `
      <div class="month-head">
        <h2>${esc(m.label)}</h2>
        <p class="theme">${esc(m.theme)}</p>
      </div>
      <div class="shelf">
        ${band("book", "Book", m.book)}
        ${band("show", "Show", m.show)}
        ${band("movie", "Movie", m.movie)}
      </div>
      <div class="meetup">
        <h3>Meetup</h3>
        <p>${esc(m.meetup)}</p>
        <p>${esc(m.place)}</p>
      </div>`;
  } catch (error) {
    console.error(error);
    target.innerHTML =
      '<p class="status">Couldn\'t load this month\'s picks. If you opened the file by double-clicking it, use Live Server in VS Code instead.</p>';
  }
}


// ---------- 4. PAST MONTHS PAGE ----------

async function renderPastMonths() {
  const target = document.querySelector("#past-months");
  if (!target) return; // not the past months page

  try {
    const months = await loadMonths();
    const past = months.slice(1); // everything except the newest month

    if (past.length === 0) {
      target.innerHTML =
        '<p class="status">No past months yet. Check back after the first meetup.</p>';
      return;
    }

    target.innerHTML = past
      .map(
        (m) => `
      <article class="past-row">
        <div class="past-month">
          <h2>${esc(m.label)}</h2>
          <p>${esc(m.theme)}</p>
          <a href="reviews.html?month=${encodeURIComponent(m.id)}">Read the reviews</a>
        </div>
        <dl class="past-picks">
          <div>
            <dt>Book</dt>
            <dd>${esc(m.book.title)}</dd>
            <dd class="by">${esc(m.book.creator)}</dd>
          </div>
          <div>
            <dt>Show</dt>
            <dd>${esc(m.show.title)}</dd>
            <dd class="by">${esc(m.show.detail)}</dd>
          </div>
          <div>
            <dt>Movie</dt>
            <dd>${esc(m.movie.title)}</dd>
            <dd class="by">${esc(m.movie.creator)}</dd>
          </div>
        </dl>
      </article>`
      )
      .join("");
  } catch (error) {
    console.error(error);
    target.innerHTML =
      '<p class="status">Couldn\'t load past months. If you opened the file by double-clicking it, use Live Server in VS Code instead.</p>';
  }
}


// ---------- 5. RECOMMEND PAGE ----------

function setupRecommendations() {
  const box = document.querySelector("#giscus-box");
  const picker = document.querySelector("#month-select");
  if (!box || picker) return; // not the recommend page

  loadGiscus(box, box.dataset.term || "recommendations");
}


// ---------- 6. REVIEWS PAGE ----------

async function setupReviews() {
  const select = document.querySelector("#month-select");
  const box = document.querySelector("#giscus-box");
  if (!select || !box) return; // not the reviews page

  try {
    const months = await loadMonths();

    // Fill the dropdown with every month.
    select.innerHTML = months
      .map((m) => `<option value="${esc(m.id)}">${esc(m.label)}</option>`)
      .join("");

    // If the link was reviews.html?month=2026-09, start on that month.
    const wanted = new URLSearchParams(window.location.search).get("month");
    if (wanted && months.some((m) => m.id === wanted)) {
      select.value = wanted;
    }

    // Each month gets its own comment thread.
    const showComments = () => loadGiscus(box, "reviews-" + select.value);
    select.addEventListener("change", showComments);
    showComments();
  } catch (error) {
    console.error(error);
    box.innerHTML =
      '<p class="status">Couldn\'t load the months. If you opened the file by double-clicking it, use Live Server in VS Code instead.</p>';
  }
}


// ---------- 7. START EVERYTHING ----------
renderThisMonth();
renderPastMonths();
setupRecommendations();
setupReviews();
