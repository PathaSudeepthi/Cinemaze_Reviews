const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for reviews (for simplicity)
let reviews = [];

// Get all reviews
app.get("/reviews", (req, res) => {
  res.json(reviews);
});

// Add a new review
app.post("/reviews", (req, res) => {
  const review = req.body;
  review.id = Date.now(); // unique id
  reviews.push(review);
  res.json({ success: true });
});

// Delete a review (optional)
app.delete("/reviews/:id", (req, res) => {
  const id = parseInt(req.params.id);
  reviews = reviews.filter(r => r.id !== id);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
