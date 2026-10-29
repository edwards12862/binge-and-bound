

// ---------- 1. SMALL HELPERS ----------


function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


async function loadMonths() {
  const stamp = Date.now();
  const paths = ["months.json", "data/months.json"];
  let response = null;
  for (const path of paths) {
    try {
      const r = await fetch(path + "?v=" + stamp, { cache: "no-store" });
      if (r.ok) { response = r; console.log("Loaded", path); break; }
    } catch (e) { /* try the next path */ }
  }
  if (!response) {
    throw new Error("Could not find months.json (put it next to index.html)");
  }
  const data = await response.json();
  return data.months;
}


function byline(item) {
  const i = item.info || {};
  return i.Author || i.Creator || i.Director || i.Singer || i.Provider || "";
}


function imgFallback(img) {
  if (!img.dataset.tried) {
    img.dataset.tried = "1";
    img.src = img.getAttribute("src").split("/").pop();
    return;
  }
  const box = img.parentElement;
  if (box.matches(".photo, .song-photo")) box.classList.add("is-empty");
  img.remove();
}


// ---------- 3. HOME PAGE: THIS MONTH ----------


const picks = {};

function photoBox(cls, label, item) {
  const hasImage = Boolean(item.image);
  const img = hasImage
    ? `<img src="${esc(item.image)}" alt="${esc(label)}: ${esc(item.title)}" loading="lazy" onerror="imgFallback(this)">`
    : "";
  return `
      <div class="${cls}${hasImage ? "" : " is-empty"}">
        ${img}
        <span class="photo-title">${esc(item.title)}</span>
        <span class="photo-hint">${esc(item.image || "add an image path in months.json")}</span>
      </div>`;
}

// Small "Honorable Books / Shows / Movies" cards under a main pick.

function honorableBlock(label, items) {
  if (!items || items.length === 0) return "";
  const cards = items
    .map(
      (h) => `
        <div class="hm">
          ${photoBox("photo hm-photo", label, h)}
          <p class="hm-title">${esc(h.title)}</p>
        </div>`
    )
    .join("");
  return `
      <div class="honorable">
        <p class="hm-label">Honorable ${label}s</p>
        <div class="hm-grid">${cards}
        </div>
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
      <p class="by">${esc(byline(item))}</p>
      ${honorableBlock(label, item.honorable)}
    </article>`;
}

function songBlock(song) {
  if (!song || !song.title) return "";
  picks.song = { label: "Song", item: song };
  return `
    <div class="song">
      <div class="song-photo-wrap">
        <span class="stars stars-left" aria-hidden="true">
          <svg class="star sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z"/></svg>
          <svg class="star lg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z"/></svg>
        </span>
        ${photoBox("song-photo", "Song", song)}
        <span class="stars stars-right" aria-hidden="true">
          <svg class="star lg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z"/></svg>
          <svg class="star sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z"/></svg>
        </span>
      </div>
      <div class="song-text">
        <p class="song-label">Song of the month</p>
        <h3><button type="button" class="title-btn" data-pick="song" aria-haspopup="dialog">${esc(song.title)}</button></h3>
        <p class="song-artist">${esc(byline(song))}</p>
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
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  return dlg;
}

function openDetails(kind) {
  const { label, item } = picks[kind];
  const dlg = getDialog();

 
  const info = item.info || {};
  const summary = info.Summary || "";
  const rows = Object.entries(info)
    .filter(([k, v]) => v && k !== "Summary")
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join("");

  const listen = item.link
    ? `<a class="song-link" href="${esc(item.link)}" target="_blank" rel="noopener">Listen</a>`
    : "";

  dlg.innerHTML = `
    <button type="button" class="close-btn" aria-label="Close">Close</button>
    <div class="d-grid">
      ${item.image ? `<img class="d-img" src="${esc(item.image)}" alt="" onerror="imgFallback(this)">` : ""}
      <div class="d-body">
        <p class="d-kind">${esc(label)}</p>
        <h2 id="details-title">${esc(item.title)}</h2>
        ${summary ? `<p class="d-synopsis">${esc(summary)}</p>` : ""}
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
        <p class="hint">Click a title for the full details.</p>
      </div>
      <div class="picks">
        ${pickCard("movie", "Movie", m.movie)}
        ${pickCard("book", "Book", m.book)}
        ${pickCard("show", "Show", m.show)}
      </div>
      ${songBlock(m.song)}`;

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
  if (!target) return; 

  try {
    const months = await loadMonths();
    const past = months.slice(1); 

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
        </div>
        <dl class="past-picks">
          <div>
            <dt>Book</dt>
            <dd>${esc(m.book.title)}</dd>
            <dd class="by">${esc(byline(m.book))}</dd>
          </div>
          <div>
            <dt>Show</dt>
            <dd>${esc(m.show.title)}</dd>
            <dd class="by">${esc(byline(m.show))}</dd>
          </div>
          <div>
            <dt>Movie</dt>
            <dd>${esc(m.movie.title)}</dd>
            <dd class="by">${esc(byline(m.movie))}</dd>
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
            <dd class="by">${esc(byline(m.song))}</dd>
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
