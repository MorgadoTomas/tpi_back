const router = require('express').Router();
const usuariosRouter = require('./usuarios/usuarios');
const adminRouter = require('./productos/productos');
const homeRouter = require('./productos/home');
const verificarAdmin = require('./verificarAdmin');

router.post('/check-admin', verificarAdmin, (req, res) => {
  res.json({ isAdmin: true });
});

router.use('/usuarios', usuariosRouter);  
router.use('/', homeRouter);  
router.use('/admin', verificarAdmin, adminRouter);  

module.exports = router;
