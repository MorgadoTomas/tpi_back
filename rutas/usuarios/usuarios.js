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
                console.error(error);
                reject('Ocurrió un error al insertar el token.');
            } else {
                resolve(token); // Resuelve con el token generado
            }
        });
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

        // Usamos .then() para manejar el resultado de actualizarToken
        actualizarToken(usuario).then(token => {
            res.json({ status: 'ok', userId, token });
        }).catch(error => {
            res.status(500).send(error); // Manejo de error si no se puede generar el token
        });
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

// Ruta para actualizar el rol de administrador de un usuario
router.put('/admin/:userId', verificarAdmin, (req, res) => {
  const userId = req.params.userId;  // Obtén el userId de los parámetros
  const { admin } = req.body;  // Obtén el nuevo rol (admin) del cuerpo de la solicitud

  // Validación de si el valor de admin es 1 (admin) o 0 (no admin)
  if (admin !== 0 && admin !== 1) {
    return res.status(400).json({ message: 'Valor de admin inválido. Debe ser 0 o 1.' });
  }

  // Consulta SQL para actualizar el rol del usuario en la base de datos
  const query = 'UPDATE Usuarios SET admin = ? WHERE id = ?';

  // Ejecutar la consulta
  conexion.query(query, [admin, userId], (error, results) => {
    if (error) {
      console.error('Error al actualizar el rol:', error);
      return res.status(500).json({ message: 'Error al actualizar el rol de usuario' });
    }

    // Verifica si se actualizó algún registro
    if (results.affectedRows > 0) {
      return res.status(200).json({ message: 'Rol actualizado correctamente' });
    } else {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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