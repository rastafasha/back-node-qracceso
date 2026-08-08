const { response } = require('express');
const Ubicacion = require('../models/ubicacion');

const getUbicaciones = async (req, res) => {

    try {
        const ubicaciones = await Ubicacion.find()
        .populate('empresaId', 'nombre') // 🔗 Populate para mostrar el nombre de la empresa asociada
        .sort({ bloque_torre: 1 });
        res.json({
            ok: true,
            ubicaciones
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const getUbicacion = async (req, res) => {
    const id = req.params.id;
    try {
        const ubicacion = await Ubicacion.findById(id)
        .populate('empresaId');
        if (!ubicacion) {
            return res.status(404).json({
                ok: false,
                msg: 'Ubicación no encontrada'
            });
        }
        res.json({
            ok: true,
            ubicacion
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};



const crearUbicacion = async (req, res) => {
    const ubicacion = new Ubicacion(req.body);
    try {
        const ubicacionDB = await ubicacion.save();
        res.json({
            ok: true,
            ubicacion: ubicacionDB
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear ubicación'
        });
    }
};

const actualizarUbicacion = async (req, res) => {
    const id = req.params.id;
    try {
        const ubicacion = await Ubicacion.findById(id);
        if (!ubicacion) {
            return res.status(404).json({
                ok: false,
                msg: 'Ubicación no encontrada'
            });
        }

        const campos = req.body;
        const ubicacionActualizada = await Ubicacion.findByIdAndUpdate(id, campos, { new: true });

        res.json({
            ok: true,
            ubicacion: ubicacionActualizada
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar ubicación'
        });
    }
};

const borrarUbicacion = async (req, res) => {
    const id = req.params.id;
    try {
        const ubicacion = await Ubicacion.findById(id);
        if (!ubicacion) {
            return res.status(404).json({
                ok: false,
                msg: 'Ubicación no encontrada'
            });
        }

        await Ubicacion.findByIdAndDelete(id);
        res.json({
            ok: true,
            msg: 'Ubicación eliminada'
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar ubicación'
        });
    }
};

module.exports = {
    getUbicaciones,
    getUbicacion,
    crearUbicacion,
    actualizarUbicacion,
    borrarUbicacion
};