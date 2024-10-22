const mysql = require('mysql');

const conexion = mysql.createConnection({
    host: "ctpoba.edu.ar",
    user: "morgadot",
    password: "46334370",
    database: "24_72_C"
});

conexion.connect(function(error){
    if (error) {
        console.error(error);
        return;
    }
    console.log("Conectado exitosamente a la base de datos");
})
module.exports = { conexion }