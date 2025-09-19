const tmdbKey = "76a4cba9c234c9ab2969b6e94766b02d";     //If anyone use this code you need to replace with your TMDB API key
const tmdbBase = "https://api.themoviedb.org/3";
let movies = [];
let currentPage = 1;
let totalPages = 1;

// Show Sections
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";

  if (sectionId === "moviesSection") showAllMovies();
  if (sectionId === "reviewsSection") loadReviews();
  if (sectionId === "favoritesSection") loadFavorites();
}

// Load Movies
async function loadMovies(page = 1) {
  try {
    const languages = ["te", "hi", "en", "ta", "kn", "ml"];
    let allMovies = [];
    const todayDateStr = new Date().toISOString().split("T")[0];

    for (const lang of languages) {
      const url = `${tmdbBase}/discover/movie?api_key=${tmdbKey}&sort_by=release_date.desc&with_original_language=${lang}&release_date.lte=${todayDateStr}&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();

      totalPages = data.total_pages;
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

window.onload = () => {
  loadMovies();
};

// Search
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

// Render Movies
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
      <p style="font-size: 0.9rem; color: #ccc; margin-top: 5px; min-height: 60px;">
        ${description}
      </p>
      <div class="rating">
        <label>⭐ Rate: </label>
        <select onchange="saveRating('${movie.id}', this.value)">
          <option value="">Select</option>
          ${[1,2,3,4,5,6,7,8,9,10].map(r => `<option value="${r}">${r}</option>`).join("")}
        </select>
      </div>
      <div class="comment-box">
        <textarea placeholder="Leave a comment..." id="comment-${movie.id}"></textarea>
        <button onclick="saveComment('${movie.id}','${movie.title}','${poster}')">Save</button>
        <button onclick="toggleFavorite('${movie.id}','${movie.title}','${poster}')">❤️ Favorite</button>
      </div>
    `;

    movieList.appendChild(card);

    const storedRating = localStorage.getItem(movie.id + "-rating");
    const storedComment = localStorage.getItem(movie.id + "-comment");
    if (storedRating) card.querySelector("select").value = storedRating;
    if (storedComment) card.querySelector("textarea").value = JSON.parse(storedComment).comment;
  });
}

function showAllMovies() {
  document.getElementById("searchInput").value = "";
  displayMovies(movies);
}

// Ratings
function saveRating(id, value) {
  localStorage.setItem(id + "-rating", value);
}

// Comments
function saveComment(id, title, poster) {
  const commentBox = document.getElementById("comment-" + id);
  const comment = commentBox.value.trim();

  if (!comment) {
    alert("Please write something before saving!");
    return;
  }

  localStorage.setItem(id + "-comment", JSON.stringify({ title, comment, poster }));
  alert("Review saved!");
  loadReviews();
}

function deleteComment(id) {
  localStorage.removeItem(id + "-comment");
  localStorage.removeItem(id + "-rating");
  alert("Review deleted!");
  loadReviews();
}

// Reviews
function loadReviews() {
  const reviewsList = document.getElementById("reviewsList");
  reviewsList.innerHTML = "";

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.endsWith("-comment")) {
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored && stored.comment) {
        const movieId = key.replace("-comment", "");
        const rating = localStorage.getItem(movieId + "-rating");
        const ratingStars = rating ? getStars(rating) : "No rating";

        const div = document.createElement("div");
        div.style.display = "inline-block";
        div.style.margin = "10px";
        div.style.textAlign = "center";
        div.style.width = "180px";
        div.style.background = "rgba(0,0,0,0.6)";
        div.style.padding = "10px";
        div.style.borderRadius = "8px";

        div.innerHTML = `
          <img src="${stored.poster}" style="width:150px; border-radius:8px;"><br>
          <b>${stored.title}</b><br>
          <div style="color: gold; font-size: 1.2rem;">${ratingStars}</div>
          <p>${stored.comment}</p>
          <div class="review-buttons">
            <button onclick="scrollToMovie('${movieId}')">Go to Movies</button>
            <button onclick="deleteComment('${movieId}')">Delete</button>
          </div>
        `;
        reviewsList.appendChild(div);
      }
    }
  }
}

function goHome() {
  currentPage = 1;
  document.getElementById("searchInput").value = "";
  showSection('moviesSection');
  loadMovies(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToMovie(movieId) {
  showSection('moviesSection');
  const movieElement = document.getElementById("movie-" + movieId);
  if (movieElement) {
    movieElement.scrollIntoView({ behavior: "smooth", block: "center" });
    movieElement.style.border = "2px solid gold";
    setTimeout(() => movieElement.style.border = "", 2000);
  }
}

// Stars
function getStars(rating) {
  const stars = Math.round(rating / 2);
  const filled = "★".repeat(stars);
  const empty = "☆".repeat(5 - stars);
  return filled + empty;
}

// Favorites
function toggleFavorite(id, title, poster) {
  const favKey = id + "-favorite";

  if (localStorage.getItem(favKey)) {
    localStorage.removeItem(favKey);
    alert(title + " removed from favorites!");
  } else {
    localStorage.setItem(favKey, JSON.stringify({ title, poster }));
    alert(title + " added to favorites!");
  }
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
      div.style.display = "inline-block";
      div.style.margin = "10px";
      div.style.textAlign = "center";
      div.style.width = "160px";
      div.style.background = "rgba(0,0,0,0.6)";
      div.style.padding = "10px";
      div.style.borderRadius = "8px";

      div.innerHTML = `
        <img src="${fav.poster}" style="width:120px; border-radius:8px;"><br>
        <b>${fav.title}</b><br>
        <div class="favorites-buttons" style="display: flex; justify-content: space-between; margin-top: 10px; gap: 10px;">
          <button onclick="scrollToMovie('${movieId}')">Go to Movies</button>
          <button onclick="toggleFavorite('${movieId}','${fav.title}','${fav.poster}')">Delete</button>
        </div>
      `;
      favoritesList.appendChild(div);
    }
  }
}
