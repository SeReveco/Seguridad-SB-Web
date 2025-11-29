// 📋 SISTEMA PARA LISTAR USUARIOS (VERSIÓN COMPLETAMENTE CORREGIDA)

// Variables globales para listar usuarios
let todosLosUsuarios = [];
let usuariosFiltrados = [];
let filtrosAplicados = {
    rol: '',
    estado: ''
};

// ✅ FUNCIONES DE UTILIDAD PARA ROLES
function getRolNombre(rolId) {
    const roles = {
        1: 'Administrador',
        2: 'Operador', 
        3: 'Supervisor',
        4: 'Inspector'
    };
    return roles[rolId] || 'Usuario';
}

function getRolClass(rolId) {
    const roles = {
        1: 'rol-administrador',      // Rojo
        2: 'rol-operador',          // Azul
        3: 'rol-supervisor',        // Amarillo
        4: 'rol-inspector'          // Verde
    };
    return roles[rolId] || 'rol-usuario';
}

function getTipoUsuario(rolId) {
    return (rolId === 3 || rolId === 4) ? 'App Móvil' : 'Página Web';
}

// ✅ INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Módulo de listar usuarios inicializado');
    inicializarEventListenersListar();
    cargarPaginaCompleta();
});

// ✅ INICIALIZAR EVENT LISTENERS PARA LISTAR
function inicializarEventListenersListar() {
    // Búsqueda en tiempo real
    const buscarInput = document.getElementById('buscar-usuarios');
    if (buscarInput) {
        buscarInput.addEventListener('input', filtrarUsuarios);
    }

    // Botón de exportar Excel
    const btnExportar = document.querySelector('.btn-descargar-excel');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarUsuariosExcel);
    }

    // Inicializar badge de filtros
    actualizarBadgeFiltros();
}

