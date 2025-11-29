// 🗑️ SISTEMA PARA ELIMINAR USUARIOS (COMPLETAMENTE CORREGIDO)

// Variables globales para eliminar usuario
let todosLosUsuariosEliminar = [];
let usuarioSeleccionadoEliminar = null;

// ✅ INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Módulo de eliminar usuarios inicializado');
    inicializarEventListenersEliminar();
});

// ✅ INICIALIZAR EVENT LISTENERS
function inicializarEventListenersEliminar() {
    // Event listener para el input de búsqueda
    const buscarInput = document.getElementById('buscar-usuario-eliminar');
    if (buscarInput) {
        buscarInput.addEventListener('input', buscarUsuariosEliminar);
    }
}

// ✅ ABRIR MODAL DE ELIMINAR USUARIO (ACTUALIZADO)
async function abrirModalEliminarUsuario() {
    console.log('🗑️ Abriendo modal para eliminar usuario...');
    
    try {
        document.getElementById('modal-eliminar-usuario').style.display = 'block';
        resetearModalEliminar();
        await cargarUsuariosParaEliminar(); // ✅ CARGAR USUARIOS AUTOMÁTICAMENTE
        console.log('✅ Modal de eliminar usuario listo');
        
    } catch (error) {
        console.error('❌ Error al abrir modal de eliminar usuario:', error);
        mostrarError('Error al cargar los usuarios: ' + error.message);
    }
}

