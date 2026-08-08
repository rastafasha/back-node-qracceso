/*
 Ruta: /api/ubicacion
 */

const { Router } = require('express');
const router = Router();
const {
    getUbicaciones,
    getUbicacion,
    crearUbicacion,
    actualizarUbicacion,
    borrarUbicacion
} = require('../controllers/ubicacionController');

const { validarJWT } = require('../middlewares/validar-jwt');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

router.get('/', getUbicaciones);
router.get('/:id', getUbicacion);

router.post('/', [ validarCampos], crearUbicacion);

router.put('/:id', [ validarCampos], actualizarUbicacion);

router.delete('/:id', validarJWT, borrarUbicacion);

module.exports = router;

