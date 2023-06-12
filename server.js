const express = require("express")
const mongodb = require("mongodb")
const cors = require("cors");
const bcrypt = require("bcrypt");
var bodyParser = require("body-parser")
const session = require('express-session');
const cookieParser = require('cookie-parser');


const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Use express-session
app.use(session({
  secret: 'your-secret-key',  // This is used to sign the session ID cookie.
  resave: false,  // Forces the session to be saved back to the session store, even if the session was never modified during the request
  saveUninitialized: false,  // Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
  cookie: { secure: false }  // Note: the `secure` option should be true in a production environment that uses HTTPS
}));

const uri =
  "mongodb+srv://panagiotisfotiadis:coleslawhammer@reactsite.zhpj3hk.mongodb.net/test?retryWrites=true&w=majority";
const client = new mongodb.MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

(async () => {
    try {
      await client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
    }
  })();
  
  async function hashPassword(password){
    try{
      const salt = await bcrypt.genSalt(1);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    }catch(error){
      console.log("error hashing password: ", error);
    }
  }
  
  async function checkPassword(plainTextPassword, hashedPassword){
    try {
      const match = await bcrypt.compare(plainTextPassword, hashedPassword);
      if(match) {
        return true;
      }else{
        return false;
      }
    } catch(error) {
      console.log("error comparing passwords: ", error);
    }
    
  }
  
  app.post("/register", async (req, res) => {
    try {
        console.log("entered")
      const username = req.body.username;
      const password = req.body.password;
      const hashedPassword = await hashPassword(password);
  
      const db = client.db("Reactsite");
      const usersCollection = db.collection("WebengineeringUsers");
      const date = new Date();
  
      const existingUser = await usersCollection.findOne({ username: username });
    if (existingUser) {
      res.status(400).json({ success: false, message: "Username already exists" });
      return;
    }
  
    await usersCollection.insertOne({
        username: username,
        password: hashedPassword,
        date: date
      });
  
      res.status(201).json({ success: true, message: "User created" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    } finally {
  
    }
  });

  app.post("/login", async (req, res) => {
    try {
        console.log("entered")
      const username = req.body.username;
      const password = req.body.password;
  
      const db = client.db("Reactsite");
      const collection = db.collection("WebengineeringUsers");
  
      const existingUser = await collection.findOne({
        username: username
      });
      const match = await checkPassword(password, existingUser.password);
      if (match) {
        // Add the user's information to the session
         req.session.user = { username: username };
        res.status(200).json({ success: true, message: "Successfully logged in" });
        return;
      }
  
      res.status(401).json({ success: false, message: "Username or password incorrect" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    } finally {
  
    }
  });

  app.get("/getuser", async (req, res) => {
    try {
      const username = req.query.username;
  
      const db = client.db("Reactsite");
      const collection = db.collection("Highscores");
      const user = await collection.findOne({ username: username });
      if (!user) {
        res.status(404).send({ success: false, message: "User not found" });
        return;
      }
      res.status(200).send(user);
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: true, message: "Server error" });
    } finally {
  
    }
  });

app.listen(5000, () => {
    console.log("server started on port 5000")
})