const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS users ("
            + "user_id serial PRIMARY KEY,"
            + "display_name VARCHAR ( 50 ) NOT NULL,"
            + "username VARCHAR ( 50 ) UNIQUE NOT NULL,"
            + "password VARCHAR ( 50 ) NOT NULL,"
            + "email VARCHAR ( 255 ) UNIQUE NOT NULL,"
            + "user_role VARCHAR ( 255 ) NOT NULL,"
            + "created_on TIMESTAMP NOT NULL,"
            + "last_login TIMESTAMP)")
    .catch((err) => console.error(err));
});

// Express route handlers

app.get("/", (req, res) => {
  res.send("No page found");
});

app.get("/service/users/list", async (req, res) => {
  try {
    const values = await pgClient.query("SELECT * FROM users");
      res.send(values.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({"StatusCode": 500, "ErrorMessage": error});
  }
});

app.get("/service/users/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const values = await pgClient.query("SELECT * FROM users WHERE username ='"+username+"'");
      res.send(values.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({"StatusCode": 500, "ErrorMessage": error});
  }
});
app.delete("/service/users/:username", async (req, res) => {
  try {
    const username = req.params.username;
    pgClient.query("DELETE FROM users WHERE username ='"+username+"'")
    .then(() =>{
      res.send('Username: '+username+' deleted successfully');
    })
    .catch((err) => {
      console.error(err);
      //throw new Error('database error: '+error);
      res.status(500).send('Database error: '+err);
    });
      
  } catch (error) {
    console.error(error);
    res.status(500).send({"StatusCode": 500, "ErrorMessage": error});
  }
});
app.put("/service/users/:username", async (req, res) => {
  try {
    var display_name = req.body.display_name;
    var username = req.body.username;
    var email = req.body.email;
    var user_role = req.body.user_role;
    const usernameParam = req.params.username;
    pgClient.query("UPDATE users"
                  +" SET display_name='"+display_name+"',"
                  +" username='"+username+"',"
                  +" email='"+email+"',"
                  +" user_role='"+user_role+"'"
                  +" WHERE username ='"+usernameParam+"'")
    .then(() => {
      res.send('User updated successfully');
    })
    .catch((err) => {
      console.error(err);
      //throw new Error('database error: '+error);
      res.status(500).send('Database error: '+err);
    });
      
  } catch (error) {
    console.error(error);
    res.status(500).send({"StatusCode": 500, "ErrorMessage": error});
  }
});
app.post("/service/users", async (req, res) => {
  try {
    var uuid = Math.random().toString(36).slice(-6);
    var display_name = req.body.display_name;
    var username = req.body.username;
    var password = uuid;
    var email = req.body.email;
    var user_role = req.body.user_role;
    const now = new Date()
    var create_date = now;
    var last_login = now;
    pgClient.query("INSERT INTO users(display_name,username,password,email,user_role,created_on,last_login) VALUES($1,$2,$3,$4,$5,$6,$7)",
     [display_name, username, password, email, user_role, create_date, last_login])
     .then(() => {
      res.status(201).send('User added successfully, you password is :'+password);
     })
     .catch((err) => {
       console.error(err);
       //throw new Error('database error: '+error);
       res.status(500).send('Database error: '+err);
     });
  } catch (error) {
    throw new Error('Unknown error : '+error);
  }finally{
    console.log('Done!');
  }
});

app.listen(5000, (err) => {
  console.log("Listening");
});
