const { db } = require("../config/firebase");

exports.getPrograms = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Usuário não encontrado" });

    const programs = userDoc.data().loyaltyPrograms || {};
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter programas de fidelidade" });
  }
};

exports.addPoints = async (req, res) => {
  const { userId, programId } = req.params;
  const { points } = req.body;

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ error: "Usuário não encontrado" });

    const programs = userDoc.data().loyaltyPrograms || {};
    const currentPoints = programs[programId]?.points || 0;
    programs[programId] = { ...programs[programId], points: currentPoints + points };

    await userRef.update({ loyaltyPrograms: programs });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao adicionar pontos" });
  }
};
