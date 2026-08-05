/*
 Ruta: /api/property
 */

const { Router } = require('express');
const router = Router();
const {
    getProperties,
    getProperty,
    crearProperty,
    actualizarProperty,
    borrarProperty,
    agregarVehiculoPropiedad, // Exportamos los nuevos métodos
    eliminarVehiculoPropiedad,
    getPropertyByUser

} = require('../controllers/propertyController');
const { validarJWT} = require('../middlewares/validar-jwt');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

router.get('/', getProperties);

router.post('/crear', [validarJWT,validarCampos], crearProperty);

router.put('/addv/:id', agregarVehiculoPropiedad);

router.put('/update/:id', [ validarJWT,validarCampos], actualizarProperty);

router.delete('/borrar/:id', validarJWT, borrarProperty);
router.delete('/borrarv/:id/vehiculo/:vehiculoId', eliminarVehiculoPropiedad);

router.get('/:id', getProperty);
router.get('/user/:propietarioId', getPropertyByUser);

module.exports = router;