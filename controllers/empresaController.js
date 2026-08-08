const { response } = require('express');
const Empresa = require('../models/empresa');

const getEmpresas = async (req, res) => {

    try {
        const empresas = await Empresa.find()
        .populate('pais', 'code')
        .sort({ nombre: 1 });
        res.json({
            ok: true,
            empresas
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const getEmpresa = async (req, res) => {
    const id = req.params.id;
    try {
        const empresa = await Empresa.findById(id)
        .populate('pais', 'code');
        if (!empresa) {
            return res.status(404).json({
                ok: false,
                msg: 'Empresa no encontrada'
            });
        }
        res.json({
            ok: true,
            empresa
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};



const crearEmpresa = async (req, res) => {
    const empresa = new Empresa(req.body);
    try {
        const empresaDB = await empresa.save();
        res.json({
            ok: true,
            empresa: empresaDB
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear ubicación'
        });
    }
};

const actualizarEmpresa = async (req, res) => {
    const id = req.params.id;
    try {
        const empresa = await Empresa.findById(id);
        if (!empresa) {
            return res.status(404).json({
                ok: false,
                msg: 'Empresa no encontrada'
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

const borrarEmpresa = async (req, res) => {
    const id = req.params.id;
    try {
        const empresa = await Empresa.findById(id);
        if (!empresa) {
            return res.status(404).json({
                ok: false,
                msg: 'Empresa no encontrada'
            });
        }

        await Empresa.findByIdAndDelete(id);
        res.json({
            ok: true,
            msg: 'Empresa eliminada'
        });
    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar empresa'
        });
    }
};

module.exports = {
    getEmpresas,
    getEmpresa,
    crearEmpresa,
    actualizarEmpresa,
    borrarEmpresa
};