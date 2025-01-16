const mongoose = require('mongoose');

const lojaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true
  },
  localizacao: {
    type: String,
    required: true
  },
  descricao: String,
  programas: [{
    nome: String,
    progresso: Number,
    maxCarimbos: Number
  }],
  banner: String,
  logo: String,
  horario: String,
  proprietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loja', lojaSchema);
