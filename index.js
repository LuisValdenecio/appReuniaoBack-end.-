/*//////////////////////////////////////////////////////////////////////////////
 Este file será o ponto de entrada do servidor express
//////////////////////////////////////////////////////////////////////////////*/

require('dotenv').config()

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('express-jwt');

const db = require("./models/dbInterface");
require('./config/passport.js');

var auth = jwt({
  secret: process.env.API_CLIENT_SECRET,
  userProperty: 'payload'
});

app.use(passport.initialize());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

/*//////////////////////////////////////////////////////////////////////////////
  Setting up the app middlewares
//////////////////////////////////////////////////////////////////////////////*/
app.use(bodyParser());
app.use(require('body-parser').urlencoded({ extended: true }));

/*//////////////////////////////////////////////////////////////////////////////
  to catch UnauthorizedError
//////////////////////////////////////////////////////////////////////////////*/
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json("weird shit");
  }
});

app.get('/homeadmin', auth, db.getSetupValues);
app.get('/students', auth,  db.getAllUsers);
app.get('/classes', auth, db.getAllClasses);
app.get(/(\w+-)(\w+-)(\w+-)(\w+-)(\w+)_classe$/, auth, db.getClassGrade);       // -->> this might be eliminated soon! (front-end dependency)
app.get(/(\w+-)(\w+-)(\w+-)(\w+-)(\w+)_faults$/, auth, db.getThisCLassFaults);  // -->> this might be eliminated soon! (front-end dependency)
app.get(/(\w+-)(\w+-)(\w+-)(\w+-)(\w+)_grades$/, auth, db.getClassGrades);      // -->> this might be eliminated soon! (front-end dependency)
app.get(/(\w+-)(\w+-)(\w+-)(\w+-)(\w+)$/, auth, db.getAllSubjects);             // -->> this might be eliminated soon! (front-end dependency)
app.post('/teachers',  db.saveTeacher);
app.post('/login', db.loginUser);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
