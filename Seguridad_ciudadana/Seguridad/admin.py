from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Roles, Turnos, TiposVehiculos, Usuario, Vehiculos,
    AsignacionRadio, AsignacionVehiculo, Radio,
    FamiliaDenuncia, GrupoDenuncia, SubgrupoDenuncia, Requerimiento,
    ServiciosEmergencia, Denuncia, DerivacionesDenuncia, MovilesDenuncia,
    AsignacionDerivacionEmergencia, Ciudadano, SolicitudCiudadano,
    SolicitudTrabajador, DocumentoSolicitud, Fiscalizacion, EstadoVehiculo, DenunciaImagen
)


# ---------- UsuarioAdmin (mantener lógica original) ----------
class UsuarioAdmin(UserAdmin):
    list_display = ('rut_usuario', 'nombre_usuario', 'apellido_pat_usuario', 'correo_electronico_usuario', 'id_rol', 'id_turno', 'is_active')
    list_filter = ('id_rol', 'id_turno', 'is_active')
    search_fields = ('rut_usuario', 'nombre_usuario', 'apellido_pat_usuario', 'correo_electronico_usuario')
    ordering = ('apellido_pat_usuario', 'nombre_usuario')

    fieldsets = (
        (None, {'fields': ('rut_usuario', 'correo_electronico_usuario', 'password')}),
        ('Información Personal', {'fields': ('nombre_usuario', 'apellido_pat_usuario', 'apellido_mat_usuario', 'telefono_movil_usuario')}),
        ('Permisos', {'fields': ('id_rol', 'id_turno', 'is_active')}),
        ('Fechas importantes', {'fields': ('last_login', 'fecha_creacion', 'fecha_actualizacion')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('rut_usuario', 'nombre_usuario', 'apellido_pat_usuario', 'correo_electronico_usuario', 'password1', 'password2', 'id_rol', 'id_turno'),
        }),
    )

    readonly_fields = ('fecha_creacion', 'fecha_actualizacion', 'last_login')
    filter_horizontal = ()


# ---------- Vehiculos ----------
class VehiculosAdmin(admin.ModelAdmin):
    list_display = ('patente_vehiculo', 'marca_vehiculo', 'modelo_vehiculo', 'total_kilometraje', 'id_estado_vehiculo', 'id_tipo_vehiculo')
    list_filter = ('id_estado_vehiculo', 'id_tipo_vehiculo')
    search_fields = ('patente_vehiculo', 'marca_vehiculo', 'modelo_vehiculo')
    readonly_fields = ('total_kilometraje',)


# ---------- AsignacionVehiculo ----------
class AsignacionVehiculoAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'id_vehiculo', 'fecha_asignacion', 'kilometraje_inicial', 'kilometraje_recorrido', 'kilometraje_total', 'activo', 'fecha_creacion')  # AÑADIR 'activo'
    list_filter = ('fecha_asignacion', 'id_vehiculo', 'activo')
    search_fields = ('id_usuario__nombre_usuario', 'id_vehiculo__patente_vehiculo')
    readonly_fields = ('kilometraje_total',)


# ---------- Registros simples ----------
admin.site.register(Roles)
admin.site.register(Turnos)
admin.site.register(TiposVehiculos)
admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Vehiculos, VehiculosAdmin)
admin.site.register(Radio)
admin.site.register(Ciudadano)
admin.site.register(EstadoVehiculo)


# ---------- Asignaciones ----------
class AsignacionRadioAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'id_radio', 'fecha_asignacion', 'fecha_creacion', 'fecha_devolucion')
    list_filter = ('fecha_asignacion', 'id_radio')
    search_fields = ('id_usuario__nombre_usuario', 'id_radio__nombre_radio')

admin.site.register(AsignacionRadio, AsignacionRadioAdmin)
admin.site.register(AsignacionVehiculo, AsignacionVehiculoAdmin)


# ---------- Estructura de denuncias ----------
class GrupoDenunciaInline(admin.TabularInline):
    model = GrupoDenuncia
    extra = 1

class SubgrupoDenunciaInline(admin.TabularInline):
    model = SubgrupoDenuncia
    extra = 1

class RequerimientoInline(admin.TabularInline):
    model = Requerimiento
    extra = 1

class FamiliaDenunciaAdmin(admin.ModelAdmin):
    inlines = [GrupoDenunciaInline]
    list_display = ('nombre_familia_denuncia', 'codigo_familia')
    search_fields = ('nombre_familia_denuncia', 'codigo_familia')

class GrupoDenunciaAdmin(admin.ModelAdmin):
    inlines = [SubgrupoDenunciaInline]
    list_display = ('nombre_grupo_denuncia', 'codigo_grupo', 'id_familia_denuncia')
    list_filter = ('id_familia_denuncia',)
    search_fields = ('nombre_grupo_denuncia', 'codigo_grupo')

class SubgrupoDenunciaAdmin(admin.ModelAdmin):
    inlines = [RequerimientoInline]
    list_display = ('nombre_subgrupo_denuncia', 'codigo_subgrupo', 'id_grupo_denuncia')
    list_filter = ('id_grupo_denuncia__id_familia_denuncia', 'id_grupo_denuncia')
    search_fields = ('nombre_subgrupo_denuncia', 'codigo_subgrupo')

