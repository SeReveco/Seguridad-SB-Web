// 👥 SISTEMA PARA AGREGAR NUEVOS USUARIOS (VERSIÓN MEJORADA CON FORMATEO DE NOMBRES)

// Variables globales para agregar usuario
let rolesDisponibles = [];
let turnosDisponibles = [];

// ✅ INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Módulo de agregar usuarios inicializado');
    agregarEstilosCorreoGenerado();
    inicializarEventListenersAgregar();
});

// ✅ INICIALIZAR EVENT LISTENERS
function inicializarEventListenersAgregar() {
    // Validación en tiempo real de contraseñas
    const passwordInput = document.getElementById('password-usuario');
    const confirmPasswordInput = document.getElementById('confirmar-password');
    
    if (passwordInput && confirmPasswordInput) {
        passwordInput.addEventListener('input', actualizarIndicadorPassword);
        confirmPasswordInput.addEventListener('input', actualizarIndicadorPassword);
    }
    
    // Formatear RUT automáticamente
    const rutInput = document.getElementById('rut-usuario');
    if (rutInput) {
        rutInput.addEventListener('input', formatearRUT);
        rutInput.addEventListener('blur', validarRUTEnTiempoReal);
    }
    
    // Formatear teléfono
    const telefonoInput = document.getElementById('telefono-usuario');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', formatearTelefonoChileno);
        telefonoInput.addEventListener('blur', validarTelefonoEnTiempoReal);
    }

    // Filtrar turnos cuando cambie el rol
    const rolSelect = document.getElementById('rol-usuario');
    if (rolSelect) {
        rolSelect.addEventListener('change', filtrarTurnosPorRol);
    }

    // ✅ NUEVO: Formatear nombres y apellidos automáticamente
    const nombreInput = document.getElementById('nombre-usuario');
    const apellidoPatInput = document.getElementById('apellido-pat-usuario');
    const apellidoMatInput = document.getElementById('apellido-mat-usuario');
    
    if (nombreInput) {
        nombreInput.addEventListener('blur', formatearNombrePropio);
        nombreInput.addEventListener('input', mostrarCorreoGenerado);
    }
    
    if (apellidoPatInput) {
        apellidoPatInput.addEventListener('blur', formatearNombrePropio);
        apellidoPatInput.addEventListener('input', mostrarCorreoGenerado);
    }
    
    if (apellidoMatInput) {
        apellidoMatInput.addEventListener('blur', formatearNombrePropio);
    }
}

// ✅ FUNCIÓN PARA FORMATEAR NOMBRES PROPIOS (Primera letra mayúscula, resto minúscula)
function formatearNombrePropio(e) {
    const input = e.target;
    const valor = input.value.trim();
    
    if (valor) {
        // Formatear: Primera letra mayúscula, resto minúsculas
        const valorFormateado = valor.toLowerCase()
            .split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(' ');
        
        input.value = valorFormateado;
        
        // Mostrar mensaje de formateo
        mostrarMensajeFormateo(input);
    }
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJE DE FORMATEO
function mostrarMensajeFormateo(input) {
    // Remover mensaje anterior si existe
    const idMensaje = `mensaje-formateo-${input.id}`;
    const mensajeAnterior = document.getElementById(idMensaje);
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
    
    // Crear nuevo mensaje
    const mensaje = document.createElement('div');
    mensaje.id = idMensaje;
    mensaje.style.cssText = `
        font-size: 0.7em;
        color: #6f42c1;
        margin-top: 3px;
        font-style: italic;
    `;
    mensaje.innerHTML = '<i class="fa-solid fa-magic"></i> Formateado automáticamente';
    
    // Insertar después del input
    input.parentNode.appendChild(mensaje);
    
    // Remover mensaje después de 2 segundos
    setTimeout(() => {
        if (mensaje.parentNode) {
            mensaje.remove();
        }
    }, 2000);
}

// ✅ FUNCIÓN PARA MOSTRAR CORREO GENERADO
function mostrarCorreoGenerado() {
    const nombre = document.getElementById('nombre-usuario').value.trim();
    const apellidoPat = document.getElementById('apellido-pat-usuario').value.trim();
    
    const correoDisplay = document.getElementById('correo-generado-display');
    
    if (nombre && apellidoPat) {
        const correoGenerado = generarCorreo(nombre, apellidoPat);
        
        if (!correoDisplay) {
            // Crear display del correo si no existe
            const formRow = document.querySelector('.form-row:has(#telefono-usuario)');
            const correoHTML = `
                <div class="form-group">
                    <label>Correo Electrónico:</label>
                    <div id="correo-generado-display" class="correo-generado">
                        <strong>${correoGenerado}</strong>
                        <small><i class="fa-solid fa-robot"></i> Generado automáticamente</small>
                    </div>
                </div>
            `;
            if (formRow) {
                formRow.insertAdjacentHTML('afterend', correoHTML);
            }
        } else {
            // Actualizar correo existente
            correoDisplay.innerHTML = `
                <strong>${correoGenerado}</strong>
                <small><i class="fa-solid fa-robot"></i> Generado automáticamente</small>
            `;
            correoDisplay.closest('.form-group').style.display = 'block';
        }
    } else if (correoDisplay) {
        // Ocultar si no hay datos suficientes
        correoDisplay.closest('.form-group').style.display = 'none';
    }
}

// ✅ FUNCIÓN PARA GENERAR CORREO
function generarCorreo(nombre, apellidoPat) {
    // Limpiar y normalizar textos
    const nombreLimpio = limpiarTexto(nombre);
    const apellidoLimpio = limpiarTexto(apellidoPat);
    
    // Tomar primera letra del nombre y apellido completo
    const primeraLetraNombre = nombreLimpio.charAt(0).toLowerCase();
    const apellidoCompleto = apellidoLimpio.toLowerCase();
    
    // Generar correo
    return `${primeraLetraNombre}${apellidoCompleto}@sanbernardo.cl`;
}

// ✅ FUNCIÓN PARA LIMPIAR TEXTO
function limpiarTexto(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z\s]/g, '')
        .replace(/\s+/g, '')
        .trim();
}

