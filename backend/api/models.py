from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import hashlib



# ─────────────────────────────────────────
# USUARIO
# ─────────────────────────────────────────
class Usuario(models.Model):
    id = models.AutoField(primary_key=True)

    class Meta:
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"Usuario #{self.id}"


# ─────────────────────────────────────────
# ESTUDIANTE
# ─────────────────────────────────────────
class Estudiante(models.Model):

    TIPO_TDAH_CHOICES = [
        ("Combinado", "Combinado"),
        ("Inatento", "Inatento"),
        ("Hiperactivo", "Hiperactivo"),
    ]

    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    edad = models.IntegerField()
    grado = models.CharField(max_length=100)
    tipo_tdah = models.CharField(max_length=20, choices=TIPO_TDAH_CHOICES)
    fortalezas = models.JSONField(default=list)          # text[]
    atencion_promedio = models.IntegerField(default=0)
    puntaje_participacion = models.IntegerField(default=0)
    profesor = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estudiantes",
        db_column="profesor_id",
    )

    class Meta:
        db_table = "estudiante"
        verbose_name = "Estudiante"
        verbose_name_plural = "Estudiantes"

    def __str__(self):
        return self.nombre


# ─────────────────────────────────────────
# MATERIAL ADAPTADO
# ─────────────────────────────────────────
class MaterialAdaptado(models.Model):

    DIFICULTAD_CHOICES = [
        ("Basico", "Básico"),
        ("Intermedio", "Intermedio"),
        ("Avanzado", "Avanzado"),
    ]

    id = models.AutoField(primary_key=True)
    estudiante = models.ForeignKey(
        Estudiante,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="materiales",
        db_column="estudiante_id",
    )
    tema = models.CharField(max_length=255)
    tipo_material = models.CharField(max_length=100)
    dificultad = models.CharField(max_length=15, choices=DIFICULTAD_CHOICES)
    contenido_markdown = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "material_adaptado"
        verbose_name = "Material Adaptado"
        verbose_name_plural = "Materiales Adaptados"

    def __str__(self):
        return f"{self.tema} ({self.dificultad})"


# ─────────────────────────────────────────
# ENTRADA BITÁCORA
# ─────────────────────────────────────────
class EntradaBitacora(models.Model):

    CATEGORIA_CHOICES = [
        ("Alta agitacion", "Alta agitación"),
        ("Logro positivo", "Logro positivo"),
        ("Ajuste de entorno", "Ajuste de entorno"),
    ]

    id = models.AutoField(primary_key=True)
    estudiante = models.ForeignKey(
        Estudiante,
        on_delete=models.CASCADE,
        related_name="entradas_bitacora",
        db_column="estudiante_id",
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    puntaje_atencion = models.IntegerField(
        default=0,
        help_text="Valor entre 0 y 100",
    )

    class Meta:
        db_table = "entrada_bitacora"
        verbose_name = "Entrada de Bitácora"
        verbose_name_plural = "Entradas de Bitácora"
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.titulo} — {self.estudiante.nombre}"


# ─────────────────────────────────────────
# ESTRATEGIA
# ─────────────────────────────────────────
class Estrategia(models.Model):

    CATEGORIA_CHOICES = [
        ("atencion", "Atención"),
        ("impulsividad", "Impulsividad"),
        ("organizacion", "Organización"),
        ("evaluacion", "Evaluación"),
        ("transiciones", "Transiciones"),
    ]

    id = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=255)
    emoji = models.CharField(max_length=10, default="📌")
    categorias = models.JSONField(default=list)  # ["atencion", "energia"] — múltiples
    descripcion = models.TextField()
    pasos_markdown = models.TextField(blank=True, default="")  # Markdown ingresado manualmente
    tasa_eficacia = models.IntegerField(default=0)             # 0-100
    etiqueta_eficacia = models.CharField(max_length=100, default="")  # "92% mejora en atención"
    tiempo_setup = models.CharField(max_length=50, blank=True, default="")  # "5 min setup"
    contexto = models.CharField(max_length=100, blank=True, default="")     # "Aula y casa"
    sugerida_por_ia = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "estrategia"
        verbose_name = "Estrategia"
        verbose_name_plural = "Estrategias"
        ordering = ["-tasa_eficacia"]

    def __str__(self):
        return self.titulo



class AnalisisBitacora(models.Model):
    estudiante  = models.OneToOneField(
        Estudiante,
        on_delete=models.CASCADE,
        related_name='analisis'
    )
    resumen     = models.TextField()
    patron      = models.TextField()
    sugerencia  = models.TextField()
    generado_en = models.DateTimeField(auto_now=True)
    entradas_hash = models.CharField(max_length=64)

    class Meta:
        db_table = 'analisis_bitacora'
        verbose_name = 'Análisis de Bitácora'

    def __str__(self):
        return f'Análisis de {self.estudiante.nombre}'

    @staticmethod
    def calcular_hash(entradas_qs):
        """Genera un hash de las entradas actuales del estudiante."""
        data = ''.join(
            f"{e.id}{e.titulo}{e.categoria}{e.puntaje_atencion}{e.creado_en}"
            for e in entradas_qs
        )
        return hashlib.md5(data.encode()).hexdigest()
