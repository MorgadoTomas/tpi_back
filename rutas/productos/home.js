const router = require('express').Router();
const { conexion } = require('../../conexion');

router.get('/home', function (req, res) {
    const { nombre } = req.query;
    const sql = `SELECT * FROM Productos WHERE stock > 0 nombre like '%?%'`
    conexion.query(sql, [nombre], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el get')
        }
        res.json({ status: 'ok', productos: resultado})
    })
})

router.get('/homec', function (req, res) {
    const { id_categoria } = req.query;
    const sql = `SELECT * FROM Productos AS P JOIN ProdCat AS PC ON P.id = PC.id_producto 
    JOIN Categorias C ON C.id = PC.id_categoria WHERE C.id = ?`;

    conexion.query(sql, [id_categoria], function (err, result) {
        if (err) return res.json(err);
        res.json({ status: 'ok', productos: result });
        console.log(result);
    })
})

module.exports = router;