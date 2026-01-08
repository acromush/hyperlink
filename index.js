import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { constrainedMemory } from "process";
import bcrypt from "bcrypt";
import { get } from "http";
import session from "express-session";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "something-not-stupid",
  resave: false,
  saveUninitialized: false,
}));


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "hyperlink",
  password: "boomboom69",
  port: 5432, 
});

db.connect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function hash(password){
  return await bcrypt.hash(password, 10);
}

async function getItems(req,res) {
    const itemList = await db.query("SELECT * FROM users");
    return itemList.rows;
};

async function getUserByEmail(email) {
  const result = await db.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
}
async function getUserById(id) {
  const result = await db.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}


app.get("/", async (req,res) => {
    res.render("index.ejs");
});

app.get("/home", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const user = await getUserById(req.session.userId);
  res.render("home.ejs", { user });
});

app.get("/user_signup", async (req,res) => {
    res.render("user_signup.ejs");
});

app.get("/business_signup", async (req,res) => {
    res.render("business_signup.ejs");
});

app.get("/login", async(req,res) => {
    res.render("login.ejs");
});

app.post("/add_user", async (req,res) => {
    const { fName, lName, email, password, cpassword } = req.body;
    const password_hash = await hash(password);
    const role = "customer";
    try{
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [`${fName} ${lName}`, email, password_hash, role]
    );
    res.send("User added");
    } catch (err) {
        console.log(err);
        res.status(500).send("DB.ERROR");
    }
});

app.post("/add_business", async (req,res) => {
    const { fName, lName, email, password, cpassword } = req.body;
    const password_hash = await hash(password);
    const role = "business";
    try{
    await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [`${fName} ${lName}`, email, password_hash, role]
    );
    res.send("User added");
    } catch (err) {
        console.log(err);
        res.status(500).send("DB.ERROR");
    }
});

app.post("/login_check", async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    console.log("incorrect password");
    return res.redirect("/login");
  }

  req.session.userId = user.id;
  res.redirect("/home");
});


app.get("/services", async (req,res) => {
    res.render("services.ejs");
});

app.get("/services_id", async (req,res) => {
    res.render("services_id.ejs");
});

app.listen(port, () => {
   console.log(`server running on port ${port}.`);
})