// ✅ CARGAR USUARIOS PARA ELIMINAR (NUEVA FUNCIÓN)
async function cargarUsuariosParaEliminar() {
    try {
        console.log('📥 Cargando usuarios para eliminar...');
        
        const listaUsuarios = document.getElementById('lista-usuarios-eliminar');
        if (!listaUsuarios) return;
        
        // Mostrar loading
        listaUsuarios.innerHTML = `
            <div class="loading-usuarios">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Cargando usuarios eliminables...</p>
            </div>
        `;

        const response = await fetch('/api/usuarios/');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const usuarios = await response.json();
        
        // ✅ CORREGIDO: Usar todos los usuarios (ya no hay ciudadanos)
        todosLosUsuariosEliminar = usuarios;
        
        console.log(`✅ ${todosLosUsuariosEliminar.length} usuarios cargados para eliminar`);
        
        // Mostrar todos los usuarios inicialmente
        mostrarUsuariosEliminables(todosLosUsuariosEliminar);
        
    } catch (error) {
        console.error('❌ Error cargando usuarios para eliminar:', error);
        const listaUsuarios = document.getElementById('lista-usuarios-eliminar');
        if (listaUsuarios) {
            listaUsuarios.innerHTML = `
                <div class="error-busqueda">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <p>Error al cargar usuarios</p>
                    <small>${error.message}</small>
                    <br>
                    <button onclick="cargarUsuariosParaEliminar()" class="btn-actualizar-usuario" style="margin-top: 10px; padding: 5px 10px;">
                        <i class="fa-solid fa-refresh"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// ✅ MOSTRAR USUARIOS ELIMINABLES (NUEVA FUNCIÓN - CORREGIDA)
function mostrarUsuariosEliminables(usuarios) {
    const listaUsuarios = document.getElementById('lista-usuarios-eliminar');
    if (!listaUsuarios) return;
    
    if (!usuarios || usuarios.length === 0) {
        listaUsuarios.innerHTML = `
            <div class="sin-resultados">
                <i class="fa-solid fa-user-slash"></i>
                <p>No hay usuarios disponibles para eliminar</p>
                <small>Todos los usuarios del sistema pueden ser eliminados</small>
            </div>
        `;
        return;
    }
    
    const usuariosHTML = usuarios.map(usuario => {
        const rolId = usuario.id_rol;
        const rolNombre = getRolNombre(rolId);
        const rolClass = getRolClass(rolId);
        const estadoClass = usuario.estado_usuario ? 'estado-activo' : 'estado-inactivo';
        const estadoTexto = usuario.estado_usuario ? 'Activo' : 'Inactivo';
        const nombreCompleto = `${usuario.nombre_usuario} ${usuario.apellido_pat_usuario} ${usuario.apellido_mat_usuario || ''}`.trim();
        
        return `
            <div class="usuario-item-search" onclick="seleccionarUsuarioEliminar(${usuario.id_usuario}, this)">
                <div class="usuario-info-search">
                    <div>
                        <div class="usuario-nombre-search">${nombreCompleto}</div>
                        <div class="usuario-email-search">${usuario.correo_electronico_usuario}</div>
                        <div class="usuario-rut-search">RUT: ${usuario.rut_usuario}</div>
                    </div>
                    <div>
                        <span class="usuario-rol ${rolClass}">${rolNombre}</span>
                        <div class="usuario-estado ${estadoClass}">${estadoTexto}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    listaUsuarios.innerHTML = usuariosHTML;
}

// ✅ CERRAR MODAL ELIMINAR
function cerrarModalEliminarUsuario() {
    console.log('❌ Cerrando modal de eliminar usuario...');
    document.getElementById('modal-eliminar-usuario').style.display = 'none';
    resetearModalEliminar();
}

// ✅ RESETEAR MODAL ELIMINAR
function resetearModalEliminar() {
    console.log('🔄 Reseteando modal de eliminar...');
    
    // Limpiar búsqueda
    const buscarInput = document.getElementById('buscar-usuario-eliminar');
    if (buscarInput) {
        buscarInput.value = '';
    }
    
    // Limpiar lista de resultados
    const listaUsuarios = document.getElementById('lista-usuarios-eliminar');
    if (listaUsuarios) {
        listaUsuarios.innerHTML = '';
    }
    
    // Ocultar información del usuario
    const infoUsuario = document.getElementById('info-usuario-eliminar');
    if (infoUsuario) {
        infoUsuario.style.display = 'none';
    }
    
    // Deshabilitar botón de eliminar
    const btnEliminar = document.getElementById('btn-confirmar-eliminar-usuario');
    if (btnEliminar) {
        btnEliminar.disabled = true;
    }
    
    // Resetear usuario seleccionado
    usuarioSeleccionadoEliminar = null;
    todosLosUsuariosEliminar = [];
}

// ✅ BUSCAR USUARIOS PARA ELIMINAR (ACTUALIZADA - CORREGIDA)
function buscarUsuariosEliminar() {
    const query = document.getElementById('buscar-usuario-eliminar').value.trim();
    const listaUsuarios = document.getElementById('lista-usuarios-eliminar');
    
    if (!listaUsuarios || !todosLosUsuariosEliminar.length) return;
    
    // Si no hay búsqueda, mostrar todos los usuarios
    if (!query) {
        mostrarUsuariosEliminables(todosLosUsuariosEliminar);
        return;
    }
    
    // Filtrar usuarios localmente
    const usuariosFiltrados = todosLosUsuariosEliminar.filter(usuario => {
        const rolId = usuario.id_rol;
        const rolNombre = getRolNombre(rolId);
        const nombreCompleto = `${usuario.nombre_usuario || ''} ${usuario.apellido_pat_usuario || ''} ${usuario.apellido_mat_usuario || ''}`.toLowerCase();
        const correo = (usuario.correo_electronico_usuario || '').toLowerCase();
        const rut = (usuario.rut_usuario || '').toLowerCase();
        
        return nombreCompleto.includes(query.toLowerCase()) ||
               correo.includes(query.toLowerCase()) ||
               rut.includes(query.toLowerCase()) ||
               rolNombre.toLowerCase().includes(query.toLowerCase());
    });
    
    // Mostrar resultados filtrados
    mostrarUsuariosEliminables(usuariosFiltrados);
}

// ✅ SELECCIONAR USUARIO PARA ELIMINAR (ACTUALIZADA - CORREGIDA)
async function seleccionarUsuarioEliminar(usuarioId, elemento) {
    try {
        console.log(`👤 Seleccionando usuario para eliminar: ${usuarioId}`);
        
        // Remover selección anterior
        const itemsAnteriores = document.querySelectorAll('#lista-usuarios-eliminar .usuario-item-search.selected');
        itemsAnteriores.forEach(item => item.classList.remove('selected'));
        
        // Agregar selección actual
        elemento.classList.add('selected');
        
        // Buscar usuario en la lista cargada
        const usuario = todosLosUsuariosEliminar.find(u => u.id_usuario === usuarioId);
        
        if (!usuario) {
            // Si no está en la lista cargada, obtener del API
            const response = await fetch(`/api/usuarios/${usuarioId}/`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            usuarioSeleccionadoEliminar = await response.json();
        } else {
            usuarioSeleccionadoEliminar = usuario;
        }
        
        console.log('🔍 Usuario seleccionado:', usuarioSeleccionadoEliminar);
        
        // ✅ CORREGIDO: Ya no hay validación de roles, todos los usuarios pueden eliminarse
        const rolId = usuarioSeleccionadoEliminar.id_rol;
        const rolNombre = getRolNombre(rolId);
        console.log(`🔍 Rol determinado: ${rolNombre}`);
        
        // Mostrar información del usuario
        mostrarInformacionUsuarioEliminar(usuarioSeleccionadoEliminar);
        
        // Habilitar botón de eliminar
        const btnEliminar = document.getElementById('btn-confirmar-eliminar-usuario');
        if (btnEliminar) btnEliminar.disabled = false;
        
    } catch (error) {
        console.error('❌ Error seleccionando usuario:', error);
        mostrarError('Error al cargar la información del usuario: ' + error.message);
    }
}

// ✅ MOSTRAR INFORMACIÓN DEL USUARIO A ELIMINAR (ACTUALIZADA - CORREGIDA)
function mostrarInformacionUsuarioEliminar(usuario) {
    const infoUsuario = document.getElementById('info-usuario-eliminar');
    if (!infoUsuario) return;
    
    const rolId = usuario.id_rol;
    const rolNombre = getRolNombre(rolId);
    const rolClass = getRolClass(rolId);
    const nombreCompleto = `${usuario.nombre_usuario} ${usuario.apellido_pat_usuario} ${usuario.apellido_mat_usuario || ''}`.trim();
    
    console.log('🔍 Mostrando información del usuario:', { nombre: nombreCompleto, rol: rolNombre });
    
    // Actualizar información
    document.getElementById('usuario-eliminar-nombre').textContent = nombreCompleto;
    document.getElementById('usuario-eliminar-rut').textContent = usuario.rut_usuario;
    document.getElementById('usuario-eliminar-correo').textContent = usuario.correo_electronico_usuario;
    
    // Actualizar rol
    const rolElement = document.getElementById('usuario-eliminar-rol');
    if (rolElement) {
        rolElement.textContent = rolNombre;
        rolElement.className = 'rol-badge ' + rolClass;
    }
    
    // Actualizar estado
    const estadoElement = document.getElementById('usuario-eliminar-estado');
    if (estadoElement) {
        const estadoTexto = usuario.estado_usuario ? 'Activo' : 'Inactivo';
        const estadoClass = usuario.estado_usuario ? 'estado-activo' : 'estado-inactivo';
        estadoElement.textContent = estadoTexto;
        estadoElement.className = 'estado-badge ' + estadoClass;
    }
    
    // Mostrar sección
    infoUsuario.style.display = 'block';
}

// ✅ CONFIRMAR ELIMINACIÓN DE USUARIO (ACTUALIZADA - CORREGIDA)
async function confirmarEliminarUsuario() {
    if (!usuarioSeleccionadoEliminar) {
        mostrarError('No hay ningún usuario seleccionado para eliminar');
        return;
    }
    
    const usuarioId = usuarioSeleccionadoEliminar.id_usuario;
    const nombreUsuario = `${usuarioSeleccionadoEliminar.nombre_usuario} ${usuarioSeleccionadoEliminar.apellido_pat_usuario}`;
    const rolId = usuarioSeleccionadoEliminar.id_rol;
    const rolNombre = getRolNombre(rolId);
    
    // ✅ CORREGIDO: Ya no hay validación de roles, todos pueden eliminarse
    
    // Confirmación con SweetAlert2
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        html: `
            <p>Vas a eliminar permanentemente al usuario:</p>
            <p><strong>${nombreUsuario}</strong></p>
            <p><strong>Rol:</strong> ${rolNombre}</p>
            <p class="text-danger">Esta acción no se puede deshacer.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar usuario',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true
    });
    
    if (result.isConfirmed) {
        await ejecutarEliminacionUsuario(usuarioId, nombreUsuario);
    }
}

// ✅ EJECUTAR ELIMINACIÓN DE USUARIO (ACTUALIZADA - CORREGIDA)
async function ejecutarEliminacionUsuario(usuarioId, nombreUsuario) {
    try {
        console.log(`🗑️ Ejecutando eliminación del usuario: ${usuarioId}`);
        
        // Mostrar loading
        Swal.fire({
            title: 'Eliminando usuario...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch(`/api/usuarios/${usuarioId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });
        
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        let resultado;
        
        if (contentType && contentType.includes('application/json')) {
            resultado = await response.json();
        } else {
            resultado = { message: 'Usuario eliminado correctamente' };
        }
        
        if (!response.ok) {
            throw new Error(resultado.error || resultado.message || `Error ${response.status}`);
        }
        
        console.log('✅ Usuario eliminado:', resultado);
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Usuario eliminado!',
            html: `
                <p>El usuario <strong>${nombreUsuario}</strong> ha sido eliminado correctamente del sistema.</p>
            `,
            confirmButtonText: 'Aceptar'
        });
        
        // Cerrar modal
        cerrarModalEliminarUsuario();
        
        // Recargar la lista de usuarios
        if (typeof recargarListaUsuarios === 'function') {
            recargarListaUsuarios();
        } else if (typeof cargarUsuarios === 'function') {
            cargarUsuarios();
        }
        
        // Recargar estadísticas
        if (typeof cargarEstadisticas === 'function') {
            cargarEstadisticas();
        }
        
    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        Swal.close();
        
        // Mostrar error específico
        let mensajeError = 'Error al eliminar el usuario: ' + error.message;
        
        if (error.message.includes('denuncias') || error.message.includes('asociadas')) {
            mensajeError = `
                <p>No se puede eliminar el usuario <strong>${nombreUsuario}</strong> porque tiene denuncias asociadas en el sistema.</p>
                <p class="text-muted">Para eliminar este usuario, primero debe reasignar o eliminar sus denuncias asociadas.</p>
            `;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            html: mensajeError,
            confirmButtonText: 'Aceptar'
        });
    }
}

