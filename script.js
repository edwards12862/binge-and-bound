// ============================================================
// Binge & Bound: script.js
// This one file powers the home and past months pages. Each function below
// checks whether its page is open, and only runs if it is.
// ============================================================


// ---------- 1. SMALL HELPERS ----------

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


// ---------- 3. HOME PAGE: THIS MONTH ----------

// Every pick (book, show, movie, song) is stored here so the popup
// can look it up when its title is clicked.
const picks = {};

function photoBox(cls, label, item) {
  const hasImage = Boolean(item.image);
  const img = hasImage
    ? `<img src="${esc(item.image)}" alt="${esc(label)}: ${esc(item.title)}" loading="lazy" onerror="this.parentElement.classList.add('is-empty'); this.remove();">`
    : "";
  return `
      <div class="${cls}${hasImage ? "" : " is-empty"}">
        ${img}
        <span class="photo-title">${esc(item.title)}</span>
        <span class="photo-hint">${esc(item.image || "add an image path in months.json")}</span>
      </div>`;
}

// One card: photo, then the title (a button that opens the popup), then details.
function pickCard(kind, label, item) {
  picks[kind] = { label, item };
  return `
    <article class="pick pick-${kind}">
      ${photoBox("photo", label, item)}
      <p class="kind">${label}</p>
      <h3><button type="button" class="title-btn" data-pick="${kind}" aria-haspopup="dialog">${esc(item.title)}</button></h3>
      <p class="by">${esc(item.creator)}</p>
    </article>`;
}

function songBlock(song) {
  if (!song || !song.title) return "";
  picks.song = { label: "Song", item: song };
  return `
    <div class="song">
      ${photoBox("song-photo", "Song", song)}
      <div class="song-text">
        <p class="song-label">Song of the month</p>
        <h3><button type="button" class="title-btn" data-pick="song" aria-haspopup="dialog">${esc(song.title)}</button></h3>
        <p class="song-artist">${esc(song.artist)}</p>
      </div>
    </div>`;
}

// ----- The popup -----
function getDialog() {
  let dlg = document.querySelector("#details");
  if (dlg) return dlg;
  dlg = document.createElement("dialog");
  dlg.id = "details";
  dlg.setAttribute("aria-labelledby", "details-title");
  document.body.appendChild(dlg);
  // Click on the dark backdrop closes it
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  return dlg;
}

function openDetails(kind) {
  const { label, item } = picks[kind];
  const dlg = getDialog();

  // Lines under the title: whatever exists in months.json
  const basics = [item.creator || item.artist, item.detail, item.where]
    .filter(Boolean)
    .map((t) => `<p class="d-line">${esc(t)}</p>`)
    .join("");

  // Everything in the "info" box of months.json that isn't empty
  const info = item.info || {};
  const synopsis = info.Synopsis || info.About || "";
  const rows = Object.entries(info)
    .filter(([k, v]) => v && k !== "Synopsis" && k !== "About")
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join("");

  const listen = item.link
    ? `<a class="song-link" href="${esc(item.link)}" target="_blank" rel="noopener">Listen</a>`
    : "";

  dlg.innerHTML = `
    <button type="button" class="close-btn" aria-label="Close">Close</button>
    <div class="d-grid">
      ${item.image ? `<img class="d-img" src="${esc(item.image)}" alt="" onerror="this.remove()">` : ""}
      <div class="d-body">
        <p class="d-kind">${esc(label)}</p>
        <h2 id="details-title">${esc(item.title)}</h2>
        ${basics}
        ${synopsis ? `<p class="d-synopsis">${esc(synopsis)}</p>` : ""}
        ${rows ? `<dl class="d-info">${rows}</dl>` : ""}
        ${listen}
      </div>
    </div>`;
  dlg.querySelector(".close-btn").addEventListener("click", () => dlg.close());
  dlg.showModal();
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
        <p class="hint">Click a title for the full details.</p>
      </div>
      <div class="picks">
        ${pickCard("book", "Book", m.book)}
        ${pickCard("show", "Show", m.show)}
        ${pickCard("movie", "Movie", m.movie)}
      </div>
      ${songBlock(m.song)}
      <div class="meetup">
        <h3>Meetup</h3>
        <p>${esc(m.meetup)}</p>
        <p>${esc(m.place)}</p>
      </div>`;

    target.querySelectorAll(".title-btn").forEach((btn) =>
      btn.addEventListener("click", () => openDetails(btn.dataset.pick))
    );
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
          ${
            m.song && m.song.title
              ? `<div>
            <dt>Song</dt>
            <dd>${
              m.song.link
                ? `<a href="${esc(m.song.link)}" target="_blank" rel="noopener">${esc(m.song.title)}</a>`
                : esc(m.song.title)
            }</dd>
            <dd class="by">${esc(m.song.artist)}</dd>
          </div>`
              : ""
          }
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


// ---------- 5. START EVERYTHING ----------
renderThisMonth();
renderPastMonths();
