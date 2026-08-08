const mongoose = require('mongoose');

const AccessCodeSchema = new mongoose.Schema({
    // El UUID único aleatorio que se codificará dentro del QR
    token: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    
    // 🚀 ACTUALIZADO: Expandimos el enum para alinearlo con tu modelo de usuario (user)
    tipo: { 
        type: String, 
        enum: ['PROPIETARIO', 'ADMIN', 'GUARDIA', 'VISITA', 'EMPLEADO'], 
        required: true 
    },

    // =========================================================================
    // 🔗 ENLACES RELACIONALES DE LA JERARQUÍA (Nieto e Hijo)
    // =========================================================================
    
    // NIETO: El usuario que generó o es dueño del código
    usuarioId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    
    // HIJO: La casa u oficina física a la que le pertenece el acceso (Reemplaza a propiedadId)
    ubicacionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Ubicacion', 
        required: true 
    },

    // =========================================================================
    // 🚀 NUEVO: EL PADRE (Conjunto Residencial / Empresa / País)
    // =========================================================================
    
    // PADRE: Nos permite filtrar los QR de una sola garita a la velocidad del rayo
    empresaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Empresa', 
        required: true 
    },
    
    // PAÍS: Respaldo de filtrado rápido para tu futura expansión internacional
    pais: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Pais', 
        required: true,
    },

    // Datos del vehículo que ingresará (Crucial para el control de guardias)
    datosVehiculo: {
        placa: { type: String }, // Puede ser vacío si entra caminando
        modelo: { type: String },
        color: { type: String }
    },

    // Campos específicos para VISITAS
    nombreVisita: { type: String }, // Nombre del invitado
    idVisita: { type: String },     // Cédula o pasaporte del invitado
    esTemporal: { type: Boolean, default: false },
    validoDesde: { type: Date },
    validoHasta: { type: Date },

    // Control de uso
    usado: { type: Boolean, default: false },
    fechaUso: { type: Date }, // Registro exacto de cuándo se abrió la puerta
    
    // Guardia que validó el ingreso en la puerta (Clave para auditorías de seguridad)
    guardiaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user',
        default: null 
    }
}, { 
    timestamps: true // Te genera automáticamente createdAt y updatedAt de forma nativa
});

// ÍNDICE DE AUTO-BORRADO (TTL) EN MONGODB ATLAS
// Borrará automáticamente los registros viejos 7 días después de su creación.
AccessCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('AccessCode', AccessCodeSchema);
