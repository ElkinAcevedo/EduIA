import json
from google import genai
from google.genai import types
from django.conf import settings
from collections import defaultdict

from .models import EntradaBitacora, AnalisisBitacora, Estudiante, Estrategia


# ═══════════════════════════════════════════════════════════════════
# ANÁLISIS DE BITÁCORA 
# ═══════════════════════════════════════════════════════════════════

def _preprocesar_entradas(entradas):
    DIAS = {0:'Lunes',1:'Martes',2:'Miércoles',3:'Jueves',4:'Viernes',5:'Sábado',6:'Domingo'}
    por_dia        = defaultdict(list)
    por_categoria  = defaultdict(int)
    atenciones     = []

    for e in entradas:
        dia = DIAS[e.creado_en.weekday()]
        por_dia[dia].append(e.puntaje_atencion)
        por_categoria[e.categoria] += 1
        if e.puntaje_atencion > 0:
            atenciones.append(e.puntaje_atencion)

    promedio_por_dia = {
        dia: round(sum(vals) / len(vals), 1)
        for dia, vals in por_dia.items()
    }

    return {
        'total_entradas':   len(entradas),
        'promedio_atencion': round(sum(atenciones) / len(atenciones), 1) if atenciones else 0,
        'por_categoria':    dict(por_categoria),
        'promedio_por_dia': promedio_por_dia,
        'titulos':          [e.titulo for e in entradas[:10]],
    }


def _construir_prompt(nombre_estudiante, datos):
    return f"""
Eres un asistente pedagógico especializado en estudiantes con TDAH.
Analiza los siguientes datos de observación del estudiante {nombre_estudiante} y responde SOLO con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.

DATOS:
- Total de entradas registradas: {datos['total_entradas']}
- Promedio general de atención: {datos['promedio_atencion']}%
- Entradas por categoría: {json.dumps(datos['por_categoria'], ensure_ascii=False)}
- Promedio de atención por día de la semana: {json.dumps(datos['promedio_por_dia'], ensure_ascii=False)}
- Títulos de observaciones recientes: {json.dumps(datos['titulos'], ensure_ascii=False)}

Responde ÚNICAMENTE con este JSON (sin markdown, sin texto extra):
{{
  "resumen": "2-3 frases describiendo la tendencia general del estudiante",
  "patron": "1-2 frases describiendo el patrón más relevante detectado en los datos",
  "sugerencia": "1 recomendación pedagógica concreta y accionable para el docente"
}}
"""


def generar_o_recuperar_analisis(estudiante):
    entradas = list(
        EntradaBitacora.objects.filter(estudiante=estudiante).order_by('creado_en')
    )

    UMBRAL_MINIMO = 3
    if len(entradas) < UMBRAL_MINIMO:
        return {
            'insuficiente': True,
            'mensaje': f'Se necesitan al menos {UMBRAL_MINIMO} entradas para generar un análisis. '
                       f'Actualmente hay {len(entradas)}.'
        }

    hash_actual = AnalisisBitacora.calcular_hash(entradas)

    try:
        analisis = AnalisisBitacora.objects.get(estudiante=estudiante)
        if analisis.entradas_hash == hash_actual:
            return {
                'insuficiente': False,
                'resumen':      analisis.resumen,
                'patron':       analisis.patron,
                'sugerencia':   analisis.sugerencia,
                'generado_en':  analisis.generado_en.isoformat(),
                'cached':       True,
            }
    except AnalisisBitacora.DoesNotExist:
        analisis = None

    datos  = _preprocesar_entradas(entradas)
    prompt = _construir_prompt(estudiante.nombre, datos)
    client   = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    texto = response.text.strip()

    if texto.startswith('```'):
        texto = texto.split('```')[1]
        if texto.startswith('json'):
            texto = texto[4:]
    texto = texto.strip()

    resultado = json.loads(texto)

    AnalisisBitacora.objects.update_or_create(
        estudiante=estudiante,
        defaults={
            'resumen':       resultado['resumen'],
            'patron':        resultado['patron'],
            'sugerencia':    resultado['sugerencia'],
            'entradas_hash': hash_actual,
        }
    )

    return {
        'insuficiente': False,
        'resumen':      resultado['resumen'],
        'patron':       resultado['patron'],
        'sugerencia':   resultado['sugerencia'],
        'cached':       False,
    }


