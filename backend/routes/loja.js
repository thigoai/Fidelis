const express = require('express');
const router = express.Router();
const lojaController = require('../controllers/lojaController');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware, lojaController.criarLoja);
router.get('/', lojaController.buscarLojas);
router.get('/:id', lojaController.buscarLojaPorId);
router.patch('/progresso', authMiddleware, lojaController.atualizarProgresso);

module.exports = router;