// ✅ ELIMINAR USUARIO DESDE LA LISTA (ACTUALIZADA - CORREGIDA)
function eliminarUsuarioDesdeLista(usuarioId) {
    console.log('🗑️ Eliminando usuario desde lista:', usuarioId);
    
    // Buscar usuario en la lista actual
    const usuario = todosLosUsuariosEliminar.find(u => u.id_usuario === usuarioId) || 
                   todosLosUsuarios.find(u => u.id_usuario === usuarioId);
    
    if (!usuario) {
        mostrarError('No se pudo encontrar la información del usuario');
        return;
    }
    
    const rolId = usuario.id_rol;
    const rolNombre = getRolNombre(rolId);
    const nombreUsuario = `${usuario.nombre_usuario} ${usuario.apellido_pat_usuario}`;
    
    // Usar SweetAlert2 para confirmación directa
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

// ✅ FUNCIONES DE UTILIDAD PARA ROLES (NUEVAS)
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

// ✅ FUNCIONES DE UTILIDAD
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonText: 'Aceptar'
    });
}

// ✅ EXPORTAR FUNCIONES PARA USO GLOBAL
window.abrirModalEliminarUsuario = abrirModalEliminarUsuario;
window.cerrarModalEliminarUsuario = cerrarModalEliminarUsuario;
window.buscarUsuariosEliminar = buscarUsuariosEliminar;
window.seleccionarUsuarioEliminar = seleccionarUsuarioEliminar;
window.confirmarEliminarUsuario = confirmarEliminarUsuario;
window.eliminarUsuarioDesdeLista = eliminarUsuarioDesdeLista;