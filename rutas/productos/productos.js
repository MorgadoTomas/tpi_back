const router = require('express').Router();
const { conexion } = require('../../conexion');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../public/images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
})

const upload = multer({ storage: storage })

router.post('/productos', upload.array('imagen', 3), function (req, res) {
    const { nombre, stock, precio, descrip, marca } = req.body;
    const sql = 'INSERT INTO Productos (nombre, stock, precio, descripcion, marca) VALUES (?,?,?,?,?)';
    conexion.query(sql, [nombre, stock, precio, descrip, marca], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('error en el post')
        }
        res.json({ status: 'ok'}); 
        const productId = resultado.insertId;
    })

    const sqlImg = "INSERT INTO Imagenes (id_producto, url) VALUES (?,?)";

    if (req.files && req.files.length > 0) {

        const imagenesSubidas = req.files.map(file => ({
            productId: productId,
            imagenUrl: file.filename
        }));

        const promises = imagenesSubidas.map(imagen => {
            return new Promise((resolve, reject) => {
                conexion.query(sqlImg, [imagen.productId, imagen.imagenUrl], (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            });
        });

        Promise.all(promises)
            .then(() => {
                res.status(201).json({
                    message: 'Propiedad e imágenes creadas con éxito',
                    productId: productId,
                    imagenes: imagenesSubidas.map(imagen => imagen.imagenUrl)
                });
            })
            .catch(err => {
                res.status(500).json({ error: 'Error al guardar las imágenes: ' + err.message });
            });

    }
})

router.get('/productos', function (req, res) {
    const {stock} = req.query;
    const sql = 'SELECT * FROM Productos WHERE stock > 0'
    conexion.query(sql, [stock], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el get')
        }
        res.json({ status: 'ok', productos: ArrayResultado })
    })
})

router.put('/productos', function (req, res) {
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

router.delete('/productos', function (req, res) {
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