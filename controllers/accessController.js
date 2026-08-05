const AccessCode = require('../models/accesscode');
const Property = require('../models/property');
const Usuario = require('../models/usuario');
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
        let { token } = req.body;
        if (!token) {
            return res.status(400).json({ abrir: false, mensaje: 'Token no proporcionado' });
        }

        // 1. LIMPIEZA INICIAL: Quitamos cualquier espacio o salto de línea al inicio/final del QR
        token = token.trim();

        console.log('====================================');
        console.log('👉 REQV_TOKEN LIMPIO:', token);
        console.log('====================================');

        let acceso = null;
        let idUsuario = null;
        let codigoVehiculo = null;

        // 2. DETECTAR EL SEPARADOR DINÁMICAMENTE
        let separador = null;
        if (token.includes('|')) separador = '|';
        else if (token.includes('-')) separador = '-';
        else if (token.includes(':')) separador = ':';
        else if (token.includes('_')) separador = '_';

        if (separador) {
            const partes = token.split(separador);
            // Aplicamos .trim() a cada parte para limpiar espacios ocultos
            idUsuario = partes[0].trim();
            codigoVehiculo = partes[1] ? partes[1].trim() : null;
            
            console.log(`✅ Formato Propietario Detectado. ID: "${idUsuario}", Vehículo: "${codigoVehiculo}"`);
        } else if (token.length === 24) {
            idUsuario = token;
            console.log(`✅ Formato Propietario Directo (Solo UID) Detectado: "${idUsuario}"`);
        }

        // 3. PROCESAR ACCESO SI ES PROPIETARIO
        if (idUsuario && idUsuario.length === 24) {
            try {
                const mongoose = require('mongoose');
                let usuario = null;

                // Intento A: Búsqueda estándar por ID
                const objectIdFormateado = new mongoose.Types.ObjectId(idUsuario);
                usuario = await Usuario.findById(objectIdFormateado);
                
                // 🕵️‍♂️ PLAN B DE EMERGENCIA: Si no lo encuentra por ID, lo rastreamos por email de prueba
                // Reemplaza este correo por el correo real de Malcolm en tu BD para auditar el ID
                if (!usuario) {
                    console.log(`⚠️ ID no encontrado. Iniciando rastreo de auditoría por Email...`);
                    usuario = await Usuario.findOne({ email: 'mercadocreativo@gmail.com' });
                    
                    if (usuario) {
                        console.log('====================================================');
                        console.log('🔥 ¡AUDITORÍA DE BASE DE DATOS TRAS CORREO ENCONTRADO! 🔥');
                        console.log(`El ID real guardado en MongoDB es: "${usuario._id}"`);
                        console.log(`El ID que tu QR está enviando es:  "${idUsuario}"`);
                        console.log('====================================================');
                    }
                }

                if (usuario) {
                    // Usamos el ID real que sí funcionó en la base de datos
                    const propiedad = await Propiedad.findOne({ propietarioId: usuario._id });
                    const esVehicular = (codigoVehiculo && codigoVehiculo.toUpperCase() !== 'PEATONAL');

                    acceso = {
                        tipo: 'PROPIETARIO',
                        propietarioId: usuario,
                        propiedadId: propiedad || { numeroCasa: 'N/A' },
                        esTemporal: false,
                        tipoAcceso: esVehicular ? 'VEHICULAR' : 'PEATONAL',
                        datosVehiculo: esVehicular ? `Placa/Código: ${codigoVehiculo}` : 'N/A'
                    };
                    console.log('🎉 ¡Usuario Encontrado con éxito en el sistema!');
                } else {
                    console.log(`❌ El ID "${idUsuario}" y el correo de prueba no existen en esta Base de Datos.`);
                }
            } catch (err) {
                console.log('❌ Error en el bloque de auditoría de Propietario:', err.message);
            }
        }
        
        // 3. REGLA PARA VISITAS: Si no se procesó como propietario, buscamos en pases comunes
        if (!acceso) {
            console.log('🔍 Buscando en la colección de Visitas (AccessCode)...');
            acceso = await AccessCode.findOne({ token })
                .populate({
                    path: 'propietarioId',
                    model: 'Usuario', 
                    select: 'nombre apellido first_name last_name telefono'
                })
                .populate('propiedadId', 'numeroCasa calleOBloque');
        }

        // VALIDACIÓN DE SEGURIDAD
        if (!acceso) {
            return res.status(404).json({ abrir: false, mensaje: 'Código QR no registrado o inválido' });
        }

        // VALIDACIÓN: Si es visita y ya se usó
        if (acceso.tipo === 'VISITA' && acceso.usado) {
            return res.status(401).json({ abrir: false, mensaje: 'Este pase de visita ya fue utilizado' });
        }

        // VALIDACIÓN: Horario de vencimiento para temporales
        if (acceso.esTemporal) {
            const ahora = new Date();
            if (ahora < acceso.validoDesde || ahora > acceso.validoHasta) {
                return res.status(401).json({ abrir: false, mensaje: 'Código QR expirado o fuera de horario' });
            }
        }

        // ACCIÓN: Registrar uso si es visita
        if (acceso.tipo === 'VISITA') {
            acceso.usado = true;
            acceso.fechaUso = new Date();
            await acceso.save();
        }

        // Determinar nombres de forma segura
        const stringNombre = acceso.propietarioId 
            ? `${acceso.propietarioId.nombre || acceso.propietarioId.first_name || ''} ${acceso.propietarioId.apellido || acceso.propietarioId.last_name || ''}`.trim()
            : 'N/A';

        // Respuesta limpia para el lector y la pantalla de la garita
        return res.status(200).json({ 
            abrir: true, 
            mensaje: 'Acceso Concedido', 
            infoAcceso: { 
                tipo: acceso.tipo, 
                tipoAcceso: acceso.tipoAcceso || 'VEHICULAR', 
                visitante: acceso.tipo === 'PROPIETARIO' ? 'Propietario' : (acceso.nombreVisita || 'Visita'),
                casa: acceso.propiedadId?.numeroCasa || 'N/A',
                residente: stringNombre,
                vehiculo: acceso.datosVehiculo || 'N/A'
            } 
        });

    } catch (error) {
        console.error('Error crítico en puerta:', error);
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