# ═══════════════════════════════════════════════════════════════════
# FUNCTION CALLING — herramientas reales que Gemini puede ejecutar
# ═══════════════════════════════════════════════════════════════════

def _tool_buscar_estudiante(nombre: str) -> dict:
    """Busca un estudiante por nombre (búsqueda parcial, insensible a mayúsculas)."""
    qs = Estudiante.objects.filter(nombre__icontains=nombre)
    if not qs.exists():
        return {'encontrado': False, 'mensaje': f'No se encontró ningún estudiante llamado "{nombre}".'}

    if qs.count() > 1:
        opciones = [{'id': e.id, 'nombre': e.nombre} for e in qs]
        return {'encontrado': False, 'multiples': True, 'opciones': opciones}

    e = qs.first()
    return {
        'encontrado': True,
        'id': e.id,
        'nombre': e.nombre,
        'edad': e.edad,
        'grado': e.grado,
        'tipo_tdah': e.tipo_tdah,
        'atencion_promedio': e.atencion_promedio,
        'puntaje_participacion': e.puntaje_participacion,
        'fortalezas': e.fortalezas,
    }


def _tool_obtener_bitacora(estudiante_id: int) -> dict:
    """Devuelve las últimas 10 entradas de bitácora de un estudiante."""
    entradas = EntradaBitacora.objects.filter(estudiante_id=estudiante_id).order_by('-creado_en')[:10]
    if not entradas:
        return {'total': 0, 'entradas': [], 'mensaje': 'Sin entradas registradas aún.'}

    return {
        'total': len(entradas),
        'entradas': [
            {
                'titulo': e.titulo,
                'descripcion': e.descripcion,
                'categoria': e.categoria,
                'puntaje_atencion': e.puntaje_atencion,
                'fecha': e.creado_en.strftime('%Y-%m-%d'),
            }
            for e in entradas
        ]
    }


def _tool_crear_entrada_bitacora(estudiante_id: int, titulo: str, descripcion: str,
                                   categoria: str, puntaje_atencion: int) -> dict:
    """Crea una nueva entrada de bitácora para un estudiante."""
    categorias_validas = ['Alta agitacion', 'Logro positivo', 'Ajuste de entorno']
    if categoria not in categorias_validas:
        return {'success': False, 'error': f'Categoría inválida. Debe ser una de: {categorias_validas}'}

    try:
        estudiante = Estudiante.objects.get(id=estudiante_id)
    except Estudiante.DoesNotExist:
        return {'success': False, 'error': 'Estudiante no encontrado.'}

    entrada = EntradaBitacora.objects.create(
        estudiante=estudiante,
        titulo=titulo,
        descripcion=descripcion,
        categoria=categoria,
        puntaje_atencion=max(0, min(100, puntaje_atencion)),
    )

    return {
        'success': True,
        'id': entrada.id,
        'mensaje': f'Entrada registrada en la bitácora de {estudiante.nombre}.'
    }


def _tool_buscar_estrategias(categoria: str = None) -> dict:
    """Busca estrategias pedagógicas en el banco. Si no se da categoría, devuelve las más efectivas."""
    qs = Estrategia.objects.filter(activa=True)
    if categoria:
        qs = [e for e in qs if categoria in (e.categorias or [])]
    else:
        qs = list(qs.order_by('-tasa_eficacia')[:5])

    if not qs:
        return {'total': 0, 'estrategias': [], 'mensaje': 'No se encontraron estrategias para esa categoría.'}

    return {
        'total': len(qs),
        'estrategias': [
            {
                'titulo': e.titulo,
                'descripcion': e.descripcion,
                'tasa_eficacia': e.tasa_eficacia,
                'categorias': e.categorias,
            }
            for e in qs[:5]
        ]
    }


