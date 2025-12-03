// static/JavaScript/denuncias_lista.js

console.log("✅ denuncias_lista.js se ha cargado");

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOMContentLoaded ejecutado");

    // API SIMPLE QUE ESTAMOS USANDO
    const API_URL = '/api/denuncias-lista/';

    // ===========================
    // OBTENER ELEMENTOS DEL DOM (con protección)
    // ===========================
    const getEl = (id) => {
        const el = document.getElementById(id);
        if (!el) console.warn(`⚠️ Elemento faltante: #${id}`);
        return el;
    };

    const searchInput           = getEl('searchInput');
    const filterClasificacion   = getEl('filterClasificacion');
    const filterEstado          = getEl('filterEstado');
    const btnLimpiar            = getEl('btnLimpiarFiltros');
    const btnExportExcel        = getEl('btnExportExcel');
    const container             = getEl('denunciasContainer');
    const emptyState            = getEl('emptyState');
    const loaderBackdrop        = getEl('loaderBackdrop');

    const totalDenunciasEl      = getEl('totalDenuncias');
    const totalPendientesEl     = getEl('totalPendientes');
    const totalEnProcesoEl      = getEl('totalEnProceso');
    const totalCompletadasEl    = getEl('totalCompletadas');

    let denuncias = [];
    let denunciasFiltradas = [];

    // ===========================
    // INICIO REAL
    // ===========================
    console.log("📌 Iniciando carga de denuncias...");
    cargarDenuncias();

    // ===========================
    // EVENTOS (solo si el elemento existe)
    // ===========================
    if (searchInput) searchInput.addEventListener('input', aplicarFiltros);
    if (filterClasificacion) filterClasificacion.addEventListener('change', aplicarFiltros);
    if (filterEstado) filterEstado.addEventListener('change', aplicarFiltros);

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (filterClasificacion) filterClasificacion.value = '';
            if (filterEstado) filterEstado.value = '';
            aplicarFiltros();
        });
    }

    if (btnExportExcel) btnExportExcel.addEventListener('click', exportarExcel);

    // ============================================================
    // 🔥 FUNCIÓN PRINCIPAL: CARGAR DENUNCIAS DESDE EL BACKEND
    // ============================================================
    async function cargarDenuncias() {
        console.log("🔄 Llamando a API:", API_URL);

        try {
            mostrarLoader(true);

            let url = API_URL;
            const params = new URLSearchParams();

            // Si quisieras pasar estado como query param al backend:
            if (filterEstado && filterEstado.value) {
                params.append('estado', filterEstado.value);
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            console.log("📡 URL final:", url);

            const resp = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            console.log("📡 Respuesta HTTP:", resp.status);

            if (!resp.ok) {
                console.error("❌ Error HTTP:", resp);
                throw new Error('Error al obtener las denuncias');
            }

            const data = await resp.json();
            console.log("📦 Datos recibidos:", data);

            if (data.success) {
                denuncias = data.denuncias || [];
                console.log(`📊 Total denuncias recibidas: ${denuncias.length}`);
            } else {
                console.error("⚠️ Error en servidor:", data.error);
                denuncias = [];
            }

            // Normalizar
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
            console.error("❌ Error cargando denuncias:", error);

            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        Error al cargar las denuncias. Recarga la página.
                    </div>`;
            }
        } finally {
            mostrarLoader(false);
        }
    }

    // ============================================================
    // SELECT CLASIFICACIÓN
    // ============================================================
    function poblarSelectClasificacion(lista) {
        if (!filterClasificacion) return;

        const clasif = Array.from(new Set(lista.map(d => d.clasificacion_requerimiento)))
            .filter(Boolean)
            .sort();

        filterClasificacion.innerHTML = `<option value="">Clasificación (todas)</option>`;

        clasif.forEach(cl => {
            const opt = document.createElement('option');
            opt.value = cl;
            opt.textContent = cl;
            filterClasificacion.appendChild(opt);
        });
    }

    // ============================================================
    // FILTRO GENERAL
    // ============================================================
    function aplicarFiltros() {
        console.log("🔍 Aplicando filtros...");

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const clasificacion = filterClasificacion ? filterClasificacion.value : '';
        const estado = filterEstado ? filterEstado.value : '';

        denunciasFiltradas = denuncias.filter(d => {
            let ok = true;

            if (query) {
                const texto = [
                    d.numero_denuncia,
                    d.direccion_denuncia,
                    d.detalle_denuncia,
                    d.requerimiento_nombre,
                    d.nombre_denunciante,
                    d.usuario_registro
                ].join(' ').toLowerCase();

                ok = ok && texto.includes(query);
            }

            if (clasificacion) ok = ok && d.clasificacion_requerimiento === clasificacion;
            if (estado) ok = ok && d.estado_denuncia === estado;

            return ok;
        });

        console.log(`📊 Filtradas: ${denunciasFiltradas.length}`);
        renderizarDenuncias();
    }

    // ============================================================
    // RENDER
    // ============================================================
    function renderizarDenuncias() {
        if (!container) return;

        container.innerHTML = '';

        if (!denunciasFiltradas.length) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

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
                    <span class="badge"><i class="fa-solid fa-shield-halved"></i> ${d.requerimiento_nombre}</span>
                    <span class="badge"><i class="fa-solid fa-signal"></i> ${d.clasificacion_requerimiento}</span>
                </div>
                <p class="denuncia-direccion">
                    <i class="fa-solid fa-location-dot"></i> ${d.direccion_denuncia}
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
            </div>`;
    }

    // ============================================================
    // ESTADÍSTICAS
    // ============================================================
    function actualizarEstadisticas(lista) {
        if (totalDenunciasEl) totalDenunciasEl.textContent = lista.length;

        const pendientes = lista.filter(d => d.estado_denuncia === 'pendiente').length;
        const enProceso = lista.filter(d => d.estado_denuncia === 'en_proceso').length;
        const completadas = lista.filter(d => d.estado_denuncia === 'completada').length;

        if (totalPendientesEl) totalPendientesEl.textContent = pendientes;
        if (totalEnProcesoEl) totalEnProcesoEl.textContent = enProceso;
        if (totalCompletadasEl) totalCompletadasEl.textContent = completadas;
    }

    // ============================================================
    // EXPORTAR
    // ============================================================
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
            csv += row.map(celda =>
                `"${(celda ?? '').toString().replace(/"/g, '""')}"`)
                .join(';') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `denuncias_${new Date().toISOString().split('T')[0]}.csv`;
        enlace.click();
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    function formatearEstado(estado) {
        switch ((estado || '').toLowerCase()) {
            case 'pendiente': return 'Pendiente';
            case 'en_proceso': return 'En Proceso';
            case 'completada': return 'Completada';
            case 'cancelada': return 'Cancelada';
            default: return estado || 'Pendiente';
        }
    }

    function limpiarComas(texto) {
        if (!texto) return '';
        return texto.replace(/\r?\n|\r/g, ' ');
    }

    function mostrarLoader(mostrar) {
        if (!loaderBackdrop) return;
        loaderBackdrop.classList.toggle('hidden', !mostrar);
    }
});
