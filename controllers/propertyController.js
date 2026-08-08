const { response } = require('express');
const Property = require('../models/property');

// 1. OBTENER TODAS LAS PROPIEDADES
const getProperties = async (req, res) => {
    try {
        const properties = await Property.find({})
        .populate('empresaId', 'nombre')
        .populate('propietarioId', 'first_name, last_name')
        .sort({ createdAt: -1 });
        res.json({ ok: true, properties });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al obtener propiedades' });
    }
};

// 2. OBTENER UNA PROPIEDAD POR ID (Actualizado a async/await moderno)
const getProperty = async (req, res) => {
    const id = req.params.id;
    try {
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ ok: false, mensaje: 'La propiedad no existe' });
        }
        res.status(200).json({ ok: true, property });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al buscar propiedad', error: error.message });
    }
};

const getPropertyByUser = async (req, res) => {
  // Capturamos el ID del dueño enviado desde Angular
  const propietarioId = req.params.propietarioId; 

  try {
    // 🌟 CORRECCIÓN: Usamos findOne para buscar por el campo personalizado del esquema
    const property = await Property.findOne({ propietarioId });

    if (!property) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: 'No existe ninguna propiedad asignada a este propietario' 
      });
    }

    res.status(200).json({ 
      ok: true, 
      property 
    });

  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al buscar propiedad', 
      error: error.message 
    });
  }
};


// 3. CREAR PROPIEDAD (Corregido el error de la variable 'token')
const crearProperty = async (req, res = response) => {
    try {
        const property = new Property({ ...req.body });
        await property.save();
        
        res.json({ 
            ok: true, 
            property 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, msg: 'Error inesperado... revisar logs' });
    }
};

// 4. ACTUALIZAR DATOS GENERALES DE LA PROPIEDAD
const actualizarProperty = async (req, res = response) => {
    const uid = req.params.id; // Usualmente viene por params el ID de la propiedad a modificar
    try {
        const propertyDB = await Property.findById(uid);
        if (!propertyDB) {
            return res.status(404).json({ ok: false, msg: 'No existe la propiedad por ese id' });
        }
        
        const propertyActualizado = await Property.findByIdAndUpdate(uid, req.body, { new: true });
        res.json({ ok: true, property: propertyActualizado });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, msg: 'Error inesperado' });
    }
};

// 5. BORRAR PROPIEDAD
const borrarProperty = async (req, res) => {
    const uid = req.params.id;
    try {
        const propertyDB = await Property.findById(uid);
        if (!propertyDB) {
            return res.status(404).json({ ok: false, msg: 'No existe la propiedad por ese id' });
        }
        await Property.findByIdAndDelete(uid);
        res.json({ ok: true, msg: 'Propiedad eliminada' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, msg: 'Error inesperado' });
    }
};

// ==========================================
// 🌟 SUB-ACCIONES PARA EL ARREGLO DE VEHÍCULOS (Para tu pantalla de Perfil)
// ==========================================

// 6. AGREGAR VEHÍCULO AL ARREGLO (Usa $push para no sobreescribir los carros viejos)
const agregarVehiculoPropiedad = async (req, res) => {
    const { id } = req.params; // ID de la Propiedad
    try {
        const propiedadActualizada = await Property.findByIdAndUpdate(
            id,
            { $push: { vehiculosPropietario: req.body } }, // req.body trae { placa, marca, modelo, color }
            { new: true }
        );
        res.json({ ok: true, property: propiedadActualizada });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al agregar vehículo' });
    }
};

// 7. ELIMINAR VEHÍCULO DEL ARREGLO (Usa $pull para remover por su ID de subdocumento)
const eliminarVehiculoPropiedad = async (req, res) => {
    const { id, vehiculoId } = req.params; // ID de la propiedad e ID específico del auto
    try {
        const propiedadActualizada = await Property.findByIdAndUpdate(
            id,
            { $pull: { vehiculosPropietario: { _id: vehiculoId } } },
            { new: true }
        );
        res.json({ ok: true, property: propiedadActualizada });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al eliminar vehículo' });
    }
};

module.exports = {
    getProperties,
    getProperty,
    getPropertyByUser,
    crearProperty,
    actualizarProperty,
    borrarProperty,
    agregarVehiculoPropiedad, // Exportamos los nuevos métodos
    eliminarVehiculoPropiedad
};
