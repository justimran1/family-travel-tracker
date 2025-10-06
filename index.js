import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
dotenv.config();

import cloudinary from "./cloudinary.js";
import { db } from "./db.js";
import router from "./login.js";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
const app = express();
const port = 3000;
const storage = multer.memoryStorage();
const upload = multer({ storage });

const pgSession = connectPgSimple(session);

app.use(
  session({
    store: new pgSession({
      pool: db, // connection pool
      tableName: "session", // optional name for table
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET, // read from .env
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 2, // 2 hours
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // only over HTTPS in production
//       sameSite: "lax",
//     },
//   })
// );

app.set("view engine", "ejs");

// Middleware
function requireLogin(req, res, next) {
  if (!req.session.family) {
    return res.redirect("login.ejs");
  }
  console.log("Logged in family ID:", req.session.family.id);
  next();
}
app.use("/", router);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId;
let usercountry = "";
let users = [];
async function checkVisisted(currentUserId, familyId) {
  const result = await db.query(
    "SELECT visited_countries, visited_countries_name FROM users JOIN users_visited ON users.id = users_visited.user_id WHERE user_id = $1 AND users.family_id =$2",
    [currentUserId, familyId]
  );
  console.log(result.rows);
  let countries = [];
  result.rows.forEach((row) => {
    countries.push(row.visited_countries);
  });
  return countries;
}
console.log("this are the current users", users);
async function checkVisisted2(currentUserId, familyId) {
  const result = await db.query(
    "SELECT visited_countries_name FROM users JOIN users_visited ON users.id = users_visited.user_id WHERE user_id = $1 AND users.family_id = $2",
    [currentUserId, familyId]
  );
  let names = [];
  result.rows.forEach((row) => {
    names.push(row.visited_countries_name);
  });
  return names;
}
async function getCurrentUser(req) {
  const result = await db.query("SELECT * FROM users WHERE family_id = $1", [
    req.session.family.id,
  ]);

  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

async function getMemoryDetails(currentUserId, req) {
  const result = await db.query(
    `SELECT visited_countries_name, memory_text FROM users_visited JOIN
    memory
      ON users_visited.visited_countries_name = memory.visited_countries
      AND users_visited.user_id = memory.user_id
      WHERE users_visited.user_id = $1 
      AND users_visited.family_id = $2
      ORDER BY visited_countries_name;
    `,
    [currentUserId, req.session.family.id]
  );
  const grouped = {};
  result.rows.forEach((row) => {
    const country = row.visited_countries_name;
    if (!grouped[country]) {
      grouped[country] = [];
    }
    if (row.memory_text) {
      grouped[country].push(row.memory_text);
    }
  });
  return grouped;
}

async function getPhotosGroupedByCountry(currentUserId, familyId) {
  const result = await db.query(
    `SELECT DISTINCT photo_url, visited_countries_name 
FROM users_visited 
JOIN photos 
  ON users_visited.visited_countries_name = photos.visited_countries
 AND users_visited.user_id = photos.user_id
WHERE users_visited.user_id = $1 
AND users_visited.family_id = $2
ORDER BY visited_countries_name;

`,
    [currentUserId, familyId]
  );

  // group into { countryName: [urls...] }
  const grouped = {};
  result.rows.forEach((row) => {
    const country = row.visited_countries_name;
    if (!grouped[country]) {
      grouped[country] = [];
    }
    if (row.photo_url) {
      grouped[country].push(row.photo_url);
    }
  });

  return grouped;
}

app.get("/", (req, res) => {
  if (req.session.family) {
    return res.redirect("/home");
  }
  res.render("login.ejs");
});

app.get("/home", requireLogin, async (req, res) => {
  console.log("this is session in index.js", req.session.family);
  try {
    const url = await getPhotosGroupedByCountry(
      currentUserId,
      req.session.family.id
    );
    const memory = await getMemoryDetails(currentUserId, req);
    console.log(url);
    console.log(memory);
    const countries = await checkVisisted(currentUserId, req.session.family.id);
    console.log(countries);
    const names = await checkVisisted2(currentUserId, req.session.family.id);
    const currentuser = await getCurrentUser(req);
    console.log(currentuser);
    res.render("index.ejs", {
      url: url,
      countries: countries,
      names: names,
      total: countries.length,
      memories: memory,
      users,
      colour: currentuser?.usercolor
        ? currentuser.usercolor.toLowerCase().trim()
        : "purple",
      family: req.session.family,
    });
  } catch (error) {
    console.error("Error fetching homepage:", error);
    res.status(500).send("Error loading home page.");
  }
});

app.post("/details", async (req, res) => {
  const x = req.body["country_name"];
  const names = await checkVisisted2();
  const country_result = names.find((country) => country == x);
  usercountry = country_result;
  console.log(usercountry);
  res.render("details.ejs");
});

app.post("/add", async (req, res) => {
  const familyId = req.session.family.id;
  const input = req.body["country"];
  const currentuser = await getCurrentUser(req);
  try {
    const result = await db.query(
      "SELECT country_code, country_name  FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // handle error, country not found
      return res.render("index.ejs", {
        error: "Country not found",
        countries: await checkVisisted(currentUserId, req.session.family.id),
        total: (await checkVisisted(currentUserId, req.session.family.id))
          .length,
        users,
        colour: currentuser.usercolor,
      });
    }
    const countryCode = result.rows[0].country_code;
    const countryName = result.rows[0].country_name;
    try {
      await db.query(
        "INSERT INTO  users_visited (visited_countries, user_id, visited_countries_name, family_id ) VALUES ($1 ,$2, $3, $4)",
        [countryCode, currentUserId, countryName, familyId]
      );
      res.redirect("/home");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add == "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    console.log(req.body.user);
    res.redirect("/home");
  }
});

app.post("/uploadsRoute", upload.array("photos", 7), async (req, res) => {
  const familyId = req.session.family.id;
  const memory_details = req.body.desc;
  const currentuser = currentUserId;
  usercountry;
  try {
    await db.query(
      "INSERT INTO memory(visited_countries, user_id, memory_text, family_id) VALUES($1,$2,$3,$4)",
      [usercountry, currentuser, memory_details, req.session.family.id]
    );
    //upload all files to cloudinary
    console.log("files received ✔", req.files);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "no files uploaded" });
    }
    const UploadPromise = await Promise.all(
      req.files.map((e) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "VisitedCountries" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                console.log("Cloudinary upload result:", result);
                resolve(result.secure_url);
              }
            }
          );
          stream.end(e.buffer);
        });
      })
    );
    // save into postgres DATABASE
    for (const url of UploadPromise) {
      console.log(url);
      await db.query(
        "INSERT INTO photos(visited_countries , user_id, photo_url, family_id)values($1,$2,$3, $4)",
        [usercountry, parseInt(currentuser), url, req.session.family.id]
      );
    }
    // Save the user desc into postgres
    res.redirect("/home");
    //
  } catch (error) {
    console.error("Error uploading files: Try Again", error);
    res.status(500).send("Error uploading files");
  }
});

app.post("/new", async (req, res) => {
  const userdata = req.body.name;
  const usercolor = req.body.color;
  const result = await db.query(
    "INSERT INTO users (username,usercolor, family_id) VALUES ($1 ,$2, $3 ) RETURNING *;",
    [userdata, usercolor, req.session.family.id]
  );
  const id = result.rows[0].id;
  currentUserId = id;
  res.redirect("/home");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
