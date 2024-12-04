
const router = require('express').Router();
const { conexion } = require('../../conexion');
const multer = require('multer');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/'); // Ruta para guardar las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombre único para las imágenes
    }
});

const upload = multer({ storage: storage }); // Middleware de multer


// crear un producto
router.post('/productos', upload.array('imagen', 3), function (req, res) {
    const { nombre, stock, precio, descrip, marca } = req.body;

    // Inserción de producto en la base de datos
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

router.put('/carrito', function (req, res) {
    const {stock, id} = req.body;
    const sql = "UPDATE Productos SET stock = stock - ? WHERE id = ?";
    conexion.query(sql, [stock, id], function (error, resultado) {
        if (error) {
            console.log(error)
            return res.send('Error en el put')
        }
        res.json({ status: 'ok, modificacion completa' })
    })
})

router.post('/carrito', (req, res) => {
    const { id_usuario, id_met_de_pago, direccion, total } = req.body;

    const sql = `
        INSERT INTO Compras (id_usuario, id_met_de_pago, direccion, total)
        VALUES (?, ?, ?, ?)
    `;

    conexion.query(sql, [id_usuario, id_met_de_pago, direccion, total], (err, result) => {
        if (err) {
            console.error('Error al registrar la compra:', err);
            return res.status(500).json({ error: 'Error al registrar la compra' });
        }

        res.status(201).json({ compraId: result.insertId });
    });
});

router.post('/carrito/detalle', (req, res) => {
    const { id_compra, id_producto, cantidad, precio_u } = req.body;

    const sql = `
        INSERT INTO Detalledecompra (id_compra, id_producto, cantidad, precio_u)
        VALUES (?, ?, ?, ?)
    `;

    conexion.query(sql, [id_compra, id_producto, cantidad, precio_u], (err) => {
        if (err) {
            console.error('Error al insertar detalle de compra:', err);
            return res.status(500).json({ error: 'Error al insertar detalle de compra' });
        }
        res.status(201).json({ message: 'Detalle registrado correctamente' });
    });
});

// Eliminar un producto
router.delete('/productos/:id', function (req, res) {
    const { id } = req.params;
    const sql = 'DELETE FROM Productos WHERE id = ?';

    conexion.query(sql, [id], function (error, resultado) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error al eliminar el producto');
        }
        res.status(200).json({ message: 'Producto eliminado con éxito' });
    });
});

module.exports = router;