# Mapeo nombre función → función Python real
_TOOL_MAP = {
    'buscar_estudiante':        _tool_buscar_estudiante,
    'obtener_bitacora':         _tool_obtener_bitacora,
    'crear_entrada_bitacora':   _tool_crear_entrada_bitacora,
    'buscar_estrategias':       _tool_buscar_estrategias,
}

# Declaración de las tools para Gemini (formato google-genai)
_TOOLS_DECLARATION = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name='buscar_estudiante',
            description='Busca un estudiante por nombre (o parte del nombre) y devuelve su perfil completo: edad, grado, tipo de TDAH, atención promedio, participación y fortalezas.',
            parameters={
                'type': 'OBJECT',
                'properties': {
                    'nombre': {'type': 'STRING', 'description': 'Nombre o parte del nombre del estudiante a buscar'},
                },
                'required': ['nombre'],
            },
        ),
        types.FunctionDeclaration(
            name='obtener_bitacora',
            description='Obtiene las últimas 10 entradas de bitácora de un estudiante, usando su ID.',
            parameters={
                'type': 'OBJECT',
                'properties': {
                    'estudiante_id': {'type': 'INTEGER', 'description': 'ID del estudiante'},
                },
                'required': ['estudiante_id'],
            },
        ),
        types.FunctionDeclaration(
            name='crear_entrada_bitacora',
            description='Crea una nueva entrada en la bitácora de un estudiante a partir de una observación narrada por el docente. Infiere la categoría y el puntaje de atención según el tono y contenido del relato.',
            parameters={
                'type': 'OBJECT',
                'properties': {
                    'estudiante_id': {'type': 'INTEGER', 'description': 'ID del estudiante (obtenido previamente con buscar_estudiante)'},
                    'titulo':        {'type': 'STRING', 'description': 'Título breve y descriptivo de la observación (máx 60 caracteres)'},
                    'descripcion':   {'type': 'STRING', 'description': 'Descripción detallada de lo observado, en tono profesional'},
                    'categoria':     {
                        'type': 'STRING',
                        'description': 'Categoría de la observación',
                        'enum': ['Alta agitacion', 'Logro positivo', 'Ajuste de entorno'],
                    },
                    'puntaje_atencion': {'type': 'INTEGER', 'description': 'Nivel de atención observado, de 0 a 100, inferido del relato'},
                },
                'required': ['estudiante_id', 'titulo', 'descripcion', 'categoria', 'puntaje_atencion'],
            },
        ),
        types.FunctionDeclaration(
            name='buscar_estrategias',
            description='Busca estrategias pedagógicas basadas en evidencia del Banco de Estrategias. Úsala cuando el docente pida una recomendación o estrategia para un estudiante.',
            parameters={
                'type': 'OBJECT',
                'properties': {
                    'categoria': {
                        'type': 'STRING',
                        'description': 'Categoría de estrategia a buscar (opcional)',
                        'enum': ['atencion', 'impulsividad', 'organizacion', 'evaluacion', 'transiciones'],
                    },
                },
                'required': [],
            },
        ),
    ])
]


# ═══════════════════════════════════════════════════════════════════
# CHAT CON FUNCTION CALLING
# ═══════════════════════════════════════════════════════════════════

