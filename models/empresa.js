const EmpresaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    rif_nit: { type: String, required: true },
    pais: { type: String, required: true, default: 'VE' }, // 🚀 Filtro internacional rápido
    telefono: String,
    status: { type: String, enum: ['ACTIVO', 'SUSPENDIDO'], default: 'ACTIVO' }
}, { timestamps: true });
