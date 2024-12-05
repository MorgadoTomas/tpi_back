const express = require('express');
const path = require('path');
const apiRouter = require('./rutas/main');
const cors = require('cors'); 
const app = express();
const port = 4000;

app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());
app.use('/api', apiRouter);
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));


app.listen(port, () => {
    console.log(`Ejecutando servidor en el puerto ${port}`);
});