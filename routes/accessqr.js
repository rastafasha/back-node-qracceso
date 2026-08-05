/*
 Ruta: /api/accessqr
 */

const { Router } = require('express');
const router = Router();
const {
     getVisitasPorPropietario,
  generarQrVisita,
  verificarQrPuerta,
  getBitacoraHoy

} = require('../controllers/accessController');
const { validarJWT} = require('../middlewares/validar-jwt');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

router.get('/visitas_propietario/:propietarioId', getVisitasPorPropietario);
router.get('/bitacora-hoy', getBitacoraHoy);

// Endpoint para que el propietario genere la visita desde su celular
router.post('/generar-visita', generarQrVisita);

// Endpoint para que el lector de la puerta mande el token escaneado y verifique
router.post('/verificar-puerta', verificarQrPuerta);

module.exports = router;



