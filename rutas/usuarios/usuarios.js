const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { conexion } = require('../../conexion');
const bcrypt = require('bcrypt');
const secret = '234u3i49kkfdsi8732934';
const veceshash = 10;
const verificarAdmin = require('../verificarAdmin');

function actualizarToken(usuario, res) {
    const token = jwt.sign({ usuario }, secret, { expiresIn: '8h' });
    const sql = 'INSERT INTO Usuarios (usuario, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token)';
    conexion.query(sql, [usuario, token], function(error) {
        if (error) {
            console.error(error);
            return res.send('Ocurrió un error al insertar el token.');
        }
        res.send({ token }); 
    });
}

router.post('/registrar', function (req, res) {
    const { nombre, apellido, password, mail, usuario } = req.body;
    const sql = 'INSERT INTO Usuarios (nombre, apellido, contrasena, mail, usuario) VALUES (?,?,?,?,?)';
    const hash = bcrypt.hashSync(password, veceshash);

    conexion.query(sql, [nombre, apellido, hash, mail, usuario], function (error, result) {
        if (error) {
            console.log(error);
            return res.send('Ocurrió un error');
        }
        const userId = result.insertId;
        const token = actualizarToken(usuario);

        res.json({ status: 'ok', userId, token });
    });
});

router.post('/login', function (req, res) {
    const { usuario, password } = req.body;
    const sql = 'SELECT contrasena, admin, nombre FROM Usuarios WHERE usuario = ?';
    conexion.query(sql, [usuario], function (error, results) {
        if (error) {
            console.log(error);
            return res.status(500).send('Ocurrió un error');
        }
        if (results.length === 0) {
            return res.status(401).send('Usuario no encontrado');
        }

        const hashedPassword = results[0].contrasena;
        const adminVerificacion = results[0].admin;
        const nombreUsuario = results[0].nombre;

        if (bcrypt.compareSync(password, hashedPassword)) {
            const token = jwt.sign({ usuario }, secret, { expiresIn: '8h' });
            res.json({ status: 'ok', token, adminVerificacion, usuario: nombreUsuario });
        } else {
            res.status(401).send('Contraseña incorrecta');
        }
    });
});

router.get('/usuarios', verificarAdmin, function (req, res) {
    const sql = 'SELECT id, nombre, apellido, admin, mail, usuario FROM Usuarios';
    conexion.query(sql, function (error, results) {
        if (error) {
            console.log(error);
            return res.status(500).send('Ocurrió un error');
        }
        res.json({ usuarios: results });
    });
});

router.delete('/usuarios/:id', verificarAdmin, function (req, res) {
    const { id } = req.params;
    const sql = 'DELETE FROM Usuarios WHERE id = ?';
    conexion.query(sql, [id], function (error, result) {
        if (error) {
            console.log(error);
            return res.status(500).send('Ocurrió un error al eliminar el usuario');
        }
        res.json({ status: 'Usuario eliminado' });
    });
});

module.exports = router;