class RequerimientoAdmin(admin.ModelAdmin):
    list_display = ('nombre_requerimiento', 'codigo_requerimiento', 'clasificacion_requerimiento', 'id_subgrupo_denuncia')
    list_filter = ('clasificacion_requerimiento', 'id_subgrupo_denuncia__id_grupo_denuncia__id_familia_denuncia')
    search_fields = ('nombre_requerimiento', 'codigo_requerimiento')

admin.site.register(FamiliaDenuncia, FamiliaDenunciaAdmin)
admin.site.register(GrupoDenuncia, GrupoDenunciaAdmin)
admin.site.register(SubgrupoDenuncia, SubgrupoDenunciaAdmin)
admin.site.register(Requerimiento, RequerimientoAdmin)
admin.site.register(ServiciosEmergencia)


# ---------- Denuncias, derivaciones y móviles ----------
class DerivacionesDenunciaInline(admin.TabularInline):
    model = DerivacionesDenuncia
    extra = 1

class MovilesDenunciaInline(admin.TabularInline):
    model = MovilesDenuncia
    extra = 1

class DenunciaImagenInline(admin.TabularInline):      # ⬅️ NUEVO
    model = DenunciaImagen
    extra = 1

class AsignacionDerivacionEmergenciaInline(admin.TabularInline):
    model = AsignacionDerivacionEmergencia
    extra = 1

class DenunciaAdmin(admin.ModelAdmin):
    list_display = ('id_denuncia', 'fecha_denuncia', 'id_usuario', 'id_ciudadano', 'id_requerimiento', 'estado_denuncia')
    list_filter = ('fecha_denuncia', 'estado_denuncia', 'id_requerimiento__clasificacion_requerimiento')
    search_fields = ('id_usuario__nombre_usuario', 'id_ciudadano__nombre_ciudadano', 'direccion_denuncia', 'detalle_denuncia')
    readonly_fields = ('fecha_creacion_denuncia', 'fecha_actualizacion_denuncia', 'tiempo_total_procedimiento_denuncia')
    
    inlines = [                 # ⬅️ NUEVO
        DenunciaImagenInline,
        DerivacionesDenunciaInline,
        MovilesDenunciaInline,
    ]

class DerivacionesDenunciaAdmin(admin.ModelAdmin):
    list_display = ('id_derivacion', 'tipo_derivacion', 'hora_derivacion', 'id_denuncia')
    list_filter = ('tipo_derivacion', 'hora_derivacion')
    inlines = [AsignacionDerivacionEmergenciaInline]

class MovilesDenunciaAdmin(admin.ModelAdmin):
    list_display = ('id_movil_denuncia', 'orden_asignacion', 'hora_asignacion', 'id_denuncia', 'id_vehiculo')
    list_filter = ('orden_asignacion', 'hora_asignacion')

admin.site.register(Denuncia, DenunciaAdmin)
admin.site.register(DerivacionesDenuncia, DerivacionesDenunciaAdmin)
admin.site.register(MovilesDenuncia, MovilesDenunciaAdmin)


# ---------- Solicitudes y documentos ----------
class DocumentoSolicitudInline(admin.TabularInline):
    model = DocumentoSolicitud
    extra = 1

class SolicitudCiudadanoAdmin(admin.ModelAdmin):
    list_display = ('id_solicitud', 'nombre_solicitante', 'tipo_solicitante', 'estado_solicitud', 'fecha_creacion')
    list_filter = ('estado_solicitud', 'tipo_solicitante', 'fecha_creacion')
    search_fields = ('nombre_solicitante', 'rut_solicitante', 'correo_solicitante')
    inlines = [DocumentoSolicitudInline]

class SolicitudTrabajadorAdmin(admin.ModelAdmin):
    list_display = ('id_solicitud_trabajador', 'nombre_solicitante_trabajador', 'rol_solicitante', 'estado_solicitud_trabajador', 'fecha_creacion_trabajador')
    list_filter = ('estado_solicitud_trabajador', 'rol_solicitante', 'fecha_creacion_trabajador')
    search_fields = ('nombre_solicitante_trabajador', 'rut_solicitante_trabajador')

class DocumentoSolicitudAdmin(admin.ModelAdmin):
    list_display = ('id_documento', 'nombre_archivo', 'tipo_archivo', 'fecha_subida', 'id_solicitud')
    list_filter = ('tipo_archivo', 'fecha_subida')

admin.site.register(SolicitudCiudadano, SolicitudCiudadanoAdmin)
admin.site.register(SolicitudTrabajador, SolicitudTrabajadorAdmin)
admin.site.register(DocumentoSolicitud, DocumentoSolicitudAdmin)


# ---------- Fiscalización ----------
class FiscalizacionAdmin(admin.ModelAdmin):
    list_display = ('id_fiscalizacion', 'tipo_fiscalizacion', 'patente_vehiculo_fiscalizacion', 'nombre_conductor', 'fecha_creacion')
    list_filter = ('tipo_fiscalizacion', 'fecha_creacion')
    search_fields = ('patente_vehiculo_fiscalizacion', 'nombre_conductor', 'rut_conductor')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')

admin.site.register(Fiscalizacion, FiscalizacionAdmin)
