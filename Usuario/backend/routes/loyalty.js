const express = require("express");
const router = express.Router();
const { addPoints, getPrograms } = require("../controllers/loyaltyController");

// Obter programas de fidelidade
router.get("/:userId", getPrograms);

// Adicionar pontos a um programa de fidelidade
router.post("/:userId/:programId", addPoints);

module.exports = router;
