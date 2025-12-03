// static/JavaScript/denuncias_lista.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/denuncias-lista-web/';

    const searchInput = document.getElementById('searchInput');
    const filterClasificacion = document.getElementById('filterClasificacion');
    const filterEstado = document.getElementById('filterEstado');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    const btnExportExcel = document.getElementById('btnExportExcel');
    const container = document.getElementById('denunciasContainer');
    const emptyState = document.getElementById('emptyState');
    const loaderBackdrop = document.getElementById('loaderBackdrop');

    const totalDenunciasEl = document.getElementById('totalDenuncias');
    const totalPendientesEl = document.getElementById('totalPendientes');
    const totalEnProcesoEl = document.getElementById('totalEnProceso');
    const totalCompletadasEl = document.getElementById('totalCompletadas');

    let denuncias = [];
    let denunciasFiltradas = [];

    // ===========================
    // INIT
    // ===========================
    cargarDenuncias();

    // Eventos
    searchInput.addEventListener('input', aplicarFiltros);
    filterClasificacion.addEventListener('change', aplicarFiltros);
    filterEstado.addEventListener('change', aplicarFiltros);

    btnLimpiar.addEventListener('click', () => {
        searchInput.value = '';
        filterClasificacion.value = '';
        filterEstado.value = '';
        aplicarFiltros();
    });

    btnExportExcel.addEventListener('click', exportarExcel);

    // ===========================
    // FUNCIONES PRINCIPALES
    // ===========================
    async function cargarDenuncias() {
        try {
            mostrarLoader(true);

            // Construir URL con parámetros de filtro si existen
            let url = API_URL;
            const params = new URLSearchParams();

            if (filterEstado.value) {
                params.append('estado', filterEstado.value);
            }

            // Puedes agregar más parámetros si tienes filtros de fecha
            // if (document.getElementById('fechaInicio')) {
            //     params.append('fecha_inicio', document.getElementById('fechaInicio').value);
            // }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const resp = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (!resp.ok) {
                throw new Error('Error al obtener las denuncias');
            }

            const data = await resp.json();

            if (data.success) {
                denuncias = data.denuncias;
            } else {
                console.error('Error del servidor:', data.error);
                denuncias = [];
            }

            // Normalizar algunos campos
            denuncias = denuncias.map(d => ({
                ...d,
                numero_denuncia: d.numero_denuncia || `DEN-${String(d.id_denuncia).padStart(6, '0')}`,
                estado_denuncia: d.estado_denuncia || 'pendiente',
                fecha_denuncia: d.fecha_denuncia || '',
                hora_denuncia: d.hora_denuncia || '',
                direccion_denuncia: d.direccion_denuncia || 'Sin dirección',
                detalle_denuncia: d.detalle_denuncia || 'Sin detalle',
                clasificacion_requerimiento: d.clasificacion_requerimiento || 'Sin clasificar',
                requerimiento_nombre: d.requerimiento_nombre || 'Sin requerimiento',
                usuario_registro: d.usuario_registro || 'No especificado',
                nombre_denunciante: d.nombre_denunciante || 'No especificado',
                telefono_denunciante: d.telefono_denunciante || 'No registrado'
            }));

            poblarSelectClasificacion(denuncias);
            actualizarEstadisticas(denuncias);

            denunciasFiltradas = [...denuncias];
            renderizarDenuncias();

        } catch (error) {
            console.error('Error cargando denuncias:', error);
            container.innerHTML = '<div class="alert alert-danger">Error al cargar las denuncias. Por favor, recarga la página.</div>';
        } finally {
            mostrarLoader(false);
        }
    }

    function poblarSelectClasificacion(lista) {
        const clasificacionesUnicas = Array.from(
            new Set(lista.map(d => d.clasificacion_requerimiento))
        ).filter(Boolean).sort();

        // Limpia opciones (mantiene la primera)
        filterClasificacion.innerHTML = '<option value="">Clasificación (todas)</option>';

        clasificacionesUnicas.forEach(cl => {
            const opt = document.createElement('option');
            opt.value = cl;
            opt.textContent = cl;
            filterClasificacion.appendChild(opt);
        });
    }

    function aplicarFiltros() {
        const query = searchInput.value.trim().toLowerCase();
        const clasificacion = filterClasificacion.value;
        const estado = filterEstado.value;

        denunciasFiltradas = denuncias.filter(d => {
            let coincideBusqueda = true;
            let coincideClasificacion = true;
            let coincideEstado = true;

            if (query) {
                const texto = [
                    d.numero_denuncia,
                    d.direccion_denuncia,
                    d.detalle_denuncia,
                    d.requerimiento_nombre,
                    d.nombre_denunciante,
                    d.usuario_registro
                ].join(' ').toLowerCase();

                coincideBusqueda = texto.includes(query);
            }

            if (clasificacion) {
                coincideClasificacion = (d.clasificacion_requerimiento === clasificacion);
            }

            if (estado) {
                coincideEstado = (d.estado_denuncia === estado);
            }

            return coincideBusqueda && coincideClasificacion && coincideEstado;
        });

        renderizarDenuncias();
    }

    function renderizarDenuncias() {
        container.innerHTML = '';

        if (!denunciasFiltradas.length) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        denunciasFiltradas.forEach(d => {
            const card = document.createElement('article');
            card.className = 'denuncia-card';
            card.innerHTML = crearHtmlTarjeta(d);
            container.appendChild(card);
        });
    }

    function crearHtmlTarjeta(d) {
        const estadoClase = `estado-${(d.estado_valor || d.estado_denuncia || 'pendiente').toLowerCase()}`;

        const fechaHora = [];
        if (d.fecha_denuncia) fechaHora.push(d.fecha_denuncia);
        if (d.hora_denuncia) fechaHora.push(d.hora_denuncia);

        const fechaHoraStr = fechaHora.length ? fechaHora.join(' · ') : 'Fecha no disponible';

        return `
            <div class="denuncia-header">
                <div>
                    <p class="denuncia-numero">${d.numero_denuncia}</p>
                    <span class="estado-pill ${estadoClase}">
                        ${formatearEstado(d.estado_denuncia)}
                    </span>
                </div>
                <small class="footer-label">${fechaHoraStr}</small>
            </div>

            <div class="denuncia-main">
                <div class="badges-row">
                    <span class="badge">
                        <i class="fa-solid fa-shield-halved"></i>
                        ${d.requerimiento_nombre}
                    </span>
                    <span class="badge">
                        <i class="fa-solid fa-signal"></i>
                        ${d.clasificacion_requerimiento}
                    </span>
                </div>

                <p class="denuncia-direccion">
                    <i class="fa-solid fa-location-dot"></i>
                    &nbsp;${d.direccion_denuncia}
                </p>

                <p class="denuncia-detalle" title="${d.detalle_denuncia}">
                    ${d.detalle_denuncia.substring(0, 100)}${d.detalle_denuncia.length > 100 ? '...' : ''}
                </p>
            </div>

            <div class="denuncia-footer">
                <div class="footer-left">
                    <span class="footer-label">Denunciante</span>
                    <span class="footer-value">${d.nombre_denunciante}</span>
                    <span class="footer-value">${d.telefono_denunciante}</span>
                </div>
                <div class="footer-right">
                    <span class="footer-label">Registrado por</span>
                    <span class="footer-value">${d.usuario_registro}</span>
                </div>
            </div>
        `;
    }

    function actualizarEstadisticas(lista) {
        totalDenunciasEl.textContent = lista.length;

        const pendientes = lista.filter(d => d.estado_denuncia === 'pendiente').length;
        const enProceso = lista.filter(d => d.estado_denuncia === 'en_proceso').length;
        const completadas = lista.filter(d => d.estado_denuncia === 'completada').length;

        totalPendientesEl.textContent = pendientes;
        totalEnProcesoEl.textContent = enProceso;
        totalCompletadasEl.textContent = completadas;
    }

    // ===========================
    // EXPORTAR A EXCEL (CSV)
    // ===========================
    function exportarExcel() {
        if (!denunciasFiltradas.length) {
            alert('No hay denuncias para exportar.');
            return;
        }

        const encabezados = [
            'ID',
            'Número',
            'Estado',
            'Fecha',
            'Hora',
            'Clasificación',
            'Requerimiento',
            'Dirección',
            'Detalle',
            'Denunciante',
            'Teléfono',
            'Usuario Registro'
        ];

        const filas = denunciasFiltradas.map(d => [
            d.id_denuncia,
            d.numero_denuncia,
            formatearEstado(d.estado_denuncia),
            d.fecha_denuncia,
            d.hora_denuncia,
            d.clasificacion_requerimiento,
            d.requerimiento_nombre,
            d.direccion_denuncia,
            limpiarComas(d.detalle_denuncia),
            d.nombre_denunciante,
            d.telefono_denunciante,
            d.usuario_registro
        ]);

        let csv = encabezados.join(';') + '\n';
        filas.forEach(row => {
            csv += row.map(celda => `"${(celda ?? '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `denuncias_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }

    // ===========================
    // UTILS
    // ===========================
    function formatearEstado(estado) {
        switch ((estado || '').toLowerCase()) {
            case 'pendiente':
                return 'Pendiente';
            case 'en_proceso':
                return 'En Proceso';
            case 'completada':
                return 'Completada';
            case 'cancelada':
                return 'Cancelada';
            default:
                return estado || 'Pendiente';
        }
    }

    function limpiarComas(texto) {
        if (!texto) return '';
        return texto.replace(/\r?\n|\r/g, ' ');
    }

    function mostrarLoader(mostrar) {
        if (mostrar) {
            loaderBackdrop.classList.remove('hidden');
        } else {
            loaderBackdrop.classList.add('hidden');
        }
    }
});