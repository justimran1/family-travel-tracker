import bcrypt from "bcryptjs";
import express from "express";
import bodyParser from "body-parser";
import db from "./db.js";
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.static("public"));
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    //  a Check if email already exists
    const existingFamily = await db.query(
      "SELECT * FROM families WHERE email = $1",
      [email]
    );

    if (existingFamily.rows.length > 0) {
      return res.render("login.ejs", {
        error: "Email already registered, please log in.",
      });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    // 3️⃣ Insert into database
    const insertResult = await db.query(
      "INSERT INTO families (family_name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    const newFamily = insertResult.rows[0];

    req.session.family = {
      id: newFamily.id,
      name: newFamily.family_name,
      email: newFamily.email,
    };
    res.render("index.ejs");
  } catch (error) {
    console.error("Error creating family:", error);
    res.status(500).send("Registration failed");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM families WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.render("login.ejs", { error: "Invalid email or password" });
    }

    const family = result.rows[0];
    const valid = await bcrypt.compare(password, family.password);
    if (!valid) {
      return res.render("login.ejs", { error: "Invalid email or password" });
    }

    // store session
    req.session.family = {
      id: family.id,
      name: family.family_name,
      email: family.email,
    };

    res.redirect("/home");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed");
  }
});

export default router;
