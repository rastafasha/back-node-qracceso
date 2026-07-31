const { Schema, model } = require('mongoose');

const UsuarioSchema = Schema({
    first_name: { type: String, require: true },
    last_name: { type: String, require: true },
    numdoc: { type: String, require: false, unique: true, sparse: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    telefono: { type: String, require: true  },
    role: { type: String, enum: ['PROPIETARIO', 'ADMIN', 'GUARDIA', 'VISITA'], default: 'PROPIETARIO' },
    activo: { type: Boolean, default: true },
    img: { type: String, },
});

UsuarioSchema.method('toJSON', function() { // modificar el _id a uid, esconde el password
    const { __v, _id, password, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('user', UsuarioSchema);