SYSTEM_INSTRUCTION = """Eres EduIA, un asistente pedagógico especializado en estudiantes con TDAH.
Respondes en español, con tono cálido, profesional y práctico.
Tienes acceso a herramientas para buscar estudiantes, consultar su bitácora, registrar nuevas
observaciones y buscar estrategias pedagógicas. ÚSALAS cuando la conversación lo requiera —
nunca inventes datos de estudiantes ni estrategias, siempre consulta las herramientas reales.

Reglas importantes:
- Si el docente menciona a un estudiante por nombre y no conoces su ID, usa buscar_estudiante primero.
- Si el docente narra una observación o evento sobre un estudiante (ej: "hoy estuvo inquieto",
  "tuvo un buen día"), regístralo con crear_entrada_bitacora — infiere tú la categoría y el
  puntaje de atención según el tono del relato.
- Si el docente pide una recomendación o estrategia, usa buscar_estrategias antes de responder.
- Después de ejecutar una herramienta, responde siempre en lenguaje natural, nunca muestres JSON crudo.
- Si el tema NO calza con esas categorías (ej. ansiedad, autoestima, sueño, alimentación) o la
  herramienta no devuelve resultados útiles, responde con tu propio conocimiento pedagógico y
  basado en evidencia — NO le pidas al docente que reformule ni lo fuerces a encajar su pregunta
  en una categoría que no aplica.
- Máximo 200 palabras por respuesta. No te presentes ni saludes en cada turno, ve directo al punto.
"""


def chat_asistente(estudiante, mensaje, historial):
    """
    Chat con function calling. Gemini decide qué herramientas usar.
    Mantiene compatibilidad con la firma anterior (estudiante, mensaje, historial),
    pero ahora 'estudiante' es solo un contexto inicial — Gemini puede buscar
    cualquier otro estudiante si el docente lo menciona.
    historial: lista de {role: 'user'|'ai', text: str}
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # Construye el historial en formato Content de google-genai
    contents = []
    for msg in historial[-10:]:
        role = 'user' if msg['role'] == 'user' else 'model'
        contents.append(types.Content(role=role, parts=[types.Part(text=msg['text'])]))

    # Mensaje actual, con contexto del estudiante activo en pantalla
    contexto_actual = f"[Estudiante actualmente en pantalla: {estudiante.nombre}, ID {estudiante.id}]\n{mensaje}"
    contents.append(types.Content(role='user', parts=[types.Part(text=contexto_actual)]))

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        tools=_TOOLS_DECLARATION,
    )

    # Loop de function calling: máximo 5 idas y vueltas para evitar bucles infinitos
    for _ in range(5):
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=config,
        )

        candidate = response.candidates[0]
        function_calls = [
            part.function_call
            for part in candidate.content.parts
            if part.function_call
        ]

        if not function_calls:
            # No hay más llamadas a funciones — esta es la respuesta final
            return response.text.strip() if response.text else 'No pude generar una respuesta.'

        # Agrega la respuesta del modelo (con las function calls) al historial
        contents.append(candidate.content)

        # Ejecuta cada función solicitada y agrega el resultado
        function_response_parts = []
        for fc in function_calls:
            func = _TOOL_MAP.get(fc.name)
            if not func:
                resultado = {'error': f'Función desconocida: {fc.name}'}
            else:
                try:
                    resultado = func(**fc.args)
                except Exception as e:
                    resultado = {'error': str(e)}

            function_response_parts.append(
                types.Part.from_function_response(
                    name=fc.name,
                    response={'result': resultado},
                )
            )

        contents.append(types.Content(role='user', parts=function_response_parts))

    return 'La conversación se volvió demasiado compleja, intenta reformular tu pregunta.'

# ═══════════════════════════════════════════════════════════════════
# GENERADOR DE MATERIAL ADAPTADO
# ═══════════════════════════════════════════════════════════════════

def _construir_prompt_material(tema, tipo_material, dificultad, estudiante, opciones):
    perfil_texto = (
        f"Estudiante: {estudiante.nombre}, {estudiante.edad} años, {estudiante.grado}, "
        f"TDAH tipo {estudiante.tipo_tdah}. Fortalezas: {', '.join(estudiante.fortalezas) if estudiante.fortalezas else 'ninguna registrada'}."
        if estudiante else "Material general para todo el grupo, sin perfil individual específico."
    )

    incluir_emojis  = opciones.get('emojis', True)
    pasos_numerados = opciones.get('steps', True)
    autoevaluacion  = opciones.get('selfeval', False)

    return f"""
