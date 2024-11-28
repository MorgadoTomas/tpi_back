const router = require('express').Router();
const { conexion } = require('../../conexion');
const multer = require('multer');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/'); // Ajuste en la ruta
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Crear un producto con imágenes
router.post('/productos', upload.array('imagen', 3), function (req, res) {
    const { nombre, stock, precio, descrip, marca } = req.body;
    const sql = 'INSERT INTO Productos (nombre, stock, precio, descripcion, marca) VALUES (?,?,?,?,?)';
    conexion.query(sql, [nombre, stock, precio, descrip, marca], function (error, resultado) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error en el post');
        }
        const productId = resultado.insertId;
        const sqlImg = "INSERT INTO Imagenes (id_producto, url) VALUES (?,?)";

        if (req.files && req.files.length > 0) {
            const imagenesSubidas = req.files.map(file => ({
                productId: productId,
                imagenUrl: file.filename
            }));

            const promises = imagenesSubidas.map(imagen => {
                return new Promise((resolve, reject) => {
                    conexion.query(sqlImg, [imagen.productId, imagen.imagenUrl], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    res.status(201).json({
                        message: 'Producto e imágenes creadas con éxito',
                        productId: productId,
                        imagenes: imagenesSubidas.map(imagen => imagen.imagenUrl)
                    });
                })
                .catch(err => {
                    res.status(500).json({ error: 'Error al guardar las imágenes: ' + err.message });
                });
        } else {
            res.status(201).json({ message: 'Producto creado sin imágenes', productId: productId });
        }
    });
});

// Obtener un producto por ID con imágenes
router.get('/productos/:id', function (req, res) {
    const { id } = req.params;

    const sqlProducto = 'SELECT * FROM Productos WHERE id = ?';
    const sqlImagenes = 'SELECT url FROM Imagenes WHERE id_producto = ?';

    conexion.query(sqlProducto, [id], function (error, resultados) {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al obtener el producto' });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = resultados[0];

        conexion.query(sqlImagenes, [id], function (error, imagenes) {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Error al obtener las imágenes del producto' });
            }

            res.json({ 
                producto: { 
                    ...producto, 
                    imagenes: imagenes.map((img) => img.url) 
                } 
            });
        });
    });
});

// Obtener todos los productos
router.get('/productos', function (req, res) {
    const sql = 'SELECT * FROM Productos WHERE stock > 0';
    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error en el get');
        }
        res.json({ status: 'ok', productos: resultado });
    });
});

// Actualizar un producto
router.put('/productos', function (req, res) {
    const { id, nuevonombre, stock, precio, descripcion, marca } = req.body;
    const sql = "UPDATE Productos SET nombre = ?, stock = ?, precio = ?, descripcion = ?, marca = ? WHERE id = ?";
    conexion.query(sql, [nuevonombre, stock, precio, descripcion, marca, id], function (error) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error en el put');
        }
        res.json({ status: 'ok' });
    });
});

// Eliminar un producto
router.delete('/productos', function (req, res) {
    const { id } = req.query;
    const sql = "DELETE FROM Productos WHERE id = ?";
    conexion.query(sql, [id], function (error) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error en el delete');
        }
        res.json({ status: 'ok' });
    });
});

module.exports = router;

