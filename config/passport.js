/*//////////////////////////////////////////////////////////////////////////////
  Este módulo define a estratégia local do passport
*///////////////////////////////////////////////////////////////////////////////

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const dbInterface = require('../models/dbInterface.js');
const authenticator = require('./authentication.js');

passport.use(new LocalStrategy(
  {
    usernameField: 'email'
  },
  function(username, password, done) {

    if (dbInterface.findUser(email, password) == 'error') {
      return done('error');
    }

    if (dbInterface.findUser(email, password).length == 0) {
      return done(null, false, {
        message : 'Usuário inexistente'
      });
    }

    if (!authenticator.checkPassword(dbInterface.findUser(email, password)[0]['salt']),
      password, dbInterface.findUser(email, password)['hash']) {
        return done(null, false, {
          message : 'Senha incorreta'
        })
    }

    return done(null, user);
  }
));