// ✅ CARGAR PÁGINA COMPLETA
async function cargarPaginaCompleta() {
    try {
        console.log('📥 Cargando página completa de usuarios...');
        
        await cargarUsuarios();
        await cargarEstadisticas();
        
        console.log('✅ Página de usuarios cargada completamente');
        
    } catch (error) {
        console.error('❌ Error cargando página de usuarios:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    }
}

// ✅ CARGAR USUARIOS DESDE LA API
async function cargarUsuarios() {
    try {
        console.log('📥 Cargando lista de usuarios...');
        
        // Mostrar loading en la lista
        mostrarLoadingLista();

        const response = await fetch('/api/usuarios/');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const usuarios = await response.json();
        console.log('✅ Usuarios cargados:', usuarios);
        
        // ✅ CORREGIDO: Usar todos los usuarios (ya no hay ciudadanos)
        todosLosUsuarios = usuarios;
        usuariosFiltrados = [...todosLosUsuarios];
        mostrarUsuarios(usuariosFiltrados);
        
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        mostrarListaVacia('Error al cargar los usuarios: ' + error.message);
    }
}

// ✅ MOSTRAR USUARIOS EN LA LISTA (COMPLETAMENTE CORREGIDA)
function mostrarUsuarios(usuarios) {
    const listaUsuarios = document.getElementById('lista-usuarios');
    
    if (!usuarios || usuarios.length === 0) {
        listaUsuarios.innerHTML = `
            <div class="sin-usuarios">
                <i class="fa-solid fa-users-slash"></i>
                <h3>No hay usuarios registrados</h3>
                <p>Comienza agregando el primer usuario al sistema.</p>
            </div>
        `;
        return;
    }
    
    const usuariosHTML = usuarios.map(usuario => {
        const rolId = usuario.id_rol;
        const rolNombre = getRolNombre(rolId);
        const rolClass = getRolClass(rolId);
        const estadoClass = usuario.estado_usuario ? 'estado-activo' : 'estado-inactivo';
        const estadoTexto = usuario.estado_usuario ? 'ACTIVO' : 'INACTIVO';
        
        // ✅ CORREGIDO: Usar rolId para determinar tipo
        const tipoUsuario = getTipoUsuario(rolId);
        
        return `
            <div class="usuario-card" data-usuario-id="${usuario.id_usuario}">
                <div class="usuario-header">
                    <h3 class="usuario-nombre">${usuario.nombre_usuario} ${usuario.apellido_pat_usuario}</h3>
                    <span class="usuario-rol ${rolClass}">${rolNombre}</span>
                </div>
                
                <div class="usuario-info">
                    <div class="usuario-dato">
                        <strong>RUT:</strong>
                        <span>${usuario.rut_usuario}</span>
                    </div>
                    <div class="usuario-dato">
                        <strong>Email:</strong>
                        <span>${usuario.correo_electronico_usuario}</span>
                    </div>
                    <div class="usuario-dato">
                        <strong>Teléfono:</strong>
                        <span>${usuario.telefono_movil_usuario || 'No asignado'}</span>
                    </div>
                    <div class="usuario-dato">
                        <strong>Turno:</strong>
                        <span>${usuario.turno_nombre || 'No asignado'}</span>
                    </div>
                    <div class="usuario-dato">
                        <strong>Estado:</strong>
                        <span class="usuario-estado ${estadoClass}">${estadoTexto}</span>
                    </div>
                    <div class="usuario-dato">
                        <strong>Registro:</strong>
                        <span>${formatearFecha(usuario.fecha_creacion) || 'No disponible'}</span>
                    </div>
                </div>
                
                <div class="usuario-acciones">
                    <button type="button" class="btn-editar-usuario" onclick="editarUsuarioDesdeLista(${usuario.id_usuario})" title="Editar usuario">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                    <button type="button" class="btn-eliminar-usuario-card" onclick="eliminarUsuarioDesdeLista(${usuario.id_usuario}, event)" title="Eliminar usuario">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    listaUsuarios.innerHTML = usuariosHTML;
    animarEntradaLista();
    actualizarContadorResultados();
}

// ✅ FORMATEAR FECHA
function formatearFecha(fechaString) {
    if (!fechaString) return '';
    
    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return fechaString;
    }
}

// ✅ MOSTRAR LOADING EN LISTA
function mostrarLoadingLista() {
    const contenedor = document.getElementById('lista-usuarios');
    if (!contenedor) return;
    
    contenedor.innerHTML = `
        <div class="loading-usuarios">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Cargando usuarios...</p>
        </div>
    `;
}

// ✅ MOSTRAR LISTA VACÍA
function mostrarListaVacia(mensaje) {
    const contenedor = document.getElementById('lista-usuarios');
    if (!contenedor) return;
    
    contenedor.innerHTML = `
        <div class="sin-usuarios">
            <i class="fa-solid fa-users-slash"></i>
            <h4>${mensaje}</h4>
            <p>Utilice el botón "Agregar Nuevo Usuario" para crear el primero.</p>
        </div>
    `;
}

// ✅ ANIMAR ENTRADA DE LISTA
function animarEntradaLista() {
    const cards = document.querySelectorAll('.usuario-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ✅ FILTRAR USUARIOS (BÚSQUEDA EN TIEMPO REAL)
function filtrarUsuarios() {
    const searchInput = document.getElementById('buscar-usuarios');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm) {
        usuariosFiltrados = todosLosUsuarios.filter(usuario => {
            const rolId = usuario.id_rol;
            const rolNombre = getRolNombre(rolId);
            const nombreCompleto = `${usuario.nombre_usuario} ${usuario.apellido_pat_usuario} ${usuario.apellido_mat_usuario || ''}`.toLowerCase();
            const correo = usuario.correo_electronico_usuario.toLowerCase();
            const rut = usuario.rut_usuario.toLowerCase();
            
            return nombreCompleto.includes(searchTerm) ||
                   correo.includes(searchTerm) ||
                   rut.includes(searchTerm) ||
                   rolNombre.toLowerCase().includes(searchTerm);
        });
    } else {
        usuariosFiltrados = [...todosLosUsuarios];
    }
    
    // Aplicar filtros adicionales si existen
    aplicarFiltrosAdicionales();
    
    mostrarUsuarios(usuariosFiltrados);
}

// ✅ APLICAR FILTROS ADICIONALES (CORREGIDA)
function aplicarFiltrosAdicionales() {
    if (filtrosAplicados.rol) {
        usuariosFiltrados = usuariosFiltrados.filter(usuario => {
            const rolId = usuario.id_rol;
            const rolNombre = getRolNombre(rolId);
            return rolNombre === filtrosAplicados.rol;
        });
    }
    
    if (filtrosAplicados.estado) {
        const estadoBuscado = filtrosAplicados.estado === 'activo';
        usuariosFiltrados = usuariosFiltrados.filter(usuario => 
            usuario.estado_usuario === estadoBuscado
        );
    }
}

// ✅ ACTUALIZAR CONTADOR DE RESULTADOS
function actualizarContadorResultados() {
    const contador = document.getElementById('contador-resultados');
    if (!contador) return;
    
    const total = todosLosUsuarios.length;
    const filtrados = usuariosFiltrados.length;
    const textoFiltros = obtenerTextoFiltrosAplicados();
    
    if (textoFiltros) {
        contador.textContent = `Mostrando ${filtrados} de ${total} usuarios ${textoFiltros}`;
    } else {
        contador.textContent = `Mostrando ${filtrados} de ${total} usuarios`;
    }
}

// ✅ OBTENER TEXTO DE FILTROS APLICADOS
function obtenerTextoFiltrosAplicados() {
    const filtros = [];
    
    if (filtrosAplicados.rol) {
        filtros.push(`Rol: ${filtrosAplicados.rol}`);
    }
    if (filtrosAplicados.estado) {
        filtros.push(`Estado: ${filtrosAplicados.estado === 'activo' ? 'Activo' : 'Inactivo'}`);
    }
    
    return filtros.length > 0 ? `(Filtros: ${filtros.join(', ')})` : '';
}

// ✅ MOSTRAR MODAL DE FILTROS MEJORADO
async function mostrarModalFiltros() {
    try {
        console.log('🔍 Mostrando modal de filtros mejorado...');
        
        const modalHTML = crearModalFiltrosMejorado();
        
        // Mostrar modal con SweetAlert2
        const { value: formValues } = await Swal.fire({
            title: '🔍 Filtrar Usuarios',
            html: modalHTML,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Aplicar Filtros',
            cancelButtonText: 'Cancelar',
            width: '450px',
            customClass: {
                popup: 'filtros-modal',
                confirmButton: 'btn-confirmar-filtros',
                cancelButton: 'btn-cancelar-filtros'
            },
            didOpen: () => {
                // Agregar funcionalidad de filtros activos
                actualizarVistaFiltrosActivos();
            },
            preConfirm: () => {
                const rol = document.getElementById('filtro-rol').value;
                const estado = document.getElementById('filtro-estado').value;
                
                return { rol, estado };
            }
        });
        
        if (formValues) {
            // Aplicar filtros
            aplicarFiltrosConFeedback(formValues);
        }
        
    } catch (error) {
        console.error('❌ Error mostrando modal de filtros:', error);
        mostrarError('Error al cargar los filtros: ' + error.message);
    }
}

// ✅ CREAR MODAL DE FILTROS MEJORADO (CORREGIDO)
function crearModalFiltrosMejorado() {
    const filtrosActivos = contarFiltrosActivos();
    
    return `
        <div class="filtros-container">
            <!-- Indicador de filtros activos -->
            <div class="filtros-activos ${filtrosActivos > 0 ? 'mostrar' : ''}" id="filtros-activos-container">
                <strong>Filtros aplicados:</strong>
                <div id="lista-filtros-activos">
                    ${generarListaFiltrosActivos()} <!-- ✅ CORREGIDO -->
                </div>
            </div>
            
            <div class="filtro-group">
                <label for="filtro-rol">
                    <i class="fa-solid fa-user-tag"></i> Rol:
                </label>
                <select id="filtro-rol" class="filtro-select">
                    <option value="">Todos los roles</option>
                    <option value="Administrador" ${filtrosAplicados.rol === 'Administrador' ? 'selected' : ''}>Administrador</option>
                    <option value="Operador" ${filtrosAplicados.rol === 'Operador' ? 'selected' : ''}>Operador</option>
                    <option value="Supervisor" ${filtrosAplicados.rol === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
                    <option value="Inspector" ${filtrosAplicados.rol === 'Inspector' ? 'selected' : ''}>Inspector</option>
                </select>
            </div>
            
            <div class="filtro-group">
                <label for="filtro-estado">
                    <i class="fa-solid fa-circle-check"></i> Estado:
                </label>
                <select id="filtro-estado" class="filtro-select">
                    <option value="">Todos los estados</option>
                    <option value="activo" ${filtrosAplicados.estado === 'activo' ? 'selected' : ''}>🟢 Activo</option>
                    <option value="inactivo" ${filtrosAplicados.estado === 'inactivo' ? 'selected' : ''}>🔴 Inactivo</option>
                </select>
            </div>
            
            <div class="filtros-info">
                <p><small><i class="fa-solid fa-lightbulb"></i> Seleccione los filtros que desea aplicar.</small></p>
            </div>
        </div>
    `;
}

// ✅ CONTAR FILTROS ACTIVOS
function contarFiltrosActivos() {
    let count = 0;
    if (filtrosAplicados.rol) count++;
    if (filtrosAplicados.estado) count++;
    return count;
}

// ✅ GENERAR LISTA DE FILTROS ACTIVOS (CORREGIDO EL NOMBRE)
function generarListaFiltrosActivos() {
    const filtros = [];
    
    if (filtrosAplicados.rol) {
        filtros.push(`<span class="filtro-activo">Rol: ${filtrosAplicados.rol} <button onclick="removerFiltro('rol')">×</button></span>`);
    }
    if (filtrosAplicados.estado) {
        const estadoTexto = filtrosAplicados.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo';
        filtros.push(`<span class="filtro-activo">Estado: ${estadoTexto} <button onclick="removerFiltro('estado')">×</button></span>`);
    }
    
    return filtros.join('');
}

// ✅ ACTUALIZAR VISTA DE FILTROS ACTIVOS EN MODAL (CORREGIDO)
function actualizarVistaFiltrosActivos() {
    const container = document.getElementById('filtros-activos-container');
    const lista = document.getElementById('lista-filtros-activos');
    
    if (container && lista) {
        const count = contarFiltrosActivos();
        if (count > 0) {
            container.classList.add('mostrar');
            lista.innerHTML = generarListaFiltrosActivos();
        } else {
            container.classList.remove('mostrar');
        }
    }
}

// ✅ REMOVER FILTRO ESPECÍFICO
function removerFiltro(tipo) {
    filtrosAplicados[tipo] = '';
    
    // Actualizar select correspondiente
    const select = document.getElementById(`filtro-${tipo}`);
    if (select) {
        select.value = '';
    }
    
    // Actualizar vista
    actualizarVistaFiltrosActivos();
}

// ✅ APLICAR FILTROS CON FEEDBACK
function aplicarFiltrosConFeedback(nuevosFiltros) {
    filtrosAplicados = nuevosFiltros;
    aplicarFiltrosYMostrar();
    
    // Actualizar badge de filtros
    actualizarBadgeFiltros();
    
    // Mostrar notificación de filtros aplicados
    const textoFiltros = obtenerTextoFiltrosAplicados();
    if (textoFiltros) {
        Swal.fire({
            title: '✅ Filtros aplicados',
            html: `<p>${textoFiltros.replace('(Filtros: ', '').replace(')', '')}</p>`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    } else {
        // Si no hay filtros, mostrar que se limpiaron
        Swal.fire({
            title: '🧹 Filtros limpiados',
            text: 'Se muestran todos los usuarios',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

// ✅ ACTUALIZAR BADGE DE FILTROS
function actualizarBadgeFiltros() {
    const badge = document.getElementById('filtros-badge');
    const count = contarFiltrosActivos();
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ✅ APLICAR FILTROS Y MOSTRAR
function aplicarFiltrosYMostrar() {
    usuariosFiltrados = [...todosLosUsuarios];
    aplicarFiltrosAdicionales();
    mostrarUsuarios(usuariosFiltrados);
}

// ✅ LIMPIAR FILTROS MEJORADO
function limpiarFiltros() {
    const count = contarFiltrosActivos();
    
    if (count === 0) {
        Swal.fire({
            title: 'ℹ️ Sin filtros',
            text: 'No hay filtros activos para limpiar',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false
        });
        return;
    }
    
    Swal.fire({
        title: '¿Limpiar todos los filtros?',
        text: 'Se removerán todos los filtros aplicados',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            filtrosAplicados = { rol: '', estado: '' };
            usuariosFiltrados = [...todosLosUsuarios];
            
            // Limpiar campo de búsqueda
            const buscarInput = document.getElementById('buscar-usuarios');
            if (buscarInput) {
                buscarInput.value = '';
            }
            
            mostrarUsuarios(usuariosFiltrados);
            actualizarBadgeFiltros();
            
            Swal.fire({
                title: '🧹 Filtros limpiados',
                text: 'Todos los filtros han sido removidos',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// ✅ EXPORTAR USUARIOS A EXCEL (CORREGIDO)
async function exportarUsuariosExcel() {
    try {
        // ✅ VERIFICAR SI XLSX ESTÁ DISPONIBLE
        if (typeof XLSX === 'undefined') {
            throw new Error('La librería XLSX no está cargada. Agrega: <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>');
        }

        if (usuariosFiltrados.length === 0) {
            mostrarError('No hay usuarios para exportar');
            return;
        }

        // Mostrar loading
        Swal.fire({
            title: 'Generando Excel...',
            text: 'Preparando archivo de exportación',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Preparar datos para Excel
        const datosExcel = prepararDatosParaExcel();
        
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        
        // Ajustar anchos de columnas
        const anchosColumnas = [
            { wch: 5 },   // N°
            { wch: 25 },  // Nombre Completo
            { wch: 15 },  // RUT
            { wch: 25 },  // Correo Electrónico
            { wch: 15 },  // Teléfono
            { wch: 15 },  // Rol
            { wch: 15 },  // Turno
            { wch: 10 },  // Estado
            { wch: 20 }   // Fecha Registro
        ];
        ws['!cols'] = anchosColumnas;
        
        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
        
        // Generar archivo
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `usuarios_san_bernardo_${fecha}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar éxito
        Swal.fire({
            title: '¡Éxito!',
            html: `
                <p>Se ha generado el archivo Excel correctamente.</p>
                <p><strong>Archivo:</strong> ${nombreArchivo}</p>
                <p><strong>Registros exportados:</strong> ${usuariosFiltrados.length}</p>
            `,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 5000
        });
        
    } catch (error) {
        console.error('❌ Error exportando a Excel:', error);
        Swal.close();
        
        if (error.message.includes('XLSX no está cargada')) {
            mostrarError(`
                Error: La librería para exportar Excel no está disponible.<br><br>
                <strong>Solución:</strong> Agrega esta línea en tu HTML:<br>
                <code>&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"&gt;&lt;/script&gt;</code>
            `);
        } else {
            mostrarError('Error al generar el archivo Excel: ' + error.message);
        }
    }
}

// ✅ PREPARAR DATOS PARA EXCEL
function prepararDatosParaExcel() {
    return usuariosFiltrados.map((usuario, index) => {
        const rolId = usuario.id_rol;
        const rolNombre = getRolNombre(rolId);
        
        return {
            'N°': index + 1,
            'Nombre Completo': `${usuario.nombre_usuario} ${usuario.apellido_pat_usuario} ${usuario.apellido_mat_usuario || ''}`,
            'RUT': usuario.rut_usuario,
            'Correo Electrónico': usuario.correo_electronico_usuario,
            'Teléfono': usuario.telefono_movil_usuario || 'No asignado',
            'Rol': rolNombre,
            'Turno': usuario.turno_nombre || 'No asignado',
            'Estado': usuario.estado_usuario ? 'Activo' : 'Inactivo',
            'Fecha Registro': formatearFecha(usuario.fecha_creacion) || 'No disponible'
        };
    });
}

// ✅ CARGAR ESTADÍSTICAS (COMPLETAMENTE CORREGIDA)
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/usuarios/');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const usuarios = await response.json();
        
        console.log('📊 Usuarios cargados para estadísticas:', usuarios);
        
        // ✅ CORREGIDO: Contar por IDs de rol
        const totalAdministradores = usuarios.filter(u => u.id_rol === 1).length;
        const totalOperadores = usuarios.filter(u => u.id_rol === 2).length;
        const totalSupervisores = usuarios.filter(u => u.id_rol === 3).length;
        const totalInspectores = usuarios.filter(u => u.id_rol === 4).length;
        
        // ✅ CORREGIDO: 
        // - Usuarios App Móvil = Supervisores + Inspectores (roles 3 y 4)
        // - Usuarios Página Web = Administradores + Operadores (roles 1 y 2)
        const totalAppMovil = totalSupervisores + totalInspectores;
        const totalPaginaWeb = totalAdministradores + totalOperadores;
        
        const totalActivos = usuarios.filter(u => u.estado_usuario).length;
        
        console.log('📊 Estadísticas calculadas:', {
            administradores: totalAdministradores,
            operadores: totalOperadores,
            supervisores: totalSupervisores,
            inspectores: totalInspectores,
            appMovil: totalAppMovil,
            paginaWeb: totalPaginaWeb,
            activos: totalActivos
        });
        
        // ✅ CORREGIDO: Actualizar estadísticas con nuevas IDs
        document.getElementById('total-app-movil').textContent = totalAppMovil;
        document.getElementById('total-pagina-web').textContent = totalPaginaWeb;
        document.getElementById('total-administradores').textContent = totalAdministradores;
        document.getElementById('total-activos').textContent = totalActivos;
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        // Mostrar ceros en caso de error
        document.getElementById('total-app-movil').textContent = '0';
        document.getElementById('total-pagina-web').textContent = '0';
        document.getElementById('total-administradores').textContent = '0';
        document.getElementById('total-activos').textContent = '0';
    }
}

// ✅ EDITAR USUARIO DESDE LISTA
function editarUsuarioDesdeLista(usuarioId) {
    console.log('✏️ Editando usuario desde lista:', usuarioId);
    
    // Verificar si existe la función para abrir el modal de actualización
    if (typeof abrirModalActualizarUsuario === 'function') {
        abrirModalActualizarUsuario();
        
        // Esperar a que se cargue el modal y luego seleccionar el usuario
        setTimeout(() => {
            if (typeof seleccionarUsuarioActualizar === 'function') {
                seleccionarUsuarioActualizar(usuarioId);
            }
        }, 500);
    } else {
        console.warn('⚠️ Modal de actualización no disponible');
        mostrarError('La función de edición no está disponible en este momento');
    }
}

// ✅ ELIMINAR USUARIO DESDE LA LISTA (CORREGIDA)
function eliminarUsuarioDesdeLista(usuarioId, event) {
    // Prevenir que el evento se propague si se pasa
    if (event) {
        event.stopPropagation();
    }
    
    console.log('🗑️ Eliminando usuario desde lista:', usuarioId);
    
    // Buscar usuario en la lista actual
    const usuario = todosLosUsuarios.find(u => u.id_usuario === usuarioId);
    
    if (!usuario) {
        mostrarError('No se pudo encontrar la información del usuario');
        return;
    }
    
    const rolId = usuario.id_rol;
    const rolNombre = getRolNombre(rolId);
    const nombreUsuario = `${usuario.nombre_usuario} ${usuario.apellido_pat_usuario}`;
    
    Swal.fire({
        title: '¿Eliminar usuario?',
        html: `
            <p>¿Estás seguro que deseas eliminar este usuario?</p>
            <p><strong>${nombreUsuario}</strong></p>
            <p><strong>Rol:</strong> ${rolNombre}</p>
            <p class="text-danger">Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then(async (result) => {
        if (result.isConfirmed) {
            await ejecutarEliminacionUsuario(usuarioId, nombreUsuario);
        }
    });
}

// ✅ FUNCIONES DE UTILIDAD
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        html: mensaje,
        confirmButtonText: 'Aceptar'
    });
}

// ✅ RECARGAR LISTA DESDE OTROS MÓDULOS
function recargarListaUsuarios() {
    cargarUsuarios();
    cargarEstadisticas();
}

// ✅ EXPORTAR FUNCIONES PARA USO GLOBAL
window.recargarListaUsuarios = recargarListaUsuarios;
window.cargarEstadisticas = cargarEstadisticas;
window.filtrarUsuarios = filtrarUsuarios;
window.mostrarModalFiltros = mostrarModalFiltros;
window.limpiarFiltros = limpiarFiltros;
window.exportarUsuariosExcel = exportarUsuariosExcel;
window.editarUsuarioDesdeLista = editarUsuarioDesdeLista;
window.eliminarUsuarioDesdeLista = eliminarUsuarioDesdeLista;
window.getRolNombre = getRolNombre;
window.getRolClass = getRolClass;
window.getTipoUsuario = getTipoUsuario;
window.removerFiltro = removerFiltro;