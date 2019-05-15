module.exports = {

  registerTeacher(err, client, done, req) {
    if (err) throw err 
    client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome)',
      [
        req.body['turma_id'],
        req.body['nomedisciplina'],
        req.body['coordenador'],
        req.body['coordenador'],
        FIXED_ID,
        req.body['name']
      ], (error,resu)=> {
        done();
        if (err) {
          console.log(err.stack)
        } else {
          res.json(resu.rows)
        }
    })
  }

}
