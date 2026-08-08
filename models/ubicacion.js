const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const UbicacionSchema = new mongoose.Schema({
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: false }, // 🔗 Vinculo al Padre
    bloque_torre: { type: String, required: true }, // Ej: "Torre B", "Galpón 3"
    numero_identificador: { type: String, required: true }, // Ej: "Apto 12-C", "Oficina 4"
}, { timestamps: true });

module.exports = mongoose.model('Ubicacion', UbicacionSchema);