// ✅ ABRIR MODAL DE AGREGAR USUARIO
async function abrirModalAgregarUsuario() {
    console.log('👤 Abriendo modal para agregar usuario...');
    
    try {
        document.getElementById('modal-agregar-usuario').style.display = 'block';
        resetearFormularioAgregar();
        await cargarDatosInicialesAgregar();
        console.log('✅ Modal de agregar usuario listo');
        
    } catch (error) {
        console.error('❌ Error al abrir modal de agregar usuario:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    }
}

// ✅ CERRAR MODAL AGREGAR
function cerrarModalAgregarUsuario() {
    console.log('❌ Cerrando modal de agregar usuario...');
    document.getElementById('modal-agregar-usuario').style.display = 'none';
}

// ✅ RESETEAR FORMULARIO AGREGAR
function resetearFormularioAgregar() {
    console.log('🔄 Reseteando formulario de agregar usuario...');
    
    document.getElementById('form-agregar-usuario').reset();
    
    // Ocultar display de correo
    const correoDisplay = document.getElementById('correo-generado-display');
    if (correoDisplay) {
        correoDisplay.closest('.form-group').style.display = 'none';
    }
    
    // Remover mensajes de formateo
    document.querySelectorAll('[id^="mensaje-formateo-"]').forEach(mensaje => {
        mensaje.remove();
    });
    
    // Resetear indicadores de contraseña
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.password-strength small');
    const matchText = document.querySelector('.password-match small');
    
    if (strengthBar) strengthBar.style.width = '0%';
    if (strengthBar) strengthBar.style.backgroundColor = '#6c757d';
    if (strengthText) strengthText.textContent = 'La contraseña debe tener al menos 8 caracteres';
    if (strengthText) strengthText.style.color = '#6c757d';
    if (matchText) matchText.textContent = 'Las contraseñas deben coincidir';
    if (matchText) matchText.style.color = '#6c757d';
}

// ✅ CARGAR DATOS INICIALES PARA AGREGAR
async function cargarDatosInicialesAgregar() {
    try {
        console.log('📥 Cargando datos para formulario de agregar usuario...');
        
        rolesDisponibles = [
            { id: 1, nombre: 'Administrador' },
            { id: 2, nombre: 'Operador' },
            { id: 3, nombre: 'Supervisor' },
            { id: 4, nombre: 'Inspector' }
        ];
        
        console.log('✅ Datos para agregar usuario cargados correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando datos para agregar:', error);
        throw error;
    }
}

// ✅ GUARDAR NUEVO USUARIO (VERSIÓN MEJORADA)
async function guardarUsuario(event) {
    event.preventDefault();
    console.log('💾 Intentando guardar nuevo usuario...');
    
    if (!validarFormularioAgregarUsuario()) {
        console.error('❌ Validación de formulario falló');
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Creando usuario...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Obtener datos del formulario (ya formateados automáticamente)
        const telefonoLimpio = document.getElementById('telefono-usuario').value.replace(/[^0-9]/g, '');
        const soloNumerosTelefono = telefonoLimpio.startsWith('56') ? telefonoLimpio.substring(2) : telefonoLimpio;
        
        const nombre = document.getElementById('nombre-usuario').value.trim();
        const apellidoPat = document.getElementById('apellido-pat-usuario').value.trim();
        const apellidoMat = document.getElementById('apellido-mat-usuario').value.trim();
        
        // ✅ GENERAR CORREO AUTOMÁTICAMENTE
        const correoGenerado = generarCorreo(nombre, apellidoPat);
        
        const datosUsuario = {
            nombre_usuario: nombre,
            apellido_pat_usuario: apellidoPat,
            apellido_mat_usuario: apellidoMat,
            rut_usuario: document.getElementById('rut-usuario').value.replace(/[^0-9kK]/g, '').toUpperCase(),
            telefono_movil_usuario: soloNumerosTelefono,
            correo_electronico_usuario: correoGenerado,
            password: document.getElementById('password-usuario').value,
            id_rol: parseInt(document.getElementById('rol-usuario').value),
            id_turno: document.getElementById('turno-usuario').value ? parseInt(document.getElementById('turno-usuario').value) : null,
            estado_usuario: document.getElementById('estado-usuario').value === '1'
        };
        
        console.log('📤 Datos del usuario a guardar:', datosUsuario);
        
        // Hacer la petición POST a la API
        const response = await fetch('/api/usuarios/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(datosUsuario)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        const usuarioCreado = await response.json();
        console.log('✅ Usuario creado:', usuarioCreado);
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar éxito con el correo generado
        mostrarExito(`Usuario creado correctamente<br><small>Correo: ${correoGenerado}</small>`);
        
        // Cerrar modal
        cerrarModalAgregarUsuario();
        
        // Recargar la lista de usuarios
        if (typeof recargarListaUsuarios === 'function') {
            recargarListaUsuarios();
        }
        
    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        Swal.close();
        mostrarError('Error al crear el usuario: ' + error.message);
    }
}

// ✅ VALIDAR FORMULARIO COMPLETO (MEJORADO)
function validarFormularioAgregarUsuario() {
    const nombre = document.getElementById('nombre-usuario').value.trim();
    const apellidoPat = document.getElementById('apellido-pat-usuario').value.trim();
    const apellidoMat = document.getElementById('apellido-mat-usuario').value.trim();
    const rut = document.getElementById('rut-usuario').value;
    const telefono = document.getElementById('telefono-usuario').value.replace(/[^0-9]/g, '');
    const password = document.getElementById('password-usuario').value;
    const confirmar = document.getElementById('confirmar-password').value;
    const rol = document.getElementById('rol-usuario').value;
    
    let valido = true;
    let mensajesError = [];
    
    // Validar campos requeridos
    if (!nombre || !apellidoPat || !apellidoMat || !rut || !telefono || !password || !confirmar || !rol) {
        mensajesError.push('Todos los campos obligatorios deben estar completos');
        valido = false;
    }
    
    // Validar RUT
    if (rut && !validarRUT(rut)) {
        mensajesError.push('El RUT ingresado no es válido');
        valido = false;
    }
    
    // Validar teléfono
    const soloNumerosTelefono = telefono.startsWith('56') ? telefono.substring(2) : telefono;
    const regexTelefonoChileno = /^9[0-9]{8}$/;
    
    if (telefono && !regexTelefonoChileno.test(soloNumerosTelefono)) {
        mensajesError.push('El teléfono debe tener formato chileno: 9 1234 5678');
        valido = false;
    }
    
    // Validar contraseñas
    if (password !== confirmar) {
        mensajesError.push('Las contraseñas no coinciden');
        valido = false;
    }
    
    if (password.length < 8) {
        mensajesError.push('La contraseña debe tener al menos 8 caracteres');
        valido = false;
    }
    
    // Validar formato de nombres (solo letras y espacios)
    const regexSoloLetras = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
    if (nombre && !regexSoloLetras.test(nombre)) {
        mensajesError.push('El nombre solo puede contener letras y espacios');
        valido = false;
    }
    
    if (apellidoPat && !regexSoloLetras.test(apellidoPat)) {
        mensajesError.push('El apellido paterno solo puede contener letras y espacios');
        valido = false;
    }
    
    if (apellidoMat && !regexSoloLetras.test(apellidoMat)) {
        mensajesError.push('El apellido materno solo puede contener letras y espacios');
        valido = false;
    }
    
    if (!valido) {
        mostrarError(mensajesError.join('<br>'));
    }
    
    return valido;
}

// ✅ VALIDAR RUT CHILENO
function validarRUT(rut) {
    if (!rut || typeof rut !== 'string') return false;
    
    // Limpiar RUT y convertir a mayúsculas
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rut.length < 2) return false;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    
    // Validar que el cuerpo sean solo números
    if (!/^\d+$/.test(cuerpo)) return false;
    
    // Calcular DV
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dvCalculado === dv;
}

// ✅ FORMATEAR RUT CHILENO
function formatearRUT(e) {
    let input = e.target;
    let value = input.value.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (value.length === 0) return;
    
    // Separar cuerpo y dígito verificador
    let cuerpo = value.slice(0, -1);
    let dv = value.slice(-1);
    
    // Formatear cuerpo con puntos
    if (cuerpo.length > 0) {
        cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    // Unir cuerpo y DV con guión
    input.value = cuerpo + (dv ? '-' + dv : '');
}

// ✅ VALIDAR RUT EN TIEMPO REAL
function validarRUTEnTiempoReal(e) {
    const input = e.target;
    const rut = input.value;
    const errorElement = document.getElementById('rut-error') || crearElementoError(input, 'rut-error');
    
    if (!rut) {
        ocultarError(errorElement);
        return;
    }
    
    if (!validarRUT(rut)) {
        mostrarErrorInput(input, errorElement, 'El RUT ingresado no es válido');
    } else {
        ocultarError(errorElement);
        input.style.borderColor = '#28a745';
    }
}

// ✅ FORMATEAR TELÉFONO CHILENO
function formatearTelefonoChileno(e) {
    let input = e.target;
    let value = input.value.replace(/[^0-9]/g, '');
    
    // Si empieza con 9, asumimos que es chileno y agregamos +56
    if (value.startsWith('9') && value.length >= 9) {
        value = '56' + value;
    }
    
    // Limitar a 11 dígitos (9 + 56)
    value = value.substring(0, 11);
    
    // Formatear: +56 9 1234 5678
    let formatted = '';
    if (value.length > 0) {
        formatted = '+';
        if (value.length > 0) formatted += value.substring(0, 2); // 56
        if (value.length > 2) formatted += ' ' + value.substring(2, 3); // 9
        if (value.length > 3) formatted += ' ' + value.substring(3, 7); // 1234
        if (value.length > 7) formatted += ' ' + value.substring(7, 11); // 5678
    }
    
    input.value = formatted;
}

// ✅ VALIDAR TELÉFONO EN TIEMPO REAL
function validarTelefonoEnTiempoReal(e) {
    const input = e.target;
    const telefono = input.value.replace(/[^0-9]/g, '');
    const errorElement = document.getElementById('telefono-error') || crearElementoError(input, 'telefono-error');
    
    if (!telefono) {
        ocultarError(errorElement);
        return;
    }
    
    // Validar formato chileno: 9XXXXXXXX
    const regexChileno = /^9[0-9]{8}$/;
    const soloNumeros = telefono.startsWith('56') ? telefono.substring(2) : telefono;
    
    if (!regexChileno.test(soloNumeros)) {
        mostrarErrorInput(input, errorElement, 'El teléfono debe tener formato: 9 1234 5678');
    } else {
        ocultarError(errorElement);
        input.style.borderColor = '#28a745';
    }
}

// ✅ VALIDAR CONTRASEÑA
function validarPassword(password) {
    const fortaleza = {
        longitud: password.length >= 8,
        mayuscula: /[A-Z]/.test(password),
        minuscula: /[a-z]/.test(password),
        numero: /[0-9]/.test(password),
        especial: /[^A-Za-z0-9]/.test(password)
    };
    
    const criteriosCumplidos = Object.values(fortaleza).filter(Boolean).length;
    let fuerza = 0;
    let mensaje = '';
    let color = '';
    
    if (criteriosCumplidos <= 2) {
        fuerza = 33;
        mensaje = 'Débil';
        color = '#dc3545';
    } else if (criteriosCumplidos <= 4) {
        fuerza = 66;
        mensaje = 'Media';
        color = '#ffc107';
    } else {
        fuerza = 100;
        mensaje = 'Fuerte';
        color = '#28a745';
    }
    
    return { fuerza, mensaje, color, fortaleza };
}

// ✅ ACTUALIZAR INDICADOR DE CONTRASEÑA
function actualizarIndicadorPassword() {
    const password = document.getElementById('password-usuario').value;
    const confirmar = document.getElementById('confirmar-password').value;
    
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.password-strength small');
    const matchText = document.querySelector('.password-match small');
    
    if (!strengthBar || !strengthText || !matchText) return;
    
    // Validar fortaleza
    if (password) {
        const validacion = validarPassword(password);
        strengthBar.style.width = validacion.fuerza + '%';
        strengthBar.style.backgroundColor = validacion.color;
        strengthText.textContent = `Fortaleza: ${validacion.mensaje}`;
        strengthText.style.color = validacion.color;
    } else {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#6c757d';
        strengthText.textContent = 'La contraseña debe tener al menos 8 caracteres';
        strengthText.style.color = '#6c757d';
    }
    
    // Validar coincidencia
    if (confirmar) {
        if (password === confirmar) {
            matchText.textContent = '✓ Las contraseñas coinciden';
            matchText.style.color = '#28a745';
        } else {
            matchText.textContent = '✗ Las contraseñas no coinciden';
            matchText.style.color = '#dc3545';
        }
    } else {
        matchText.textContent = 'Las contraseñas deben coincidir';
        matchText.style.color = '#6c757d';
    }
}

// ✅ FILTRAR TURNOS SEGÚN ROL
function filtrarTurnosPorRol() {
    const rolSelect = document.getElementById('rol-usuario');
    const turnoSelect = document.getElementById('turno-usuario');
    
    if (!rolSelect || !turnoSelect) return;
    
    const rolSeleccionado = parseInt(rolSelect.value);
    const turnoActual = turnoSelect.value;
    
    // Mostrar todos los turnos temporalmente
    for (let i = 0; i < turnoSelect.options.length; i++) {
        turnoSelect.options[i].style.display = '';
        turnoSelect.options[i].disabled = false;
    }
    
    // ✅ ACTUALIZADO: Si es Inspector (rol 4), mostrar solo turnos de inspectores
    if (rolSeleccionado === 4) {
        for (let i = 0; i < turnoSelect.options.length; i++) {
            const option = turnoSelect.options[i];
            const value = parseInt(option.value);
            // Mostrar solo turnos 4 y 5 (inspectores)
            if (value !== 4 && value !== 5 && value !== '') {
                option.style.display = 'none';
                option.disabled = true;
            }
        }
        // Si el turno actual no es válido para inspector, resetear
        if (turnoActual && turnoActual !== '4' && turnoActual !== '5') {
            turnoSelect.value = '';
        }
    }
    // ✅ ACTUALIZADO: Para otros roles (1, 2, 3), mostrar solo turnos generales
    else if (rolSeleccionado) {
        for (let i = 0; i < turnoSelect.options.length; i++) {
            const option = turnoSelect.options[i];
            const value = parseInt(option.value);
            // Mostrar solo turnos 1, 2, 3 (generales)
            if (value !== 1 && value !== 2 && value !== 3 && value !== '') {
                option.style.display = 'none';
                option.disabled = true;
            }
        }
        // Si el turno actual no es válido, resetear
        if (turnoActual && turnoActual !== '1' && turnoActual !== '2' && turnoActual !== '3') {
            turnoSelect.value = '';
        }
    }
}

// ✅ FUNCIONES AUXILIARES PARA MANEJO DE ERRORES
function crearElementoError(input, id) {
    const errorElement = document.createElement('div');
    errorElement.id = id;
    errorElement.className = 'error-message';
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '0.8em';
    errorElement.style.marginTop = '5px';
    errorElement.style.display = 'none';
    
    input.parentNode.appendChild(errorElement);
    return errorElement;
}

function mostrarErrorInput(input, errorElement, mensaje) {
    input.style.borderColor = '#dc3545';
    errorElement.textContent = mensaje;
    errorElement.style.display = 'block';
}

function ocultarError(errorElement) {
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// ✅ AGREGAR ESTILOS CSS PARA EL CORREO GENERADO Y MENSAJES
function agregarEstilosCorreoGenerado() {
    const styles = `
        .correo-generado {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            padding: 12px;
            margin-top: 8px;
        }
        .correo-generado strong {
            color: #28a745;
            font-size: 14px;
            display: block;
        }
        .correo-generado small {
            color: #6c757d;
            display: block;
            margin-top: 5px;
            font-style: italic;
        }
        .correo-generado i {
            color: #6f42c1;
            margin-right: 5px;
        }
        .error-message {
            color: #dc3545;
            font-size: 0.8em;
            margin-top: 5px;
        }
    `;
    
    if (!document.getElementById('estilos-correo-generado')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'estilos-correo-generado';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
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
        html: mensaje,
        confirmButtonText: 'Aceptar'
    });
}

function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        html: mensaje,
        confirmButtonText: 'Aceptar',
        timer: 3000
    });
}