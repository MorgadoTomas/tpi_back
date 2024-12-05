const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { conexion } = require('../../conexion');
const bcrypt = require('bcrypt');
const secret = '234u3i49kkfdsi8732934';
const veceshash = 10;


function generateToken(username) {
    const token = jwt.sign({ username }, secret, {
        expiresIn: '8h'
    });
    return token
}


router.post('/registrar', function (req, res) {
    const { nombre, apellido, password, mail, usuario } = req.body;
    const sql = 'INSERT INTO Usuarios (nombre, apellido, contrasena, mail, usuario) VALUES (?,?,?,?,?)';

    const hash = bcrypt.hashSync(password, veceshash);

    conexion.query(sql, [nombre, apellido, hash, mail, usuario], function (error, result) {
        if (error) {
            console.log(error);
            return res.send('ocurrio un error')
        }
        res.json({ status: 'ok' });

    })
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
        const nombreUsuario = results[0].nombre;  // Obtener el nombre del usuario
        
        if (bcrypt.compareSync(password, hashedPassword)) {
            const token = generateToken(usuario);
            if (!token) {
                console.log("Existe un token");
            }

            // Devolver el token, la verificación de admin, y el nombre del usuario
            res.json({ status: 'ok', token, adminVerificacion, usuario: nombreUsuario });
        } else {
            res.status(401).send('Contraseña incorrecta');
        }

    });
});

// Obtener todos los usuarios
router.get('/usuarios', function (req, res) {
    const sql = 'SELECT id, nombre, email FROM Usuarios';
    conexion.query(sql, function (error, results) {
      if (error) {
        console.log(error);
        return res.status(500).send('Ocurrió un error');
      }
      res.json({ usuarios: results });
    });
  });
  
  
module.exports = router;