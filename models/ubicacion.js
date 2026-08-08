const UbicacionSchema = new mongoose.Schema({
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true }, // 🔗 Vinculo al Padre
    bloque_torre: { type: String, required: true }, // Ej: "Torre B", "Galpón 3"
    numero_identificador: { type: String, required: true }, // Ej: "Apto 12-C", "Oficina 4"
    status_morosidad: { type: Boolean, default: false } // 🛡️ Bloqueo automático de QR si no pagan el condominio
}, { timestamps: true });
