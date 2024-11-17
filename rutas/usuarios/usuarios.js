const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { conexion } = require('../../conexion');
const bcrypt = require('bcrypt');
const secret = 'ElQueLeeLeGustaLaJapi';
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
    const sql = 'SELECT contrasena, admin FROM Usuarios WHERE usuario = ?';
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
        


        if (bcrypt.compareSync(password, hashedPassword)) {
            const token = generateToken(usuario)
            if (!token) {
                console.log("Existe un token")
            }

            res.json({ status: 'ok', token, adminVerificacion });
        } else {

            res.status(401).send('Contraseña incorrecta');
        }

    });
});


module.exports = router;
