/*
 Ruta: /api/empresa
 */

const { Router } = require('express');
const router = Router();
const {
    getEmpresas,
    getEmpresa,
    crearEmpresa,
    actualizarEmpresa,
    borrarEmpresa
} = require('../controllers/empresaController');

const { validarJWT } = require('../middlewares/validar-jwt');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

router.get('/', getEmpresas);
router.get('/:id', getEmpresa);

router.post('/', [ validarCampos], crearEmpresa);

router.put('/:id', [ validarCampos], actualizarEmpresa);

router.delete('/:id', validarJWT, borrarEmpresa);

module.exports = router;

