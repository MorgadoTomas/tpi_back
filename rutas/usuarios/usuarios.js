const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { conexion } = require('../../conexion');
const bcrypt = require('bcrypt');
const secret = '234u3i49kkfdsi8732934'; // Considera mover esto a un archivo de configuración
const veceshash = 10;
const verificarAdmin = require('../verificarAdmin'); // Middleware para verificar si el usuario es admin

function actualizarToken(usuario) {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({ usuario }, secret, { expiresIn: '8h' });
        const sql = 'INSERT INTO Usuarios (usuario, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token)';
        
        conexion.query(sql, [usuario, token], function(error) {
            if (error) {
                reject('Ocurrió un error al insertar el token.');
            } else {
                resolve(token); // Resuelve con el token generado
            }
        });
    });
}

router.post('/registrar', (req, res) => {
    const { nombre, apellido, password, mail, usuario } = req.body;
    const hash = bcrypt.hashSync(password, veceshash);
    const sql = 'INSERT INTO Usuarios (nombre, apellido, contrasena, mail, usuario) VALUES (?,?,?,?,?)';

    conexion.query(sql, [nombre, apellido, hash, mail, usuario], (error, result) => {
        if (error) {
            return res.send('Ocurrió un error');
        }
        actualizarToken(usuario)
            .then(token => res.json({ status: 'ok', userId: result.insertId, token }))
            .catch(() => res.status(500).send('Error al generar el token'));
    });
});

router.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    const sql = 'SELECT contrasena, admin, nombre FROM Usuarios WHERE usuario = ?';

    conexion.query(sql, [usuario], (error, results) => {
        if (error) {
            return res.status(500).send('Ocurrió un error');
        }
        if (results.length === 0) {
            return res.status(401).send('Usuario no encontrado');
        }

        const { contrasena: hashedPassword, admin, nombre: nombreUsuario } = results[0];

        if (bcrypt.compareSync(password, hashedPassword)) {
            const token = jwt.sign({ usuario }, secret, { expiresIn: '8h' });
            res.json({ status: 'ok', token, adminVerificacion: admin, usuario: nombreUsuario });
        } else {
            res.status(401).send('Contraseña incorrecta');
        }
    });
});

router.put('/admin/:userId', verificarAdmin, (req, res) => {
    const userId = req.params.userId;
    const { admin } = req.body;

    if (![0, 1].includes(admin)) {
        return res.status(400).json({ message: 'Valor de admin inválido. Debe ser 0 o 1.' });
    }

    const query = 'UPDATE Usuarios SET admin = ? WHERE id = ?';
    conexion.query(query, [admin, userId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error al actualizar el rol de usuario' });
        }
        res.status(results.affectedRows > 0 ? 200 : 404).json({
            message: results.affectedRows > 0 ? 'Rol actualizado correctamente' : 'Usuario no encontrado'
        });
    });
});

router.get('/usuarios', verificarAdmin, (req, res) => {
    const sql = 'SELECT id, nombre, apellido, admin, mail, usuario FROM Usuarios';
    conexion.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send('Ocurrió un error');
        }
        res.json({ usuarios: results });
    });
});

router.delete('/usuarios/:id', verificarAdmin, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Usuarios WHERE id = ?';
    conexion.query(sql, [id], (error) => {
        if (error) {
            return res.status(500).send('Ocurrió un error al eliminar el usuario');
        }
        res.json({ status: 'Usuario eliminado' });
    });
});

module.exports = router;