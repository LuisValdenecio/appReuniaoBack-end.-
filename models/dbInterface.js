const {Pool} = require('pg');
const uuidv4 = require('uuid/v4');
const passport = require('passport');
const authenticator = require('../config/authentication.js');

// custom modules
const modelUtilities = require('./modelUtilities.js');

const dbConfig = {
	user: process.env.DB_USER,
	host: process.env.DB_HOST_SERVER,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_SERVER_PORT
};

const pool = new Pool(dbConfig);

module.exports = {

	loginUser(req, res) {

		// --> este código será substituído pela autenticação local do passport
		pool.connect((err, client, done) => {
			if (err) throw err
			client.query('SELECT salt, hash, usercod, typeofuser, name FROM usuarios WHERE email = $1', [req.body['email']], (err,results)=> {
				done();

				if (err) {
					console.log(err.stack)
				} else {

					if (results.rows.length == 0) {
						// caso a senha não exista
						res.json("conta inexistente");
					} else {
						// se este email existir na base de dados, conferir a passe

						console.log(req.body['email']);

						var isValid = authenticator.checkPassword(results.rows[0]['salt'], req.body['password'], results.rows[0]['hash']);

						console.log(isValid);

						// se este usuário for válido retorna o jwt
						if (isValid) {

							var token = authenticator.generateJWT(results.rows[0]['usercod'], results.rows[0]['email'], results.rows[0]['name'], results.rows[0]['typeofuser']);
							res.status(200);
					    res.json({
					      "token" : token
					    });

						} else {
							res.json("palavra passe inválida");
						}

					}

				}
			})
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

	getTeacherCoordStatus(req, res) {
		try {

			const teacherCod = req['url'].split("/")[1].split("_")[1];
			const classCod = req['url'].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
				if (err) throw err
				client.query('SELECT coordenador FROM turmasdoprofessor	WHERE turma_id = $1 AND usercod = $2', [classCod, teacherCod], (err,results)=> {
					done();
					if (err) {
						console.log(err.stack)
					} else {

						// se dentre os resultados houver um valor booleano true, então retorna o length do vector
						var theSignal = results.rows.filter(turma => turma['coordenador'] == true);
						if (theSignal.length > 0) {
							res.json(1);
						} else {
							res.json(0);
						}

					}
				})
			});


		} catch (ex) {
			throw(ex);
		}
	},

	getAllStudents(req, res) {

		try {

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT * FROM estudante', (err,results)=> {
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

	getClassTeachers(req, res) {

		try {

			const CLASS_URL = req["url"].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT disciplina_nome, nome FROM turmasdoprofessor	 WHERE turma_id = $1', [CLASS_URL], (err,results)=> {
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

	getThisTeacherSubjects(req, res) {

		try {

			const teacherCod = req['url'].split("/")[1].split("_")[0];
			const classCod = req['url'].split("/")[1].split("_")[1];

			pool.connect((err, client, done) => {
				if (err) throw err
				client.query('SELECT disciplina_nome FROM turmasdoprofessor	 WHERE turma_id = $1 AND usercod = $2', [classCod, teacherCod], (err,results)=> {
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

	getTeacherClasses(req, res) {
		try {

			const TEACHER_COD = req["url"].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT turma_id from turmasdoprofessor WHERE usercod = $1', [TEACHER_COD], (err,results)=> {
			    done();
			    if (err) {
			      console.log(err.stack)
			    } else {

						if (results.rows.length == 0) {
							res.json('Professor sem atribuição de turma');
						} else {

							var classesCod = [];
							var resultsToSendBack = [];

							results.rows.forEach((turma)=>{
								if (classesCod.indexOf(turma['turma_id']) == -1) {
									classesCod.push(turma['turma_id']);
								}
							})

							if (classesCod.length == 1) {
								// professor associado somente a uma turma
								pool.connect((err, client, done) => {
								  if (err) throw err
								  client.query('SELECT * FROM turma	WHERE turma_id = $1', [classesCod[0]], (error,resu)=> {
								    done();
								    if (err) {
								      console.log(error.stack);
								    } else {
								      res.json(resu.rows);
								    }
								  })
								});
							} else {

								var resultsToSend = [];

								// professor associado a mais de uma turma
								classesCod.forEach((turma, index)=>{

									pool.connect((err, client, done) => {
									  if (err) throw err
									  client.query('SELECT * FROM turma	WHERE turma_id = $1', [turma], (error,resu)=> {
									    done();
									    if (err) {
									      console.log(error.stack);
									    } else {
									      resultsToSend.push(resu.rows[0]);
												// send the response back if I'm already on the last element
												if (index == classesCod.length - 1) {
													res.json(resultsToSend);
												}

									    }
									  })
									});

								});
							}
						}
					}
			  })
			});

		} catch (ex) {
			throw(ex);
		}

	},


  getAllUsers(req,res) {

    try {

			const CLASS_URL = req["url"].split("/")[1].split("_")[0];

			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT * FROM estudante WHERE turma_id = $1 ORDER BY numero ASC', [CLASS_URL],  (err,results)=> {
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

			// certifique-se de somente selecionar ausencias cujos valores sejam positivos
			pool.connect((err, client, done) => {
			  if (err) throw err
			  client.query('SELECT estudantecod, disciplina_nome, ausencia, material, disciplinar, participacao FROM falta WHERE turma_id = $1 AND ausencia > $2', [CLASS_URL, 0], (err,results)=> {
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

			// antes de enviar as infos de notas, decida em qual nível é que a turma esta
			pool.connect((err, client, done) => {
				if (err) throw err
				client.query('SELECT nome_class FROM turma WHERE turma_id = $1', [CLASS_URL], (err,results)=> {
					done();
					if (err) {
						console.log(err.stack)
					} else {

						if (
									results.rows[0]['nome_class'] == 'Iniciação' || results.rows[0]['nome_class'] == '1ª Classe' ||
									results.rows[0]['nome_class'] == '2ª Classe' || results.rows[0]['nome_class'] == '3ª Classe' ||
									results.rows[0]['nome_class'] == '4ª Classe'
						) {

							// envie dados para turmas do ensino primário
							pool.connect((err, client, done) => {
								if (err) throw err
								client.query('SELECT estudantecod, avaliacaodisciplinar, situacaonotas, disciplina_nome ,resolucao_de_tarefas, trimestre FROM minipauta_primario WHERE turma_id = $1', [CLASS_URL], (error,resu)=> {
									done();
									if (error) {
										console.log(error.stack)
									} else {
										res.json(resu.rows)
									}
								})
							});

						} else {

							// envie dados para turmas do Iº ciclo e ensino técnico
							pool.connect((err, client, done) => {
								if (err) throw err
								client.query('SELECT estudantecod, comportamento, pp1, disciplina_nome ,trimestre, participacao FROM minipauta WHERE turma_id = $1', [CLASS_URL], (error,resu)=> {
									done();
									if (error) {
										console.log(error.stack)
									} else {
										res.json(resu.rows)
									}
								})
							});

						}
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

		const FIXED_ID = uuidv4();
		console.log(req.body)

		const saltAndHash = authenticator.setPassword(req.body['password']);

		var salt = saltAndHash['salt'];
		var hash = saltAndHash['hash'];

		pool.connect((err, client, done) => {
			if (err) throw err
			client.query('SELECT usercod, name, typeofuser, salt, hash FROM usuarios WHERE email=$1', [req.body['email']], (err,results)=> {
				done();
				if (err) {
					console.log(err.stack)
				} else {

					if (results.rows.length == 0) {

						// register a new user
						pool.connect((err, client, done) => {
						  if (err) throw err
						  client.query('INSERT INTO usuarios (usercod, name, typeofuser, salt, hash, email) VALUES ($1, $2, $3, $4, $5, $6)',
							 	[FIXED_ID, req.body['name'], 'teacher', salt, hash, req.body['email']], (error,resu)=> {
						    	done();
						    if (err) {
						      console.log(error.stack)
						    } else {

									// before registering a new teacher, checks to see if this subject is already taken
									// or if this teacher is being registered as a coordinator checkts to see if class
									// doesn't already possess one.
									pool.connect((err, client, done) => {
									  if (err) throw err
									  client.query('SELECT disciplina_nome, coordenador FROM turmasdoprofessor WHERE turma_id = $1 ', [req.body['turma_id']] , (errorInner,resuInner)=> {
									    done();
									    if (err) {
									      console.log(err.stack)
									    } else {

												// quando se regista um professor pela primeira vez
												if (resuInner.rows.length == 0) {

													// se este professor for coordenador de uma turma, registe-o também para a disciplina de avaliações geral
													if (req.body['coordenador']) {

														pool.connect((err, client, done)=> {
															if (err) throw err
															client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
																[
																	req.body['turma_id'],
																	req.body['nomedisciplina'],
																	req.body['coordenador'],
																	FIXED_ID,
																	req.body['name']
																], (error,resu)=> {
																	done();
																	if (err) {
																		console.log(err.stack)
																	} else {

																		// registe este professor para a disciplina de avaliações gerais
																		pool.connect((err, client, done)=> {
																			if (err) throw err
																			client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
																				[
																					req.body['turma_id'],
																					'Avaliação Geral',
																					req.body['coordenador'],
																					FIXED_ID,
																					req.body['name']
																				], (error,resu)=> {
																					done();
																					if (err) {
																						console.log(err.stack)
																					} else {
																						res.json("registo salvo");
																					}
																			})
																		});

																	}
															})
														});

													} else {

														pool.connect((err, client, done)=> {
															if (err) throw err
															client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
																[
																	req.body['turma_id'],
																	req.body['nomedisciplina'],
																	req.body['coordenador'],
																	FIXED_ID,
																	req.body['name']
																], (error,resu)=> {
																	done();
																	if (err) {
																		console.log(err.stack)
																	} else {
																		res.json("registo salvo");
																	}
															})
														});

													}

												} else {

													var classHasCoordinator = resuInner.rows.filter(turma => turma['coordenador'] == true);
													var subjectAlreadyTaken = resuInner.rows.filter(turma => turma['disciplina_nome'] == req.body['nomedisciplina']);

													if (req.body['coordenador'] && classHasCoordinator.length > 0) {
														res.json('Esta turma ja tem um coordenador');
													} else if (req.body['coordenador'] && classHasCoordinator.length == 0 && subjectAlreadyTaken.length == 0) {
														// this teacher is safe to register
														pool.connect((err, client, done)=> {
													    if (err) throw err
													    client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
													      [
													        req.body['turma_id'],
													        req.body['nomedisciplina'],
													        req.body['coordenador'],
													        FIXED_ID,
													        req.body['name']
													      ], (error,resu)=> {
													        done();
													        if (err) {
													          console.log(err.stack)
													        } else {
													          res.json("registo salvo")
													        }
													    })
													  });

														// registe este professor para a disciplina de avaliações gerais
														pool.connect((err, client, done)=> {
															if (err) throw err
															client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
																[
																	req.body['turma_id'],
																	'Avaliação Geral',
																	req.body['coordenador'],
																	FIXED_ID,
																	req.body['name']
																], (error,resu)=> {
																	done();
																	if (err) {
																		console.log(err.stack)
																	} else {
																		res.json("registo salvo");
																	}
															})
														});

													} else if (!req.body['coordenador'] && subjectAlreadyTaken.length == 0) {
														// this teacher is safe to register
														pool.connect((err, client, done)=> {
													    if (err) throw err
													    client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
													      [
													        req.body['turma_id'],
													        req.body['nomedisciplina'],
													        req.body['coordenador'],
													        FIXED_ID,
													        req.body['name']
													      ], (error,resu)=> {
													        done();
													        if (err) {
													          console.log(err.stack)
													        } else {
													          res.json("registo salvo")
													        }
													    })
													  })

													} else {
														res.json("Este disciplina ja deve estar ocupada");
													}

												}
											}
									  })
									});

								}
						  })
						});


					} else {

						// before registering a teacher for a new subject, checks to see if this subject is already taken
						// or if this teacher is being registered as a coordinator checkts to see if class
						// doesn't already possess one.
						pool.connect((err, client, done) => {
							if (err) throw err
							client.query('SELECT disciplina_nome, coordenador FROM turmasdoprofessor WHERE turma_id = $1 ', [req.body['turma_id']] , (errorInner,resuInner)=> {
								done();
								if (err) {
									console.log(err.stack)
								} else {

										var classHasCoordinator = resuInner.rows.filter(turma => turma['coordenador'] == true);
										var subjectAlreadyTaken = resuInner.rows.filter(turma => turma['disciplina_nome'] == req.body['nomedisciplina']);

										if (req.body['coordenador'] && classHasCoordinator.length > 0) {
											res.json('Esta turma ja tem um coordenador');
										} else if (req.body['coordenador'] && classHasCoordinator.length == 0 && subjectAlreadyTaken.length == 0) {
											// this teacher is safe to register
											pool.connect((err, client, done)=> {
												if (err) throw err
												client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
													[
														req.body['turma_id'],
														req.body['nomedisciplina'],
														req.body['coordenador'],
														results.rows[0]['usercod'],
														results.rows[0]['name']
													], (error,resu)=> {
														done();
														if (err) {
															console.log(err.stack)
														} else {

															// registe este professor para a disciplina de avaliações gerais
															pool.connect((err, client, done)=> {
																if (err) throw err
																client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
																	[
																		req.body['turma_id'],
																		'Avaliação Geral',
																		req.body['coordenador'],
																		results.rows[0]['usercod'],
																		results.rows[0]['name']
																	], (error,resu)=> {
																		done();
																		if (err) {
																			console.log(err.stack)
																		} else {
																			res.json("registo salvo");
																		}
																})
															});

														}
												})
											})

										} else if (!req.body['coordenador'] && subjectAlreadyTaken.length == 0) {
											// this teacher is safe to register
											pool.connect((err, client, done)=> {
												if (err) throw err
												client.query('INSERT INTO turmasdoprofessor (turma_id, disciplina_nome, coordenador, usercod, nome) VALUES ($1, $2, $3, $4, $5)',
													[
														req.body['turma_id'],
														req.body['nomedisciplina'],
														req.body['coordenador'],
														results.rows[0]['usercod'],
														results.rows[0]['name']
													], (error,resu)=> {
														done();
														if (err) {
															console.log(err.stack)
														} else {
															res.json("registo salvo")
														}
													})
												})

										} else {
											res.json("Este disciplina ja deve estar ocupada");
										}

									}
								})
							})
						}

					}

				});
			})

	},

	faltas(req, res) {

		try {

			var date = new Date();
			console.log(req.body);

			// iterar sobre todos-2 elementos do vector com as infos de faltas dos estudantes
			for (let estudantes = 0; estudantes < req.body['faultsObject'].length-2; estudantes++) {

				pool.connect((err, client, done) => {
				  if (err) throw err
				  client.query('INSERT INTO falta (falta_cod, estudantecod, turma_id, disciplina_nome, data, ausencia, material, disciplinar, participacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
						[
							uuidv4(),
							req.body['faultsObject'][estudantes]['estudantecod'],
							req.body['faultsObject'][req.body['faultsObject'].length-1]['turma_id'],
							req.body['faultsObject'][req.body['faultsObject'].length-2]['disciplina_nome'],
							""+date.getDate() +"/"+date.getUTCMonth()+"/"+date.getFullYear(),
							req.body['faultsObject'][estudantes]['ausencia'],
							req.body['faultsObject'][estudantes]['material'],
							req.body['faultsObject'][estudantes]['disciplinar'],
							0
						],  (err,results)=> {
				    done();
				    if (err) {
				      console.log(err.stack)
				    } else {
							console.log("falta marcada");
				      res.json("Falta Marcada");
				    }
				  })
				});

				// certifique-te de que não há ausencias negativas na base de dados
				pool.connect((err, client, done) => {
					if (err) throw err
					client.query('UPDATE falta SET ausencia = $1 WHERE ausencia < $2',
						[0, 0], (err,results)=> {
						done();
						if (err) {
							console.log(err.stack)
						} else {
							console.log("faltas negativas actualizadas");
						}
					})
				});

			}

		} catch (ex) {
			throw (ex);
		}

	},

	marcarNotas(req, res) {
		try {

			var counrSucessInserts = 1;

			// inserir as notas na minipauta do ensino primário
			if (req.body['gradesObject'][0]['nivel'] == 'primario') {

				req.body['gradesObject'].forEach((estudante, index)=>{
					if (index > 0) {

						pool.connect((err, client, done) => {
						  if (err) throw err
						  client.query(`INSERT INTO minipauta_primario
									(
										estudantecod,
										avaliacaodisciplinar,
										situacaonotas,
										disciplina_nome,
										resolucao_de_tarefas,
										turma_id,
										trimestre
									) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
								[
									estudante['estudantecod'],
									estudante['avaliacaodisciplinar'],
									estudante['situacaonotas'],
									req.body['gradesObject'][0]['disciplina_nome'],
									estudante['resolucao_de_tarefas'],
									req.body['gradesObject'][0]['turma_id'],
									'IIº'
								],  (err,results)=> {
						    done();
						    if (err) {
						      console.log(err.stack)
						    } else {
									//-> grades sent
						    }
						  })
						});

						counrSucessInserts++;

					}
				})

				if (counrSucessInserts == req.body['gradesObject'].length - 1) {
					res.json("notas enviadas");
				}

			}

			// inserir as notas na minipauta do ensino tecnico
			else {

				req.body['gradesObject'].forEach((estudante, index)=>{
					if (index > 0) {

						pool.connect((err, client, done) => {
						  if (err) throw err
						  client.query(`INSERT INTO minipauta
									(
										estudantecod,
										comportamento,
										pp1,
										trimestre,
										disciplina_nome,
										turma_id,
										participacao
									) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
								[
									estudante['estudantecod'],
									estudante['avaliacaodisciplinar'],
									estudante['pp1'],
									'IIº',
									req.body['gradesObject'][0]['disciplina_nome'],
									req.body['gradesObject'][0]['turma_id'],
									estudante['participacao']
								],  (err,results)=> {
						    done();
						    if (err) {
						      console.log(err.stack)
						    } else {
									//-> grades sent
						    }
						  })
						});

						counrSucessInserts++;
					}
				})

				if (counrSucessInserts == req.body['gradesObject'].length - 1) {
					res.json("notas enviadas");
				}

			}

		} catch (ex) {
			throw(ex);
		}

	},

	justificativo(req, res) {

		try {

			console.log(req.body['faultsObject']);

			// itera sobre as disciplinas e nºs de faltas a justificar
			req.body['faultsObject']['subjects'].forEach((disciplina)=>{

				// apague com uma série sucessiva de updates o número de faltas para esta
				// disciplina em questão.
				var numeroDeFaltas = disciplina['numeroFaltas'];

				pool.connect((err, client, done) => {
					if (err) throw err
					client.query('UPDATE falta SET ausencia = ausencia - $1 WHERE estudantecod = $2 AND disciplina_nome = $3',
					 	[
							numeroDeFaltas,
							req.body['faultsObject']['studentCod']['estudantecod'],
							disciplina['nomeDisciplina']
						], (err,results)=> {
						done();
						if (err) {
							console.log(err.stack)
						} else {
							console.log("faltas eliminadas");
						}
					})
				});

				// certifique-te de que não há ausencias negativas na base de dados
				pool.connect((err, client, done) => {
					if (err) throw err
					client.query('UPDATE falta SET ausencia = $1 WHERE ausencia < $2',
					 	[0, 0], (err,results)=> {
						done();
						if (err) {
							console.log(err.stack)
						} else {
							console.log("faltas negativas actualizadas");
						}
					})
				});

			});

			res.json("faltas justificadas");

		} catch (ex) {
			throw(ex);
		}

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
