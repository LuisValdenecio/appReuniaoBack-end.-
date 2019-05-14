const {Pool} = require('pg');
const uuidv4 = require('uuid/v4');
const passport = require('passport');
const authenticator = require('../config/authentication.js');

const dbConfig = {
	user: "luisServer",
	host: "127.0.0.1",
	database: "CEPPH-DATABASE",
	password: "Angelina1997Nando",
	port: 5432,
};

const pool = new Pool(dbConfig);

module.exports = {

	loginUser(req, res) {

    token = authenticator.generateJWT({
	    'codUser': '123',
	    'typeOfUser' : 'admin',
	    'email': 'abc@gmail.com',
	    'name': 'Luis',
	    'exp': parseInt(new Date().getTime() / 1000),
    });
    res.status(200);
    res.json({
      "token" : token
    });

	},

	getClassGrade(req, res) {

		try {

			const CLASS_URL = req["url"].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT nome_class FROM turma WHERE turma_id = $1', [CLASS_URL], (err,results)=> {
			    done();

			    if (err) {
			      console.log(err.stack)
			    } else {
			      res.json(results.rows)
			    }
			  })
			});

		} catch (ex) {
			throw(ex);
		}

	},

  getAllUsers(req,res) {

    try {

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT * FROM estudante ORDER BY numero ASC', (err,results)=> {
			    done();

			    if (err) {
			      console.log(err.stack)
			    } else {
			      res.json(results.rows)
			    }
			  })
			});

    } catch (ex) {
      throw(ex);
    }
  },

	getThisCLassFaults(req, res) {
		try {

			const CLASS_URL = req["url"].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT estudantecod, disciplina_nome, ausencia, material, disciplinar, participacao FROM falta WHERE turma_id = $1', [CLASS_URL], (err,results)=> {
			    done();

			    if (err) {
			      console.log(err.stack)
			    } else {
			      res.json(results.rows)
			    }
			  })
			});

		} catch (ex) {
			throw(ex);
		}
	},

	//-->> este método não tem nada que ver com o getClassGrade(), este retira informações referentes a notas na DB
	getClassGrades(req, res) {
		try {
			const CLASS_URL = req["url"].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT estudantecod, comportamento, mac, pp1, pp2, ct, disciplina_nome ,trimestre FROM minipauta WHERE turma_id = $1', [CLASS_URL], (err,results)=> {
			    done();

			    if (err) {
			      console.log(err.stack)
			    } else {
			      res.json(results.rows)
			    }
			  })
			});

		} catch (ex) {
			throw(ex);
		}
	},

  getAllClasses(req,res) {
    try {

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT * FROM turma', (err, results)=> {
			    done();

			    if (err) {
			      console.log(err.stack)
			    } else {
			      res.json(results.rows)
			    }
			  })
			});

    } catch(ex) {
      throw(ex);
    }
  },

  getSetupValues(req, res) {

  },

	getAllSubjects(req, res) {
		try {

			const CLASS_URL = req["url"].split("/")[1];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT nome_class, curso_nome FROM turma WHERE turma_id = $1', [CLASS_URL], (err,results)=> {
			    done();

			    if (err) {
			      console.log(err.stack)
			    } else {

						pool.connect((err, client, done) => {
						  if (err) throw err
						  client.query('SELECT disciplina_nome FROM disciplina_classe WHERE curso_nome = $1 AND nome_class = $2', [results.rows[0]['curso_nome'], results.rows[0]['nome_class']], (error,resu)=> {
						    done();

						    if (err) {
						      console.log(err.stack)
						    } else {
						      res.json(resu.rows)
						    }
						  })
						});

					}
			  })
			});

		} catch (ex) {
			throw(ex);
		}
	},

	saveTeacher(req, res) {

	},

	// --> encontra formas de tornar este método assíncrono (urgente)
	findUser(emailAddress, password) {
		try {

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT usercod, name, typeofuser, salt, hash FROM usuarios WHERE email=$1', [], (err,results)=> {
			    done();
			    if (err) {
			      console.log(err.stack)
			    } else {
			      res.json(results.rows)
			    }
			  })
			});

		} catch (ex) {
			throw(ex);
		}
	}


}