Eres un experto en pedagogía y diseño instruccional para estudiantes con TDAH.
Crea material educativo en ESPAÑOL sobre el tema: "{tema}".

CONTEXTO:
- Tipo de material: {tipo_material}
- Nivel de dificultad: {dificultad}
- {perfil_texto}
- Incluir emojis de apoyo visual: {'sí' if incluir_emojis else 'no'}
- Segmentar en pasos numerados: {'sí' if pasos_numerados else 'no'}
- Incluir sección de autoevaluación al final: {'sí' if autoevaluacion else 'no'}

PRINCIPIOS DE DISEÑO PARA TDAH (aplícalos):
- Frases cortas, lenguaje concreto y directo, sin rodeos.
- Conecta el tema con algo cotidiano y familiar para el estudiante.
- Si hay pasos, que sean entre 2 y 4 — nunca más, para no saturar.
- Cada paso debe tener una sola idea central.
- Cierra con un mensaje breve y memorable que resuma lo esencial.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto adicional, sin ```), con esta estructura EXACTA:

{{
  "titulo_emoji": "un emoji representativo del tema",
  "titulo_linea1": "primera parte del título (corta, llamativa)",
  "titulo_linea2": "segunda parte del título (puede ir vacía si el título es de una sola línea)",
  "duracion_estimada": "ej: ~15 min",
  "intro_emoji": "emoji para el bloque introductorio",
  "intro_titulo": "ej: ¿Qué vamos a hacer hoy?",
  "intro_texto": "1-3 frases explicando el objetivo de forma cercana y motivadora",
  "palabras_clave": [
    {{"emoji": "emoji relacionado", "palabra": "concepto clave 1"}},
    {{"emoji": "emoji relacionado", "palabra": "concepto clave 2"}}
  ],
  "pasos": [
    {{
      "emoji": "emoji del paso",
      "titulo": "título corto y accionable del paso",
      "contenido": "explicación del paso, concreta y breve",
      "ejercicio_grid": null
    }}
  ],
  "cierre_emoji": "emoji para el bloque de cierre (ej: ⭐)",
  "cierre_titulo": "ej: ¡Recuerda siempre!",
  "cierre_texto": "mensaje final breve y memorable que resume la idea clave",
  "autoevaluacion": null
}}

Notas sobre el JSON:
- "palabras_clave": entre 3 y 6 conceptos clave del tema, cada uno con su propio emoji relacionado.
- "pasos": entre 2 y 4 pasos (si pasos numerados = no, igual genera 1 solo bloque con todo el contenido).
- "ejercicio_grid": si el último paso requiere que el estudiante practique con varios ítems cortos (ej: completar fracciones, identificar palabras), pon aquí un array de objetos {{"label": "Ítem A", "valor": "___/4"}} (2 a 4 ítems). Si no aplica, deja null.
- "autoevaluacion": si autoevaluación = sí, pon un array de 2-3 preguntas tipo {{"pregunta": "...", "opciones": ["a", "b", "c"]}}. Si no, deja null.
- Todo el contenido debe adaptarse genuinamente al tema "{tema}" — nunca reutilices el ejemplo de fracciones, ese era solo ilustrativo del formato.
"""


def generar_material(tema, tipo_material, dificultad, estudiante, opciones):
    """
    Genera material educativo estructurado con Gemini.
    estudiante: instancia de Estudiante o None (material general)
    opciones: dict con keys 'emojis', 'steps', 'selfeval' (bool)
    """
    prompt = _construir_prompt_material(tema, tipo_material, dificultad, estudiante, opciones)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )

    texto = response.text.strip()
    if texto.startswith('```'):
        texto = texto.split('```')[1]
        if texto.startswith('json'):
            texto = texto[4:]
    texto = texto.strip()

    return json.loads(texto)
