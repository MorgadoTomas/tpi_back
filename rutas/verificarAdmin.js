const jwt = require('jsonwebtoken');
const secret = '234u3i49kkfdsi8732934';
const { conexion } = require('../conexion');

const verificarAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Solo para depuración, recuerda eliminar esto en producción
    console.log('Datos decodificados del token:', decoded);
    console.log("token es: ", token);

    const usuario = decoded.usuario;  // El nombre de usuario del token
    const query = 'SELECT admin FROM Usuarios WHERE usuario = ?';

    conexion.query(query, [usuario], (error, results) => {
      if (error) {
        console.error('Error en la consulta:', error);
        return res.status(500).json({ message: 'Error en la base de datos' });
      }

      if (results.length > 0) {
        const isAdmin = results[0].admin;
        const ADMIN_ROLE = 1;
        const USER_ROLE = 0;

        if (isAdmin === ADMIN_ROLE) {
          return next(); // Si es admin, pasa al siguiente middleware
        } else {
          return res.status(403).json({ message: 'No tienes permisos de administrador' });
        }
      } else {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
    });

  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(401).json({ message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' });
  }
};

module.exports = verificarAdmin;