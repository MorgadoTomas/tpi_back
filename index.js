const express = require(express);
const apiRouter = require('./rutas/main')
const app = express();
const port = 8080;

app.use ('./usuarios', apiRouter)
app.use(express.json())

app.listen(port, () => {
    console.log(`Ejecutando servidor ${port}`);
})