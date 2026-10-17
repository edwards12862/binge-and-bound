// ============================================================
// Binge & Bound: script.js
// This one file powers all four pages. Each function below
// checks whether its page is open, and only runs if it is.
// ============================================================


// ---------- 1. SETTINGS YOU EDIT ONCE ----------
// Paste the link to each form here (see README.md for the steps).
// Visitors never need an account or any code: they just fill in the form.
const FORMS = {
  recommend: "", // link to your recommendations form
  review: "",    // link to your reviews form
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


// ---------- 3. HOME PAGE: THIS MONTH ----------

// Builds one card: a photo space, then the title and details.
// If there is no photo yet (or the file is missing), a labeled
// placeholder box is shown instead.
function photoBox(cls, label, item) {
  const hasImage = Boolean(item.image);
  const img = hasImage
    ? `<img src="${esc(item.image)}" alt="${esc(label)}: ${esc(item.title)}" loading="lazy" onerror="this.parentElement.classList.add('is-empty'); this.remove();">`
    : "";
  const hint = item.image ? esc(item.image) : "add an image path in months.json";
  return `
      <div class="${cls}${hasImage ? "" : " is-empty"}">
        ${img}
        <span class="photo-title">${esc(item.title)}</span>
        <span class="photo-hint">${hint}</span>
      </div>`;
}

function pickCard(kind, label, item) {
  return `
    <article class="pick pick-${kind}">
      ${photoBox("photo", label, item)}
      <p class="kind">${label}</p>
      <h3>${esc(item.title)}</h3>
      <p class="by">${esc(item.creator)}</p>
      <p class="detail">${esc(item.detail)}</p>
      <p class="where">${esc(item.where)}</p>
    </article>`;
}

// Builds the "Song of the month" strip. The Listen button only
// appears if you pasted a link (Spotify, YouTube, Apple Music...)
// into the "link" part of the song in data/months.json.
function songBlock(song) {
  if (!song || !song.title) return "";

  const button = song.link
    ? `<a class="song-link" href="${esc(song.link)}" target="_blank" rel="noopener">Listen</a>`
    : "";

  return `
    <div class="song">
      ${photoBox("song-photo", "Song", song)}
      <div>
        <h3>Song of the month</h3>
        <p class="song-name">${esc(song.title)}</p>
        <p class="song-artist">${esc(song.artist)}</p>
      </div>
      ${button}
    </div>`;
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
          <a href="reviews.html">Leave a review</a>
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


// ---------- 5. RECOMMEND AND REVIEWS PAGES ----------
// Both pages have a <div id="form-box" data-form="..."> that gets
// the matching form from the FORMS settings at the top of this file.

function setupForm() {
  const box = document.querySelector("#form-box");
  if (!box) return; // not a form page

  const url = FORMS[box.dataset.form];

  if (!url) {
    box.innerHTML =
      '<p class="status">This form isn\'t open yet. Check back soon.</p>';
    return;
  }

  box.innerHTML = `
    <iframe class="form-frame" src="${esc(url)}" title="Binge &amp; Bound form" loading="lazy">Loading...</iframe>
    <p class="form-fallback"><a href="${esc(url)}" target="_blank" rel="noopener">Form not showing? Open it in a new tab.</a></p>`;
}


// ---------- 6. START EVERYTHING ----------
renderThisMonth();
renderPastMonths();
setupForm();