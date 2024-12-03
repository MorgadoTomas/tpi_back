const router = require('express').Router();
const { conexion } = require('../../conexion');

// Filtro por nombre, categorías y ordenamiento
router.get('/home', (req, res) => {
    const { nombre, categorias, orden } = req.query;

    let sql = `
        SELECT P.*, GROUP_CONCAT(I.url) AS imagenes
        FROM Productos AS P
        LEFT JOIN Imagenes AS I ON P.id = I.id_producto
        LEFT JOIN ProdCat AS PC ON P.id = PC.id_producto
        LEFT JOIN Categorias AS C ON PC.id_categoria = C.id
        WHERE P.stock > 0`;

    const params = [];

    // Filtrar por nombre si está presente
    if (nombre) {
        sql += " AND P.nombre LIKE ?";
        params.push(`%${nombre}%`);
    }

    // Filtrar por categorías específicas si están presentes
    if (categorias) {
        const categoriasArray = categorias.split(','); // Convierte a array
        sql += ` AND C.nombre IN (${categoriasArray.map(() => '?').join(',')})`;
        params.push(...categoriasArray);
    }

    sql += " GROUP BY P.id"; // Evitar duplicados en los resultados

    // Ordenar por precio si se especifica
    if (orden) {
        sql += orden === 'asc' ? " ORDER BY P.precio ASC" : " ORDER BY P.precio DESC";
    }

    conexion.query(sql, params, (error, resultado) => {
        if (error) {
            console.error("Error al filtrar productos:", error);
            return res.status(500).json({ error: "Error al obtener productos." });
        }

        res.json({ status: 'ok', productos: resultado });
    });
});

module.exports = router;
