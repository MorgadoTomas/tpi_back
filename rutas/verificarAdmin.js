const jwt = require('jsonwebtoken'); 
const secret = '234u3i49kkfdsi8732934';
const { conexion } = require('../conexion');

const verificarAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('Token recibido:', token);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log('Token decodificado:', decoded);
    
    const usuario = decoded.usuario;
    const query = 'SELECT admin FROM Usuarios WHERE usuario = ?';
    console.log('Usuario que se verifica:', usuario);

    conexion.query(query, [usuario], (error, results) => {
      if (error) {
        console.error('Error en la consulta:', error);
        return res.status(500).json({ message: 'Error en la base de datos' });
      }

      if (results.length > 0) {
        const isAdmin = results[0].admin;

   
        if (isAdmin === 1) {
          return next(); 
        } else {
          return res.status(403).json({ message: 'No tienes permisos de administrador' });
        }
      } else {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
    });
    
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(401).json({ message: 'Token no válido' });
  }
};

module.exports = verificarAdmin;