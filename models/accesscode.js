const mongoose = require('mongoose');

const AccessCodeSchema = new mongoose.Schema({
  // El UUID único aleatorio que se codificará dentro del QR
  token: { type: String, required: true, unique: true, index: true }, 
  
  tipo: { type: String, enum: ['PROPIETARIO', 'VISITA'], required: true },
  
  // Relaciones
  propietarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  propiedadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

  // Datos del vehículo que ingresará (Crucial para el control de guardias)
  datosVehiculo: {
    placa: { type: String }, // Puede ser vacío si entra caminando
    modelo: String,
    color: String
  },

  // Campos específicos para VISITAS
  nombreVisita: { type: String }, // Nombre del invitado
  idVisita: { type: String }, // ID único para la visita
  esTemporal: { type: Boolean, default: false },
  validoDesde: { type: Date },
  validoHasta: { type: Date },
  
  // Control de uso
  usado: { type: Boolean, default: false }, 
  fechaUso: { type: Date }, // Registro exacto de cuándo se abrió la puerta

  createdAt: { type: Date, default: Date.now }
});

// ÍNDICE DE AUTO-BORRADO (TTL) EN MONGODB ATLAS
// Para no saturar tu base de datos Atlas gratis, este índice borrará 
// automáticamente los QR de visitas pasadas 7 días después de su creación.
AccessCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('AccessCode', AccessCodeSchema);
