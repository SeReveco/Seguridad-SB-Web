// ===== Configuración base =====

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDashboard();
});

const apiUrl = "/api/denuncias/estadisticas/";

// Paletas de colores
const paletteStates = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#6b7280'];
const paletteFamilies = ['#1d4ed8', '#2563eb', '#0ea5e9', '#22c55e', '#a855f7', '#f97316', '#facc15'];
const palettePriority = ['#ef4444', '#f59e0b', '#22c55e', '#6b7280'];

// Registrar plugin de etiquetas
if (window.ChartDataLabels) {
    Chart.register(ChartDataLabels);
}

function cargarDatosDashboard() {
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al obtener datos del backend");
            }
            return response.json();
        })
        .then(data => {
            dibujarGraficos(data);
        })
        .catch(error => {
            console.error(error);
            alert("No se pudieron cargar las estadísticas de denuncias.");
        });
}

function dibujarGraficos(data) {

    // ========= Denuncias por Estado (barras) =========
    const ctxEstado = document.getElementById('denunciasPorEstadoChart').getContext('2d');
    const totalEstado = (data.por_estado.data || []).reduce((a, b) => a + b, 0);
    document.getElementById('badge-total-estado').innerText = totalEstado;

    new Chart(ctxEstado, {
        type: 'bar',
        data: {
            labels: data.por_estado.labels,
            datasets: [{
                label: 'Denuncias',
                data: data.por_estado.data,
                backgroundColor: paletteStates.slice(0, data.por_estado.data.length),
                borderRadius: 12,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.raw} denuncias`
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    color: '#111827',
                    font: {
                        weight: '600',
                        size: 11
                    },
                    formatter: value => value || ''
                }
            },
            scales: {
                x: {
                    ticks: { color: '#6b7280' },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(209, 213, 219, 0.6)',
                        drawBorder: false
                    }
                }
            }
        }
    });

    // ========= Denuncias por Familia (donut) =========
    const ctxFamilia = document.getElementById('denunciasPorFamiliaChart').getContext('2d');
    const totalFamilia = (data.por_familia.data || []).reduce((a, b) => a + b, 0);
    document.getElementById('badge-total-familia').innerText = totalFamilia;

    new Chart(ctxFamilia, {
        type: 'doughnut',
        data: {
            labels: data.por_familia.labels,
            datasets: [{
                data: data.por_familia.data,
                backgroundColor: paletteFamilies.slice(0, data.por_familia.data.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%', // grosor tipo anillo
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 14,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const value = ctx.raw || 0;
                            const porcentaje = totalFamilia ? ((value / totalFamilia) * 100).toFixed(1) : 0;
                            return ` ${ctx.label}: ${value} (${porcentaje}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#111827',
                    font: {
                        size: 10,
                        weight: '600'
                    },
                    formatter: (value, ctx) => {
                        if (!totalFamilia || value === 0) return '';
                        const porcentaje = (value / totalFamilia) * 100;
                        return porcentaje >= 5 ? `${value}` : '';
                    }
                }
            }
        }
    });

    // ========= Denuncias por Clasificación / Prioridad (donut) =========
    const ctxClasificacion = document.getElementById('denunciasPorClasificacionChart').getContext('2d');
    const totalClasif = (data.por_clasificacion.data || []).reduce((a, b) => a + b, 0);
    document.getElementById('badge-total-clasificacion').innerText = totalClasif;

    // mapear etiquetas a colores: Media, Alta, Baja, Urgencia, etc.
    const priorityColorMap = {
        'Media': '#f97316',
        'Alta': '#22c55e',
        'Baja': '#6366f1',
        'Urgencia': '#ef4444'
    };
    const clasifColors = data.por_clasificacion.labels.map(
        label => priorityColorMap[label] || '#6b7280'
    );

    new Chart(ctxClasificacion, {
        type: 'doughnut',
        data: {
            labels: data.por_clasificacion.labels,
            datasets: [{
                data: data.por_clasificacion.data,
                backgroundColor: clasifColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 14,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const value = ctx.raw || 0;
                            const porcentaje = totalClasif ? ((value / totalClasif) * 100).toFixed(1) : 0;
                            return ` ${ctx.label}: ${value} (${porcentaje}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#111827',
                    font: {
                        size: 10,
                        weight: '600'
                    },
                    formatter: (value, ctx) => {
                        if (!totalClasif || value === 0) return '';
                        const porcentaje = (value / totalClasif) * 100;
                        return porcentaje >= 5 ? `${value}` : '';
                    }
                }
            }
        }
    });

    // ========= Denuncias por Mes (línea con área) =========
    const ctxMes = document.getElementById('denunciasPorMesChart').getContext('2d');
    const totalMes = (data.por_mes.data || []).reduce((a, b) => a + b, 0);
    document.getElementById('badge-total-mes').innerText = totalMes;

    new Chart(ctxMes, {
        type: 'line',
        data: {
            labels: data.por_mes.labels,
            datasets: [{
                label: 'Denuncias',
                data: data.por_mes.data,
                tension: 0.35,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 5,
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                borderColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.raw} denuncias`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#6b7280' },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(209, 213, 219, 0.6)',
                        drawBorder: false
                    }
                }
            }
        }
    });

    // ========= Top Usuarios (barras horizontales) =========
    const ctxUsuario = document.getElementById('denunciasPorUsuarioChart').getContext('2d');
    const totalUsuario = (data.por_usuario.data || []).reduce((a, b) => a + b, 0);
    document.getElementById('badge-total-usuario').innerText = totalUsuario;

    new Chart(ctxUsuario, {
        type: 'bar',
        data: {
            labels: data.por_usuario.labels,
            datasets: [{
                label: 'Denuncias',
                data: data.por_usuario.data,
                backgroundColor: '#6366f1',
                borderRadius: 10,
                maxBarThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.raw} denuncias`
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    color: '#111827',
                    font: {
                        size: 10,
                        weight: '600'
                    },
                    formatter: value => value || ''
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(209, 213, 219, 0.6)',
                        drawBorder: false
                    }
                },
                y: {
                    ticks: { color: '#6b7280' },
                    grid: { display: false }
                }
            }
        }
    });
}
