const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  numeroCasa: { type: String, required: true, unique: true }, // Ej: "Maza-A-12" o "Depto-402"
  calleOBloque: { type: String },
  propietarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: false },
  // Vehículos fijos del propietario
  vehiculosPropietario: [{
  placa: { 
    type: String, 
    required: true, 
    uppercase: true, // Convierte "abc-123" a "ABC-123" automáticamente antes de guardar
    trim: true       // Elimina espacios fantasma al inicio o final
  },
  marca: { type: String, required: true, trim: true },
  modelo: { type: String, trim: true },
  color: { type: String, trim: true }
}],
  createdAt: { type: Date, default: Date.now }
});

// Verifica si ya existe en Mongoose; si no, lo compila.
module.exports = mongoose.models.Property || mongoose.model('Property', PropertySchema);

