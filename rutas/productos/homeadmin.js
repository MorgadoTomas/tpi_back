const router = require('express').Router();
const { conexion } = require('../../conexion');

router.post('/homeadmin', function (req, res) {
    const { nombre, stock, precio, descrip, marca } = req.body;
    const sql = 'INSERT INTO Productos (nombre, stock, precio, descripcion, marca) VALUES (?,?,?,?,?)';
    conexion.query(sql, [nombre, stock, precio, descrip, marca], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Ocurrio un error')
        }
        res.json({ status: 'ok' });
    })

})
router.get('/homeadmin', function (req, res) {
    const { nombre } = req.query;
    const sql = 'SELECT nombre FROM Productos WHERE nombre = ?'
    conexion.query(sql, [nombre], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el get')
        }
        res.json({ status: 'ok' })
    })

})
router.put('/homeadmin', function (req, res) {
    const { nombre, stock, precio, descrip, marca } = req.body;
    const sql = 'UPDATE Productos'

})
router.delete('/homeadmin', function (req, res) {

})
module.exports = router;