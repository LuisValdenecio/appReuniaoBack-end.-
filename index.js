/*//////////////////////////////////////////////////////////////////////////////
 Este file será o ponto de entrada do servidor express
//////////////////////////////////////////////////////////////////////////////*/

const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const {Client} = require('pg');

// A coneção com a base de dados será feita ja no início
const client = new Client({
	user: "luisServer",
	host: "127.0.0.1",
	database: "CEPPH-DATABASE",
	password: "Angelina1997Nando",
	port: 5432,
});

app.get('/', (req, res) => {
  try {
    client.connect();
    client.query('BEGIN');

    client.query('SELECT * FROM estudante', (err,results)=>{
      res.json(results.rows);
    })

  } catch (ex) {
    throw(ex);
  }

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
