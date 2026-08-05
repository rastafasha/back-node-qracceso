const fs = require('fs');
const Usuario = require('../models/usuario');

// 🛠️ SE AGREGA 'campoDestino' como parámetro opcional al final
const actualizarImagen = async (tipo, id, nombreArchivo, campoDestino = null) => {

    let pathViejo = '';

    switch (tipo) {

        case 'usuarios':
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                console.log('No es un usuario por id');
                return false;
            }
            pathViejo = `./uploads/usuarios/${usuario.img}`;
            borrarImagen(pathViejo);
            usuario.img = nombreArchivo;
            await usuario.save();
            return true;
            break;

    }
};

const borrarImagen = (path) => {
    if (fs.existsSync(path)) {
        // borrar la imagen anterior si usas almacenamiento local
        fs.unlinkSync(path);
    }
}
module.exports = {
    actualizarImagen,
    borrarImagen
};
