const router = require('express').Router();
const { conexion } = require('../../conexion');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const verificarAdmin = require('../verificarAdmin');

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

// Obtener todas las categorías
router.get('/categorias', verificarAdmin, function (req, res) {
    const sql = 'SELECT * FROM Categorias';

    conexion.query(sql, function (error, resultados) {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al obtener las categorías' });
        }

        res.json({
            status: 'ok',
            categorias: resultados
        });
    });
});

// Crear un producto
router.post('/productos', verificarAdmin, upload.array('imagen', 3), function (req, res) {
    const { nombre, stock, precio, descrip, marca, categoria } = req.body;

    const validarCategoriaSQL = 'SELECT COUNT(*) as count FROM Categorias WHERE id = ?';
    conexion.query(validarCategoriaSQL, [categoria], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error validando la categoría');
        }
        if (result[0].count === 0) {
            return res.status(400).send('Categoría no válida');
        }
        // Proceder con la inserción...
        const sql = 'INSERT INTO Productos (nombre, stock, precio, descripcion, marca) VALUES (?,?,?,?,?)';
        conexion.query(sql, [nombre, stock, precio, descrip, marca], function (error, resultado) {
            if (error) {
                console.log(error);
                return res.status(500).send('Error en el post');
            }
            const productId = resultado.insertId;

            // Insertar en la tabla ProdCat para asociar el producto con la categoría
            const sqlProdCat = 'INSERT INTO ProdCat (id_producto, id_categoria) VALUES (?, ?)';
            conexion.query(sqlProdCat, [productId, categoria], function (error, resultadoProdCat) {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Error al asociar producto con categoría');
                }

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
    });
});

// Obtener un producto por ID con imágenes
router.get('/productos/:id', verificarAdmin, function (req, res) {
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

// Obtener todos los productos con sus categorías
router.get('/productos', verificarAdmin, function (req, res) {
    const sql = `
        SELECT p.*, c.nombre AS categoria
        FROM Productos p
        LEFT JOIN ProdCat pc ON p.id = pc.id_producto
        LEFT JOIN Categorias c ON c.id = pc.id_categoria
        WHERE p.stock > 0
    `;
    conexion.query(sql, function (error, resultado) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error en el get');
        }
        res.json({ status: 'ok', productos: resultado });
    });
});

// Actualizar un producto, categoría e imagen
router.put('/productos', verificarAdmin, function (req, res) {
    const {
        id,
        nuevonombre,
        stock,
        precio,
        descripcion,
        marca,
        nuevaCategoriaId, // Nuevo ID de categoría (si aplica)
        nuevaImagenUrl // Nueva URL de imagen (si aplica)
    } = req.body;

    // Actualizar producto
    const sqlProducto = "UPDATE Productos SET nombre = ?, stock = ?, precio = ?, descripcion = ?, marca = ? WHERE id = ?";
    conexion.query(sqlProducto, [nuevonombre, stock, precio, descripcion, marca, id], function (error) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error al actualizar producto');
        }

        // Si se proporciona un nuevo ID de categoría, actualizar la relación en ProdCat
        if (nuevaCategoriaId) {
            const sqlCategoria = "UPDATE ProdCat SET id_categoria = ? WHERE id_producto = ?";
            conexion.query(sqlCategoria, [nuevaCategoriaId, id], function (errorCategoria) {
                if (errorCategoria) {
                    console.log(errorCategoria);
                    return res.status(500).send('Error al actualizar categoría');
                }
            });
        }

        // Si se proporciona una nueva URL de imagen, actualizar la imagen
        if (nuevaImagenUrl) {
            const sqlImagen = "UPDATE Imagenes SET url = ? WHERE id_producto = ?";
            conexion.query(sqlImagen, [nuevaImagenUrl, id], function (errorImagen) {
                if (errorImagen) {
                    console.log(errorImagen);
                    return res.status(500).send('Error al actualizar imagen');
                }
            });
        }

        // Si todo se actualizó correctamente, responder con éxito
        res.json({ status: 'ok' });
    });
});

// Eliminar un producto
router.delete('/productos/:id', verificarAdmin, (req, res) => {
    const { id } = req.params;

    // Verificar si el producto existe antes de intentar eliminar
    const checkProductSQL = 'SELECT * FROM Productos WHERE id = ?';
    conexion.query(checkProductSQL, [id], (err, result) => {
        if (err) {
            console.error('Error verificando el producto:', err);
            return res.status(500).send('Error interno al verificar el producto');
        }
        if (result.length === 0) {
            return res.status(404).send('Producto no encontrado');
        }

        // Obtener las imágenes asociadas al producto para eliminarlas físicamente
        const getImagesSQL = 'SELECT url FROM Imagenes WHERE id_producto = ?';
        conexion.query(getImagesSQL, [id], (err, images) => {
            if (err) {
                console.error('Error obteniendo imágenes:', err);
                return res.status(500).send('Error al obtener imágenes');
            }

            // Eliminar las imágenes físicas
            images.forEach(image => {
                const imagePath = path.join(__dirname, '../../public/images/', image.url);  // Ruta completa a la imagen
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar imagen:', err);
                    } else {
                        console.log(`Imagen eliminada: ${imagePath}`);
                    }
                });
            });

            // Inicia eliminación de imágenes, relaciones y producto
            const deleteImagesSQL = 'DELETE FROM Imagenes WHERE id_producto = ?';
            const deleteRelationsSQL = 'DELETE FROM ProdCat WHERE id_producto = ?';
            const deleteProductSQL = 'DELETE FROM Productos WHERE id = ?';

            // Realiza las consultas de eliminación
            conexion.query(deleteImagesSQL, [id], (err) => {
                if (err) {
                    console.error('Error eliminando imágenes:', err);
                    return res.status(500).send('Error interno al eliminar imágenes');
                }

                conexion.query(deleteRelationsSQL, [id], (err) => {
                    if (err) {
                        console.error('Error eliminando relación de categoría:', err);
                        return res.status(500).send('Error al eliminar relación de categoría');
                    }

                    conexion.query(deleteProductSQL, [id], (err) => {
                        if (err) {
                            console.error('Error eliminando producto:', err);
                            return res.status(500).send('Error al eliminar producto');
                        }

                        res.send('Producto y datos asociados eliminados correctamente');
                    });
                });
            });
        });
    });
});

module.exports = router;