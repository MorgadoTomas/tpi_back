const router = require('express').Router();
const usuariosRouter = require ('./usuarios/usuarios')

router.post('/usuarios', usuariosRouter)


module.exports = router;