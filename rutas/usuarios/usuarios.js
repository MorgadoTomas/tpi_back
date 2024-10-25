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



// router.post('/login', function (req, res) {
//     const { usuario, password } = req.body; // Desestructuración para obtener usuario y contraseña del cuerpo de la solicitud
//     const sql = 'SELECT contrasena FROM Usuarios WHERE usuario = ?'; // Consulta SQL para obtener la contraseña del usuario

//     conexion.query(sql, [usuario], function (error, results) { // Ejecuta la consulta
//         if (error) { // Manejo de errores
//             console.log(error); // Imprime el error en la consola
//             return res.status(500).send('Ocurrió un error'); // Responde con un error 500
//         }
//         if (results.length === 0) { // Si no se encuentra el usuario
//             return res.status(401).send('Usuario no encontrado'); 
//         }

//         const hashedPassword = results[0].contrasena; 

        
//         if (bcrypt.compareSync(password, hashedPassword)) { 
            
//             res.json({ status: 'ok', message: 'Inicio de sesión exitoso' }); 
//         } else {
            
//             res.status(401).send('Contraseña incorrecta'); 
//         }
//     });
// });


module.exports = router;
