const router = require('express').Router();
const { conexion } = require('../../conexion');
const fs = require('fs');
const path = require('path');
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
    });

  
    // Inserción de producto en la base de datos
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

// Obtener todos los productos con sus categorías
router.get('/productos', function (req, res) {
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

router.get('/ventas', (req, res) => {
    const sql = `
        SELECT 
            c.id AS compraId, 
            c.total, 
            c.direccion, 
            u.nombre AS usuario, 
            m.tipo_de_pago AS metodoPago, 
            p.nombre AS producto, 
            dc.cantidad, 
            dc.precio_u 
        FROM Compras c
        INNER JOIN Usuarios u ON c.id_usuario = u.id
        INNER JOIN Metododepago m ON c.id_met_de_pago = m.id
        INNER JOIN Detalledecompra dc ON c.id = dc.id_compra
        INNER JOIN Productos p ON dc.id_producto = p.id;
    `;

    conexion.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener las ventas:', err);
            return res.status(500).json({ error: 'Error al obtener las ventas' });
        }
        res.json(results);
    });
});

// Eliminar un producto
router.delete('/productos/:id', (req, res) => {
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
                        console.error('Error eliminando relaciones:', err);
                        return res.status(500).send('Error interno al eliminar relaciones');
                    }

                    conexion.query(deleteProductSQL, [id], (err) => {
                        if (err) {
                            console.error('Error eliminando producto:', err);
                            return res.status(500).send('Error interno al eliminar producto');
                        }

                        // Respuesta exitosa
                        res.status(200).json({ message: 'Producto eliminado con éxito' });
                    });
                });
            });
        });
    });
});

module.exports = router;