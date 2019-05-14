/*//////////////////////////////////////////////////////////////////////////////
  Este módulo será o responsavel por tratar aspectos relacionados a seguraça
  de password
*///////////////////////////////////////////////////////////////////////////////

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

module.exports = {

    setPassword(password) {
      var randomSalt = crypto.randomBytes(16).toString('hex');
      var hash = crypto.pbkdf2Sync(password, randomSalt, 1000, 64, 'sha512').toString('hex');
      return {'salt' : randomSalt, 'hash' : hash}
    },

    checkPassword(salt, password, hash) {
      return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex') == hash;
    },

    generateJWT(codeUser, email, name, typeOfUser) {

      var expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      return jwt.sign({
        'codUser': codeUser,
        'typeOfUser' : typeOfUser,
        'email': email,
        'name': name,
        'exp': parseInt(expiry.getTime() / 1000),
      }, process.env.API_CLIENT_SECRET);

    }

}
