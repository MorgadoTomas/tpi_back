const router = require('express').Router();
const usuariosRouter = require('./usuarios/usuarios');
const adminRouter = require ('./productos/homeadmin')


router.use('/usuarios', usuariosRouter);
router.use('/admin', adminRouter)

module.exports = router;