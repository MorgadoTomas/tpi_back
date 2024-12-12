const router = require('express').Router();
const { conexion } = require('../../conexion');
const multer = require('multer');
const verificarAdmin = require('../verificarAdmin');
const fs = require('fs');
const path = require('path');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/images/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Obtener todas las categorías
router.get('/categorias', verificarAdmin, (req, res) => {
    const sql = 'SELECT * FROM Categorias';
    conexion.query(sql, (error, resultados) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al obtener las categorías' });
        }
        res.json({ status: 'ok', categorias: resultados });
    });
});

// Crear un producto
router.post('/productos', verificarAdmin, upload.array('imagen', 3), (req, res) => {
    const { nombre, stock, precio, descrip, marca, categoria } = req.body;

    const validarCategoriaSQL = 'SELECT COUNT(*) as count FROM Categorias WHERE id = ?';
    conexion.query(validarCategoriaSQL, [categoria], (err, result) => {
        if (err) return res.status(500).send('Error validando la categoría');
        if (result[0].count === 0) return res.status(400).send('Categoría no válida');

        const sql = 'INSERT INTO Productos (nombre, stock, precio, descripcion, marca) VALUES (?,?,?,?,?)';
        conexion.query(sql, [nombre, stock, precio, descrip, marca], (error, resultado) => {
            if (error) return res.status(500).send('Error al crear producto');

            const productId = resultado.insertId;
            const sqlProdCat = 'INSERT INTO ProdCat (id_producto, id_categoria) VALUES (?, ?)';
            conexion.query(sqlProdCat, [productId, categoria], (errorProdCat) => {
                if (errorProdCat) return res.status(500).send('Error al asociar producto con categoría');

                if (req.files && req.files.length > 0) {
                    const sqlImg = "INSERT INTO Imagenes (id_producto, url) VALUES (?,?)";
                    const imagenesSubidas = req.files.map(file => ({
                        productId: productId,
                        imagenUrl: file.filename
                    }));

                    const promises = imagenesSubidas.map(imagen =>
                        new Promise((resolve, reject) => {
                            conexion.query(sqlImg, [imagen.productId, imagen.imagenUrl], (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        })
                    );

                    Promise.all(promises)
                        .then(() => res.status(201).json({
                            message: 'Producto e imágenes creadas con éxito',
                            productId: productId,
                            imagenes: imagenesSubidas.map(imagen => imagen.imagenUrl)
                        }))
                        .catch(err => res.status(500).json({ error: 'Error al guardar las imágenes' }));
                } else {
                    res.status(201).json({ message: 'Producto creado sin imágenes', productId: productId });
                }
            });
        });
    });
});

// Obtener un producto por ID con imágenes
router.get('/productos/:id', verificarAdmin, (req, res) => {
    const { id } = req.params;

    const sqlProducto = 'SELECT * FROM Productos WHERE id = ?';
    const sqlImagenes = 'SELECT url FROM Imagenes WHERE id_producto = ?';

    conexion.query(sqlProducto, [id], (error, resultados) => {
        if (error) return res.status(500).json({ error: 'Error al obtener el producto' });
        if (resultados.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        const producto = resultados[0];
        conexion.query(sqlImagenes, [id], (error, imagenes) => {
            if (error) return res.status(500).json({ error: 'Error al obtener imágenes del producto' });
            res.json({
                producto: {
                    ...producto,
                    imagenes: imagenes.map((img) => img.url)
                }
            });
        });
    });
});

// Obtener todos los productos con sus categorías
router.get('/productos', verificarAdmin, (req, res) => {
    const sql = `
        SELECT p.*, c.nombre AS categoria
        FROM Productos p
        LEFT JOIN ProdCat pc ON p.id = pc.id_producto
        LEFT JOIN Categorias c ON c.id = pc.id_categoria
        WHERE p.stock > 0
    `;
    conexion.query(sql, (error, resultado) => {
        if (error) return res.status(500).send('Error al obtener productos');
        res.json({ status: 'ok', productos: resultado });
    });
});

// Actualizar un producto, categoría e imagen
router.put('/productos', verificarAdmin, (req, res) => {
    const { id, nuevonombre, stock, precio, descripcion, marca, nuevaCategoriaId, nuevaImagenUrl } = req.body;

    const sqlProducto = "UPDATE Productos SET nombre = ?, stock = ?, precio = ?, descripcion = ?, marca = ? WHERE id = ?";
    conexion.query(sqlProducto, [nuevonombre, stock, precio, descripcion, marca, id], (error) => {
        if (error) return res.status(500).send('Error al actualizar producto');

        if (nuevaCategoriaId) {
            const sqlCategoria = "UPDATE ProdCat SET id_categoria = ? WHERE id_producto = ?";
            conexion.query(sqlCategoria, [nuevaCategoriaId, id], (errorCategoria) => {
                if (errorCategoria) return res.status(500).send('Error al actualizar categoría');
            });
        }

        if (nuevaImagenUrl) {
            const sqlImagen = "UPDATE Imagenes SET url = ? WHERE id_producto = ?";
            conexion.query(sqlImagen, [nuevaImagenUrl, id], (errorImagen) => {
                if (errorImagen) return res.status(500).send('Error al actualizar imagen');
            });
        }

        res.json({ status: 'ok' });
    });
});

// Eliminar un producto
router.delete('/productos/:id', verificarAdmin, (req, res) => {
    const { id } = req.params;

    const checkProductSQL = 'SELECT * FROM Productos WHERE id = ?';
    conexion.query(checkProductSQL, [id], (err, result) => {
        if (err) return res.status(500).send('Error al verificar el producto');
        if (result.length === 0) return res.status(404).send('Producto no encontrado');

        const getImagesSQL = 'SELECT url FROM Imagenes WHERE id_producto = ?';
        conexion.query(getImagesSQL, [id], (err, images) => {
            if (err) return res.status(500).send('Error al obtener imágenes');

            images.forEach(image => {
                const imagePath = path.join(__dirname, '../../public/images/', image.url);
                fs.unlink(imagePath, (err) => {
                    if (err) console.error('Error al eliminar imagen:', err);
                    else console.log(`Imagen eliminada: ${imagePath}`);
                });
            });

            const deleteImagesSQL = 'DELETE FROM Imagenes WHERE id_producto = ?';
            const deleteRelationsSQL = 'DELETE FROM ProdCat WHERE id_producto = ?';
            const deleteProductSQL = 'DELETE FROM Productos WHERE id = ?';

            conexion.query(deleteImagesSQL, [id], (err) => {
                if (err) return res.status(500).send('Error al eliminar imágenes');

                conexion.query(deleteRelationsSQL, [id], (err) => {
                    if (err) return res.status(500).send('Error al eliminar relación de categoría');

                    conexion.query(deleteProductSQL, [id], (err) => {
                        if (err) return res.status(500).send('Error al eliminar producto');
                        res.send('Producto y datos asociados eliminados correctamente');
                    });
                });
            });
        });
    });
});

module.exports = router;