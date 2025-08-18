// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());              // configure origin if frontend is separate
app.use(express.json());

// GET /tours
app.get("/tours", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id,
              t.name,
              t.price,
              t.available_slots,
              t.start_date,
              c.name AS category
       FROM tours t
       JOIN categories c ON c.id = t.category_id
       ORDER BY t.start_date ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /categories
app.get("/categories", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name FROM categories ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /login (demo: plain-text password compare)
app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username & password required" });
    }

    const [rows] = await pool.query(
      `SELECT id, username
       FROM users
       WHERE username = ? AND password = ?
       LIMIT 1`,
      [username.trim(), password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ user: rows[0] }); // TODO: issue JWT/session in real app
  } catch (err) {
    next(err);
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () =>
  console.log(`API is running on http://localhost:${PORT}`)
);
