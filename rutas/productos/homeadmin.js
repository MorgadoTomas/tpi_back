const router = require('express').Router();
const { conexion } = require('../../conexion');

router.post('/homeadmin', function (req, res) {
    const { nombre, stock, precio, descrip, marca } = req.body;
    const sql = 'INSERT INTO Productos (nombre, stock, precio, descripcion, marca) VALUES (?,?,?,?,?)';
    conexion.query(sql, [nombre, stock, precio, descrip, marca], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('error en el post')
        }
        res.json({ status: 'ok' });
    })
})

router.get('/homeadmin', function (req, res) {
    const sql = 'SELECT * FROM Productos WHERE stock > 0'
    conexion.query(sql, [nombre], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el get')
        }
        res.json({ status: 'ok' })
    })
})

router.put('/homeadmin', function (req, res) {
    const { id, nuevonombre, stock, precio, descripcion, marca } = req.body;
    const sql = "UPDATE Productos SET nombre = ?, stock = ?, precio = ?, descripcion = ?, marca = ? WHERE id = ?";
    conexion.query(sql, [nuevonombre, stock, precio, descripcion, marca, id], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el put')
        }
        res.json({ status: 'ok' })
    })
})

router.delete('/homeadmin', function (req, res) {
    const { id } = req.query;
    const sql = "DELETE FROM Productos WHERE id = ?"
    conexion.query(sql, [id], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el delete')
        }
        res.json({ status: 'ok' })
    })
})

module.exports = router;