// Gráfico: Consumo Médio dos Clientes
const ctxConsumo = document.getElementById('graficoConsumoMedio').getContext('2d');
new Chart(ctxConsumo, {
    type: 'bar',
    data: {
        labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'],
        datasets: [{
            label: 'Consumo Médio (R$)',
            data: [120, 150, 130, 160, 170],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Gráfico: Visitas por Dia
const ctxVisitas = document.getElementById('graficoVisitas').getContext('2d');
new Chart(ctxVisitas, {
    type: 'line',
    data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Visitas por Dia',
            data: [40, 50, 45, 60, 70, 90, 80],
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Gráfico: Tempo Médio de Fidelidade
const ctxFidelidade = document.getElementById('graficoFidelidade').getContext('2d');
new Chart(ctxFidelidade, {
    type: 'doughnut',
    data: {
        labels: ['0-6 meses', '6-12 meses', '1-2 anos', '2+ anos'],
        datasets: [{
            data: [20, 30, 25, 25],
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
        }]
    }
});

// Gráfico: Taxa de Retorno
const ctxRetorno = document.getElementById('graficoRetorno').getContext('2d');
new Chart(ctxRetorno, {
    type: 'pie',
    data: {
        labels: ['Clientes Retornaram', 'Clientes Não Retornaram'],
        datasets: [{
            data: [70, 30],
            backgroundColor: ['#4caf50', '#f44336']
        }]
    }
});

// Gráfico: Distribuição por Gênero
const ctxGenero = document.getElementById('graficoGenero').getContext('2d');
new Chart(ctxGenero, {
    type: 'pie',
    data: {
        labels: ['Masculino', 'Feminino', 'Não informado'],
        datasets: [{
            data: [55, 40, 5],
            backgroundColor: ['#4caf50', '#ff6384', '#9e9e9e']
        }]
    },
    options: {
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

// Gráfico: Distribuição por Faixa Etária
const ctxFaixaEtaria = document.getElementById('graficoFaixaEtaria').getContext('2d');
new Chart(ctxFaixaEtaria, {
    type: 'bar',
    data: {
        labels: ['<18', '18-25', '26-35', '36-50', '51+'],
        datasets: [{
            label: 'Número de Clientes',
            data: [10, 45, 60, 30, 15],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Número de Clientes'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Faixa Etária'
                }
            }
        }
    }
});
