const router = require('express').Router();
const usuariosRouter = require('./usuarios/usuarios');


router.use('/usuarios', usuariosRouter);

module.exports = router;