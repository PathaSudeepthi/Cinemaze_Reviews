const tmdbKey = "76a4cba9c234c9ab2969b6e94766b02d";
const tmdbBase = "https://api.themoviedb.org/3";

let movies = [];
let currentPage = 1;
let totalPages = 1;

const api = "http://localhost:5000/reviews";

/* ---------------- SHOW SECTIONS ---------------- */

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.style.display = "none";
  });

  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";

  if (sectionId === "moviesSection") showAllMovies();
  if (sectionId === "reviewsSection") loadReviews();
  if (sectionId === "favoritesSection") loadFavorites();
}

/* ---------------- LOAD MOVIES ---------------- */

async function loadMovies(page = 1) {
  try {

    const languages = ["te", "hi", "en", "ta", "kn", "ml"];
    let allMovies = [];
    const todayDateStr = new Date().toISOString().split("T")[0];

    totalPages = 1;

    for (const lang of languages) {
      const url = `${tmdbBase}/discover/movie?api_key=${tmdbKey}&sort_by=release_date.desc&with_original_language=${lang}&release_date.lte=${todayDateStr}&page=${page}`;

      const res = await fetch(url);
      const data = await res.json();

      totalPages = Math.max(totalPages, data.total_pages || 1);
      allMovies = allMovies.concat(data.results || []);
    }

    movies = Array.from(new Map(allMovies.map(m => [m.id, m])).values());

    displayMovies(movies);
    renderPagination();

  } catch (err) {
    console.error("Error loading movies:", err);
  }
}

function renderPagination() {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";

  let html = "";

  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})">« Prev</button>`;
  }

  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    if (i === currentPage) {
      html += `<button style="background:#00c6ff;color:black;font-weight:bold;">${i}</button>`;
    } else {
      html += `<button onclick="goToPage(${i})">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})">Next »</button>`;
  }

  paginationDiv.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  loadMovies(page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  loadMovies();
});

/* ---------------- SEARCH ---------------- */

async function searchMovie() {
  const query = document.getElementById("searchInput").value.trim();

  if (!query) {
    showAllMovies();
    return;
  }

  const url = `${tmdbBase}/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();

  displayMovies(data.results || []);
}

/* ---------------- DISPLAY MOVIES ---------------- */

function displayMovies(movieArray) {
  const movieList = document.getElementById("movieList");
  movieList.innerHTML = "";

  if (!movieArray.length) {
    movieList.innerHTML = "<p>No movies found</p>";
    return;
  }

  movieArray.forEach(movie => {

    const card = document.createElement("div");
    card.className = "movie-card";
    card.id = "movie-" + movie.id;

    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://www.movienewz.com/img/films/poster-holder.jpg";

    const description = movie.overview
      ? movie.overview.length > 200
        ? movie.overview.slice(0, 200) + "..."
        : movie.overview
      : "No description available.";

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}">
      <h3>${movie.title} (${(movie.release_date || "").slice(0, 4)})</h3>
      <p>${description}</p>

      <div>
        ⭐ Rate:
        <select onchange="saveComment('${movie.id}','${movie.title}','${poster}', this.value)">
          <option value="">Select</option>
          ${[1,2,3,4,5,6,7,8,9,10].map(r => `<option value="${r}">${r}</option>`).join("")}
        </select>
      </div>

      <textarea id="comment-${movie.id}" placeholder="Leave a comment..."></textarea>

      <button onclick="saveComment('${movie.id}','${movie.title}','${poster}')">Save</button>
      <button onclick="toggleFavorite('${movie.id}','${movie.title}','${poster}')">❤️ Favorite</button>
    `;

    movieList.appendChild(card);
  });
}

function showAllMovies() {
  document.getElementById("searchInput").value = "";
  displayMovies(movies);
}

/* ---------------- SAVE REVIEW ---------------- */

async function saveComment(id, title, poster, rating = null) {

  const commentBox = document.getElementById("comment-" + id);
  const comment = commentBox ? commentBox.value.trim() : "";

  if (!comment && !rating) {
    alert("Please write a comment or select rating!");
    return;
  }

  try {

    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        comment,
        rating,
        poster
      })
    });

    const data = await res.json();

    if (data.success) {
      alert("Review saved!");
      loadReviews();
    }

  } catch (err) {
    console.error("Error saving review:", err);
  }
}

/* ---------------- LOAD REVIEWS ---------------- */

async function loadReviews() {

  try {

    const res = await fetch(api);
    const reviews = await res.json();

    const reviewsList = document.getElementById("reviewsList");
    reviewsList.innerHTML = "";

    if (!reviews.length) {
      reviewsList.innerHTML = "<p>No reviews yet.</p>";
      return;
    }

    reviews.reverse().forEach(r => {

      const stars = r.rating ? "⭐".repeat(r.rating) : "";
      const poster = r.poster || "https://www.movienewz.com/img/films/poster-holder.jpg";

      const div = document.createElement("div");

      div.innerHTML = `
        <div style="display:flex;gap:15px;align-items:center;margin-bottom:20px;">
          <img src="${poster}" style="width:100px;border-radius:8px;">
          <div>
            <h3>${r.title}</h3>
            <p>${stars}</p>
            <p>${r.comment}</p>
          </div>
        </div>
      `;

      reviewsList.appendChild(div);

    });

  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}

/* ---------------- FAVORITES ---------------- */

function toggleFavorite(id, title, poster) {
  const favKey = id + "-favorite";

  if (localStorage.getItem(favKey)) {
    localStorage.removeItem(favKey);
    alert("Removed from favorites!");
  } else {
    localStorage.setItem(favKey, JSON.stringify({ title, poster }));
    alert("Added to favorites!");
  }

  loadFavorites();
}

function removeFavorite(movieId) {
  localStorage.removeItem(movieId + "-favorite");
  loadFavorites();
}

function loadFavorites() {

  const favoritesList = document.getElementById("favoritesList");
  favoritesList.innerHTML = "";

  for (let i = 0; i < localStorage.length; i++) {

    const key = localStorage.key(i);

    if (key.endsWith("-favorite")) {

      const fav = JSON.parse(localStorage.getItem(key));
      const movieId = key.replace("-favorite", "");

      const div = document.createElement("div");

      div.innerHTML = `
        <img src="${fav.poster}" style="width:120px;border-radius:8px;"><br>
        <b>${fav.title}</b><br>
        <button onclick="scrollToMovie('${movieId}')">Go to Movies</button>
        <button onclick="removeFavorite('${movieId}')">Delete</button>
      `;

      favoritesList.appendChild(div);
    }
  }
}

/* ---------------- SCROLL TO MOVIE ---------------- */

function scrollToMovie(movieId) {
  showSection('moviesSection');

  const movieElement = document.getElementById("movie-" + movieId);

  if (movieElement) {
    movieElement.scrollIntoView({ behavior: "smooth", block: "center" });
    movieElement.style.border = "2px solid gold";
    setTimeout(() => movieElement.style.border = "", 2000);
  }
}
