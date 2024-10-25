const express = require('express');
const apiRouter = require('./rutas/main');
const app = express();
const port = 8080;

app.use(express.json()); 
app.use('/api', apiRouter); 

app.listen(port, () => {
    console.log(`Ejecutando servidor en el puerto ${port}`);
});
