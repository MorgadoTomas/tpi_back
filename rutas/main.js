const router = require('express').Router();
const usuariosRouter = require('./usuarios/usuarios');
const adminRouter = require('./productos/productos')
const homeRouter = require('./productos/home')

router.use('/usuarios', usuariosRouter);   // Ruta de usuarios
router.use('/admin', adminRouter);         // Ruta de administración (productos)
router.use('/', homeRouter);               // Ruta de home

module.exports = router;