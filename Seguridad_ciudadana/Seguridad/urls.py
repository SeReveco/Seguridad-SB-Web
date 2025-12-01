from django.urls import path # type: ignore
from . import views

urlpatterns = [
    path('', views.iniciar_sesion, name='login'),
    path('Logout/', views.cerrar_sesion, name='logout'),
    path('Home/', views.index, name='index'),
    path('Admin/', views.admin_dashboard, name='Admin'),
    path('Admin/requerimientos/', views.admin_requerimientos, name='admin_requerimientos'),
    path('Admin/usuarios/', views.admin_usuarios, name='admin_usuarios'),
    path('Admin/vehiculos/', views.admin_vehiculos, name='admin_vehiculos'),
    path('Admin/radios/', views.admin_radios, name='admin_radios'),
    path('api/asignaciones-vehiculos-web/', views.api_asignaciones_vehiculos_web, name='api_asignaciones_vehiculos_web'),
    path('api/denuncias-web/', views.api_denuncias_web, name='api_denuncias_web'),
    path('api/denuncias-hoy/', views.api_denuncias_hoy, name='api_denuncias_hoy'),
    path('perfil/', views.perfil_usuario, name='perfil_usuario'),
    
    # APIs para requerimientos
    path('api/requerimientos/', views.api_requerimientos, name='api_requerimientos'),
    path('api/requerimientos/<int:requerimiento_id>/', views.api_requerimiento_detalle, name='api_requerimiento_detalle'),
    path('api/requerimientos/<int:requerimiento_id>/ruta/', views.api_requerimiento_ruta_completa, name='api_requerimiento_ruta_completa'),
    
    # APIs para familias, grupos, subgrupos
    path('api/familias/', views.api_familias, name='api_familias'),
    path('api/familias/<int:familia_id>/', views.api_familia_detalle, name='api_familia_detalle'),
    path('api/grupos/', views.api_grupos, name='api_grupos'),
    path('api/grupos/<int:grupo_id>/', views.api_grupo_detalle, name='api_grupo_detalle'),
    path('api/subgrupos/', views.api_subgrupos, name='api_subgrupos'),
    path('api/subgrupos/<int:subgrupo_id>/', views.api_subgrupo_detalle, name='api_subgrupo_detalle'),
    
    # ========== CRUD VEHÍCULOS ==========
    path('vehiculos/', views.listar_vehiculos, name='vehiculos'),
    path('api/vehiculos-web/', views.api_vehiculos_web, name='api_vehiculos_web'),
    path('api/vehiculos-web/crear/', views.api_crear_vehiculo, name='api_crear_vehiculo'),
    path('api/vehiculos-web/<int:vehiculo_id>/editar/', views.api_editar_vehiculo, name='api_editar_vehiculo'),
    path('api/vehiculos-web/<int:vehiculo_id>/eliminar/', views.api_eliminar_vehiculo, name='api_eliminar_vehiculo'),
    path('api/vehiculos-web/<int:vehiculo_id>/obtener/', views.api_obtener_vehiculo, name='api_obtener_vehiculo'),
    path('api/tipos-vehiculos-web/', views.api_tipos_vehiculos_web, name='api_tipos_vehiculos_web'),
    path('api/tipos-vehiculos-web/crear/', views.api_crear_tipo_vehiculo, name='api_crear_tipo_vehiculo'),
    
    # ========== CRUD RADIOS ==========
    path('Admin/radios/', views.admin_radios, name='admin_radios'),
    path('radios/', views.listar_radios, name='radios'),
    path('api/radios-web/', views.api_radios_web, name='api_radios_web'),
    path('api/radios-web/crear/', views.api_crear_radio, name='api_crear_radio'),
    path('api/radios-web/<int:radio_id>/editar/', views.api_editar_radio, name='api_editar_radio'),
    path('api/radios-web/<int:radio_id>/eliminar/', views.api_eliminar_radio, name='api_eliminar_radio'),
    path('api/radios-web/<int:radio_id>/obtener/', views.api_obtener_radio, name='api_obtener_radio'),
    
    # ========== CRUD SERVICIOS EMERGENCIA ==========
    path('Admin/servicios-emergencia/', views.admin_servicios_emergencia, name='admin_servicios_emergencia'),
    path('servicios-emergencia/', views.listar_servicios_emergencia, name='servicios_emergencia'),
    path('api/servicios-emergencia-web/', views.api_servicios_emergencia_web, name='api_servicios_emergencia_web'),
    path('api/servicios-emergencia-web/crear/', views.api_crear_servicio_emergencia, name='api_crear_servicio_emergencia'),
    path('api/servicios-emergencia-web/<int:servicio_id>/editar/', views.api_editar_servicio_emergencia, name='api_editar_servicio_emergencia'),
    path('api/servicios-emergencia-web/<int:servicio_id>/eliminar/', views.api_eliminar_servicio_emergencia, name='api_eliminar_servicio_emergencia'),
    path('api/servicios-emergencia-web/<int:servicio_id>/obtener/', views.api_obtener_servicio_emergencia, name='api_obtener_servicio_emergencia'),
    
    # APIs para usuarios
    path('api/usuarios/', views.api_usuarios, name='api_usuarios'),
    path('api/usuarios/buscar/', views.api_usuarios_buscar, name='api_usuarios_buscar'),
    path('api/usuarios/<int:usuario_id>/', views.api_usuario_detalle, name='api_usuario_detalle'),
    
        # ========== NUEVAS APIs PARA IONIC ==========
    path('ionic/login/', views.api_login_ionic, name='api_login_ionic'),
    path('ionic/register/', views.api_register_ciudadano, name='api_register_ciudadano'),
    path('api/trabajador/datos/<int:usuario_id>/', views.ObtenerDatosTrabajador.as_view(), name='obtener_datos_trabajador'),
    path('api/trabajador/datos/', views.ObtenerDatosTrabajador.as_view(), name='obtener_datos_trabajador_actual'),
    path('api/trabajador/vehiculos/tipo/<int:tipo_vehiculo_id>/', views.ObtenerVehiculosPorTipo.as_view(), name='obtener_vehiculos_por_tipo'),
    path('api/trabajador/vehiculo/cambiar-estado/', views.CambiarEstadoVehiculo.as_view(), name='cambiar_estado_vehiculo'),
    path('api/trabajador/asignaciones/hoy/<int:usuario_id>/', views.VerificarAsignacionesHoy.as_view(), name='verificar_asignaciones_hoy'),

    path('api/trabajador/verificar-turno-activo/<int:usuario_id>/', views.VerificarTurnoActivo.as_view(), name='verificar_turno_activo'),
    path('api/trabajador/turno/iniciar/', views.IniciarTurnoTrabajador.as_view(), name='iniciar_turno_trabajador'),
    path('api/trabajador/turno/finalizar-automatico/', views.FinalizarTurnoAutomatico.as_view(), name='finalizar_turno_automatico'),
    path('api/trabajador/turnos/verificar-finalizar/', views.VerificarTurnosParaFinalizar.as_view(), name='verificar_turnos_finalizar'),
    path('api/trabajador/historial-turnos/<int:usuario_id>/', views.ObtenerHistorialTurnos.as_view(), name='historial_turnos'),
]
