const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    rif_nit: { type: String, required: true },
    pais: { type: Schema.Types.ObjectId, ref: "pais" },
    telefono: { type: String, require: true  },
    direccion: { type: String, require: true  },
    tipo: { type: String, enum: ['EMPRESA', 'RESIDENCIAL'] },
    status: { type: String, enum: ['ACTIVO', 'SUSPENDIDO'], default: 'ACTIVO' }
}, { timestamps: true });

module.exports = mongoose.model('Empresa', EmpresaSchema);
