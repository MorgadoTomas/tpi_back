const router = require('express').Router();
const { conexion } = require('../../conexion');
const bcrypt = require('bcrypt');
const veceshash = 10;


router.post('/registrar', function (req, res) {
    const { nombre, apellido, password, mail, usuario } = req.body;
    const sql = 'INSERT INTO Usuarios (nombre, apellido, contrasena, mail, usuario) VALUES (?,?,?,?,?)';

    const hash = bcrypt.hashSync(password, veceshash,);

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
    const sql = 'SELECT contrasena FROM Usuarios WHERE usuario = ?'; 
    conexion.query(sql, [usuario], function (error, results) { 
        if (error) {
            console.log(error); 
            return res.status(500).send('Ocurrió un error'); 
        }
        if (results.length === 0) { 
            return res.status(401).send('Usuario no encontrado');
        }

        const hashedPassword = results[0].contrasena;


        if (bcrypt.compareSync(password, hashedPassword)) {

            res.json({ status: 'ok', message: 'Inicio de sesión exitoso' });
        } else {

            res.status(401).send('Contraseña incorrecta');
        }
    });
});


module.exports = router;
