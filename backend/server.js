// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import jwt from "jsonwebtoken";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "devsecret";
const app = express();
const PORT = process.env.PORT || 4000; // match what you actually run

app.use(cors());
app.use(express.json());

// --- Health / root so clicking the link works ---
app.get("/", (_req, res) => {
  


});
app.get("/health", (_req, res) => res.json({ ok: true }));

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  };
  try {
    const payload = jwt.verify(token, SECRET); 
    req.user = payload;
    next();

  } catch (error) {
    return res.status(401).json({ error: "Invalid"})
  }
}

/*
edit th /me  route with the role === studentr\
req.user.role === studnet
change the jwt token creation code as well , addinh the role
*/
/*
create a admin route, /admin
make sure it works with the role = "admin"
*/
app.get("/me", authRequired, (req, res) => {
  if (req.user) {
    res.json({user:req.user})
  }
  else {
  res.status(401).json({message:"not authed"})
  }
})

// --- API routes ---
app.get("/tours", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.price, t.available_slots, t.start_date,
              c.name AS category
       FROM tours t
       JOIN categories c ON c.id = t.category_id
       ORDER BY t.start_date ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

app.get("/categories", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name FROM categories ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Option A: demo login (no JWT, just checks DB)
app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username & password required" });

    const [rows] = await pool.query(
      `SELECT id, username FROM users WHERE username = ? AND password = ? LIMIT 1`,
      [username.trim(), password]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username & password required" });

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

    const user = rows[0];

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    next(err);
  }
});

// --- 404 AFTER all routes ---
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`API is running on http://localhost:${PORT}`);
});
