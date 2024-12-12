const jwt = require('jsonwebtoken');
const { conexion } = require('../conexion');

const verificarAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, '234u3i49kkfdsi8732934');
    const usuario = decoded.usuario;
    const query = 'SELECT admin FROM Usuarios WHERE usuario = ?';

    conexion.query(query, [usuario], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error en la base de datos' });
      }

      if (results.length > 0 && results[0].admin === 1) {
        return next();
      } else {
        return res.status(403).json({ message: 'No tienes permisos de administrador' });
      }
    });

  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' });
  }
};

module.exports = verificarAdmin;