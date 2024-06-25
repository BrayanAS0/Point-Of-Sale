const { ipcRenderer } = require('electron');

// Función para crear gráfica de ventas diarias
function createDailySalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.fecha),
            datasets: [{
                label: 'Ventas Diarias',
                data: data.map(item => item.total_ventas),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas Diarias (Últimos 30 días)'
                }
            }
        }
    });
}

// Función para crear gráfica de ganancias diarias
function createDailyProfitChart(data) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.fecha),
            datasets: [{
                label: 'Ganancias Diarias',
                data: data.map(item => item.total_ganancias),
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Ganancias Diarias (Últimos 30 días)'
                }
            }
        }
    });
}

// Función para crear gráfica de ventas y ganancias mensuales
function createMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.mes),
            datasets: [{
                label: 'Ventas Mensuales',
                data: data.map(item => item.total_ventas),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }, {
                label: 'Ganancias Mensuales',
                data: data.map(item => item.total_ganancias),
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas y Ganancias Mensuales'
                }
            }
        }
    });
}

// Función principal para inicializar las gráficas
function initCharts() {
    console.log('Solicitando datos para las gráficas...');
    
    // Solicitar datos al proceso principal
    ipcRenderer.send('get-sales-data');
    
    // Escuchar la respuesta del proceso principal
    ipcRenderer.once('sales-data-response', (event, response) => {
        console.log('Datos recibidos:', response);
        
        if (response.error) {
            console.error('Error al obtener datos:', response.error);
            document.body.innerHTML += '<p>Error al cargar las gráficas. Por favor, intenta de nuevo más tarde.</p>';
            return;
        }

        const { dailyData, monthlyData } = response;
        
        if (dailyData.length === 0 || monthlyData.length === 0) {
            console.log('No hay datos disponibles para mostrar en las gráficas.');
            document.body.innerHTML += '<p>No hay datos disponibles para mostrar en las gráficas.</p>';
            return;
        }

        createDailySalesChart(dailyData);
        createDailyProfitChart(dailyData);
        createMonthlyChart(monthlyData);
        console.log('Gráficas creadas con éxito.');
    });
}

// Inicializar las gráficas cuando se cargue la página
document.addEventListener('DOMContentLoaded', initCharts);