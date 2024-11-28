const router = require('express').Router();
const usuariosRouter = require('./usuarios/usuarios');
const adminRouter = require('./productos/productos')
const homeRouter = require('./productos/home')

router.use('/usuarios', usuariosRouter);
router.use('/', adminRouter);
router.use('/', homeRouter)

module.exports = router;
