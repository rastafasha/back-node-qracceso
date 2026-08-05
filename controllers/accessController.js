const AccessCode = require('../models/accesscode');
const Property = require('../models/property');
const crypto = require('crypto');

// 1. GENERAR UN QR PARA UNA VISITA (Llamado desde la App Ionic del Propietario)
const generarQrVisita = async (req, res) => {
  try {
    const {
      propietarioId,
      propiedadId,
      nombreVisita,
      idVisita,
      placa,
      modelo,
      color,
      validoDesde,
      validoHasta
    } = req.body;

    // Generar un token único, aleatorio y seguro de 32 caracteres hexadecimales
    const tokenSeguro = crypto.randomBytes(16).toString('hex');

    const nuevoAcceso = new AccessCode({
      token: tokenSeguro,
      tipo: 'VISITA',
      propietarioId,
      propiedadId,
      datosVehiculo: { placa, modelo, color },
      nombreVisita,
      idVisita,
      esTemporal: true,
      validoDesde: new Date(validoDesde),
      validoHasta: new Date(validoHasta),
      usado: false
    });

    await nuevoAcceso.save();

    // Retornamos el token al frontend. Angular/Ionic lo convertirá en imagen QR.
    return res.status(201).json({
      success: true,
      mensaje: 'Acceso de visita creado con éxito',
      token: tokenSeguro
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. VERIFICAR EL QR (Llamado desde el Lector Físico / Dispositivo de la Puerta)
const verificarQrPuerta = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ abrir: false, mensaje: 'Token no proporcionado' });
    }

    // Buscamos el token y traemos (populate) los datos del dueño y la casa
    const acceso = await AccessCode.findOne({ token })
      .populate('propietarioId', 'nombre apellido telefono')
      .populate('propiedadId', 'numeroCasa calleOBloque');

    // Validación 1: ¿El token existe en la base de datos?
    if (!acceso) {
      return res.status(404).json({ abrir: false, mensaje: 'Código QR no registrado o inválido' });
    }

    // Validación 2: Si es visita, ¿ya fue utilizado previamente?
    if (acceso.tipo === 'VISITA' && acceso.usado) {
      return res.status(401).json({ abrir: false, mensaje: 'Este pase de visita ya fue utilizado' });
    }

    // Validación 3: ¿Está dentro del rango de fecha y hora permitido?
    if (acceso.esTemporal) {
      const ahora = new Date();
      if (ahora < acceso.validoDesde || ahora > acceso.validoHasta) {
        return res.status(401).json({ abrir: false, mensaje: 'Código QR expirado o fuera de horario' });
      }
    }

    // ACCIÓN: Si todo está en orden y es visita, quemamos el token para que no se use de nuevo
    if (acceso.tipo === 'VISITA') {
      acceso.usado = true;
      acceso.fechaUso = new Date();
      await acceso.save();
    }
    // Determinar correctamente el nombre a mostrar en el registro
    let nombreVisitante = 'Propietario';
    if (acceso.tipo === 'VISITA') {
      nombreVisitante = acceso.nombreVisita || 'Visita Anónima';
    }

    // Respuesta exitosa. El hardware leerá "abrir: true" y mandará el pulso al relé.
    return res.status(200).json({
      abrir: true,
      mensaje: 'Acceso Concedido',
      infoAcceso: {
        tipo: acceso.tipo,
        visitante: nombreVisitante,
        idVisita: acceso.idVisita || null, // 👈 Enviamos el ID limpio para Angular
        casa: acceso.propiedadId?.numeroCasa || 'N/A',
        residente: acceso.propietarioId ? `${acceso.propietarioId.nombre} ${acceso.propietarioId.apellido}` : 'N/A',
        vehiculo: acceso.datosVehiculo || 'N/A'
      }
    });

  } catch (error) {
    return res.status(500).json({ abrir: false, error: error.message });
  }
};


const getVisitasPorPropietario = async (req, res) => {
  try {
    // Capturamos el ID del dueño que viaja por la URL
    const { propietarioId } = req.params;

    // Buscamos solo los documentos tipo 'VISITA' asociados a este dueño
    // .sort({ createdAt: -1 }) ordena de la más nueva a la más antigua
    const visitas = await AccessCode.find({
      propietarioId,
      tipo: 'VISITA'
    }).sort({ createdAt: -1 });

    // Respondemos con el formato exacto { ok: true, visitas: [...] } que espera tu Angular
    return res.status(200).json({
      ok: true,
      visitas
    });

  } catch (error) {
    console.error('Error al obtener visitas:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno en el servidor al consultar las visitas.'
    });
  }
};

const getBitacoraHoy = async (req, res) => {
  try {
    // 1. Calcular el rango de tiempo de "hoy" (de 00:00:00 a 23:59:59)
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    // 2. Buscar en MongoDB Atlas los QR que fueron escaneados hoy
    const accesos = await AccessCode.find({
      usado: true,
      fechaUso: { $gte: inicioHoy, $lte: finHoy }
    })
      .populate('propietarioId', 'nombre apellido')
      .populate('propiedadId', 'numeroCasa')
      .sort({ fechaUso: -1 });

    // 3. Calcular estadísticas numéricas básicas
    const contadorPropietarios = accesos.filter(a => a.tipo === 'PROPIETARIO').length;
    const contadorVisitas = accesos.filter(a => a.tipo === 'VISITA').length;

    // 4. Formatear la respuesta limpia para Angular
    const historialFormateado = accesos.map(a => {
      // Determinar el nombre del visitante o propietario
      let nombreMostrar = 'N/A';
      if (a.tipo === 'VISITA') {
        nombreMostrar = a.nombreVisita || 'Visita Anónima';
      } else if (a.tipo === 'PROPIETARIO' && a.propietarioId) {
        nombreMostrar = `${a.propietarioId.nombre} ${a.propietarioId.apellido}`;
      }

      return {
        tipo: a.tipo,
        casa: a.propiedadId?.numeroCasa || 'N/A',
        visitante: nombreMostrar,
        idVisita: a.idVisita || null, // 👈 Enviamos el ID por separado de forma limpia
        vehiculo: a.datosVehiculo || 'N/A',
        fechaUso: a.fechaUso
      };
    });

    return res.status(200).json({
      ok: true,
      contadorPropietarios,
      contadorVisitas,
      accesos: historialFormateado
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: 'Error al compilar bitácora diaria' });
  }
};




module.exports = {
  getVisitasPorPropietario,
  generarQrVisita,
  verificarQrPuerta,
  getBitacoraHoy,
};
