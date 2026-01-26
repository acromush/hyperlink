import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import fs from "fs"; // Used to create the uploads folder if missing

// 1. SETUP DIRECTORIES & FILE PATHS (ES MODULES FIX)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. MULTER CONFIGURATION (THE FIX)
// This must come BEFORE the app is initialized so 'upload' is ready.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public/uploads");
    
    // Safety check: Create folder if it doesn't exist
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    // Uses the extension from the blob sent by frontend
    const ext = path.extname(file.originalname); 
    cb(null, `user_${req.session.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });


// 3. APP & DB SETUP
const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "hyperlink",
  password: "boomboom69",
  port: 5432, 
});

db.connect();

// 4. MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "something-not-stupid",
  resave: false,
  saveUninitialized: false,
}));

// 5. HELPER FUNCTIONS
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
    "SELECT id, name, email, role, profile_pic FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}


// 6. ROUTES
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
    const { fName, lName, email, password} = req.body;
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
    const { fName, lName, email, password} = req.body;
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

// --- PROFILE UPLOAD ROUTE ---
app.post(
  "/profile/upload-pic",
  upload.single("profilePic"), // Uses the 'upload' middleware configured above
  async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Safety: If no file was uploaded (multer failed or user sent nothing)
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    
    try {
        await db.query(
          "UPDATE users SET profile_pic = $1 WHERE id = $2",
          [imagePath, req.session.userId]
        );
        res.json({ path: imagePath });
    } catch (err) {
        console.error("Database update failed:", err);
        res.status(500).json({ error: "Database error" });
    }
  }
);

app.post("/profile/remove-pic", async (req, res) => {
  if (!req.session.userId) {
    return res.sendStatus(401);
  }

  const defaultPic = "/uploads/default_pic.jpeg";

  await db.query(
    "UPDATE users SET profile_pic = $1 WHERE id = $2",
    [defaultPic, req.session.userId]
  );

  res.sendStatus(200);
});

app.listen(port, () => {
   console.log(`server running on port ${port}.`);
});