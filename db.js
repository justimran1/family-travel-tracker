import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
// const db = new pkg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "World",
//   password: "olubodun112",
//   port: 5432,
// });
// db.connect();

export default db;
