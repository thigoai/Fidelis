const API_URL = "http://localhost:3000"; // Altere para a URL do backend

// Função para buscar os programas de fidelidade de um usuário
export async function getPrograms(userId) {
  try {
    const response = await fetch(`${API_URL}/programs?userId=${userId}`);
    if (!response.ok) {
      console.error("Erro ao buscar programas:", response.statusText);
      return {};
    }
    return await response.json(); // Retorna o JSON com os programas
  } catch (error) {
    console.error("Erro de conexão:", error);
    return {};
  }
}

// Função para adicionar pontos a um programa
export async function addPoints(userId, programId, points) {
  try {
    const response = await fetch(`${API_URL}/programs/add-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, programId, points }),
    });

    if (!response.ok) {
      console.error("Erro ao adicionar pontos:", response.statusText);
    }
  } catch (error) {
    console.error("Erro de conexão ao adicionar pontos:", error);
  }
}
