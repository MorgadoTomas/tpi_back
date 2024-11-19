const express = require('express');
const path = require('path');
const apiRouter = require('./rutas/main');
const cors = require('cors'); // Importar cors
const app = express();
const port = 8080;

app.use(cors({ origin: 'http://localhost:5173' })); // Permitir solicitudes desde el frontend en localhost
app.use(express.json());
app.use('/api', apiRouter);
app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Ejecutando servidor en el puerto ${port}`);
});