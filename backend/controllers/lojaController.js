const Loja = require('../models/Loja');

exports.criarLoja = async (req, res) => {
  try {
    const loja = new Loja({
      ...req.body,
      proprietario: req.user._id
    });
    await loja.save();
    res.status(201).json(loja);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.buscarLojas = async (req, res) => {
  try {
    const lojas = await Loja.find();
    res.json(lojas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.buscarLojaPorId = async (req, res) => {
  try {
    const loja = await Loja.findById(req.params.id);
    if (!loja) {
      return res.status(404).json({ message: 'Loja não encontrada' });
    }
    res.json(loja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.atualizarProgresso = async (req, res) => {
  try {
    const { lojaId, programaId, novoProgresso } = req.body;
    const loja = await Loja.findById(lojaId);
    
    if (!loja) {
      return res.status(404).json({ message: 'Loja não encontrada' });
    }

    const programa = loja.programas.id(programaId);
    if (!programa) {
      return res.status(404).json({ message: 'Programa não encontrado' });
    }

    programa.progresso = novoProgresso;
    await loja.save();
    
    res.json(programa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
