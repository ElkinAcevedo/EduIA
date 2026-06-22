"""
Generación de PDF para material educativo adaptado.
Replica visualmente el diseño de la vista previa: título, intro, palabras
clave, pasos numerados con color, y bloque de cierre.
"""
import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.pdfbase.pdfmetrics import stringWidth

def _limpiar_emojis(texto):
    """Quita emojis y símbolos no soportados por las fuentes base de reportlab."""
    if not texto:
        return texto
    patron = re.compile(
        "["
        "\U0001F300-\U0001FAFF"  # símbolos y pictogramas misceláneos, emoticonos, transporte, etc.
        "\U00002600-\U000027BF"  # símbolos diversos y dingbats
        "\U0001F1E6-\U0001F1FF"  # banderas
        "\U00002190-\U000021FF"  # flechas
        "\U00002700-\U000027BF"
        "\uFE0F"                 # variation selector (emoji presentation)
        "]+",
        flags=re.UNICODE,
    )
    limpio = patron.sub('', texto)
    return ' '.join(limpio.split()).strip()


# ── Paleta (coincide con los colores Tailwind usados en el frontend) ──
COLOR_INDIGO       = colors.HexColor('#4f46e5')
COLOR_INDIGO_LIGHT = colors.HexColor('#eef2ff')
COLOR_AMBER        = colors.HexColor('#fef3c7')
COLOR_AMBER_TEXT   = colors.HexColor('#92400e')
COLOR_AMBER_BORDER = colors.HexColor('#fde68a')
COLOR_VIOLET       = colors.HexColor('#7c3aed')
COLOR_VIOLET_LIGHT = colors.HexColor('#f5f0ff')
COLOR_EMERALD      = colors.HexColor('#10b981')
COLOR_EMERALD_LIGHT= colors.HexColor('#ecfdf5')
COLOR_SKY          = colors.HexColor('#0ea5e9')
COLOR_SKY_LIGHT    = colors.HexColor('#f0f9ff')
COLOR_SLATE        = colors.HexColor('#475569')
COLOR_SLATE_LIGHT  = colors.HexColor('#f8fafc')

STEP_COLORS = [
    (COLOR_INDIGO, COLOR_INDIGO_LIGHT),
    (COLOR_EMERALD, COLOR_EMERALD_LIGHT),
    (COLOR_VIOLET, COLOR_VIOLET_LIGHT),
    (COLOR_SKY, COLOR_SKY_LIGHT),
]


def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'TituloMaterial', parent=styles['Title'],
        fontSize=20, leading=24, textColor=colors.HexColor('#1e293b'),
        alignment=TA_CENTER, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'Subtitulo', parent=styles['Normal'],
        fontSize=10, textColor=COLOR_SLATE, alignment=TA_CENTER, spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        'BadgePerfil', parent=styles['Normal'],
        fontSize=9, textColor=COLOR_INDIGO, alignment=TA_CENTER, spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        'IntroTexto', parent=styles['Normal'],
        fontSize=10.5, leading=15, textColor=COLOR_AMBER_TEXT,
    ))
    styles.add(ParagraphStyle(
        'SeccionLabel', parent=styles['Normal'],
        fontSize=8.5, textColor=COLOR_SLATE, spaceAfter=6,
        spaceBefore=10,
    ))
    styles.add(ParagraphStyle(
        'PasoTitulo', parent=styles['Normal'],
        fontSize=10.5, leading=14, textColor=colors.HexColor('#1e293b'),
    ))
    styles.add(ParagraphStyle(
        'PasoContenido', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=COLOR_SLATE,
    ))
    styles.add(ParagraphStyle(
        'CierreTitulo', parent=styles['Normal'],
        fontSize=11, textColor=COLOR_AMBER_TEXT,
    ))
    styles.add(ParagraphStyle(
        'CierreTexto', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=COLOR_AMBER_TEXT,
    ))
    styles.add(ParagraphStyle(
        'FooterTexto', parent=styles['Normal'],
        fontSize=7.5, textColor=colors.HexColor('#94a3b8'),
    ))
    return styles


def _rounded_box(flowable_table, bg_color, border_color=None, pad=10):
    """Envuelve contenido en una 'caja' con fondo de color usando Table."""
    t = Table([[flowable_table]], colWidths=[16.5 * cm])
    style = [
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('LEFTPADDING', (0, 0), (-1, -1), pad),
        ('RIGHTPADDING', (0, 0), (-1, -1), pad),
        ('TOPPADDING', (0, 0), (-1, -1), pad),
        ('BOTTOMPADDING', (0, 0), (-1, -1), pad),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    if border_color:
        style.append(('BOX', (0, 0), (-1, -1), 0.75, border_color))
    t.setStyle(TableStyle(style))
    return t


def generar_pdf_material(material_dict, contenido, estudiante=None):
    """
    material_dict: {tema, tipo_material, dificultad, creado_en}
    contenido: el JSON estructurado generado por Gemini
    estudiante: instancia de Estudiante o None
    Devuelve: bytes del PDF
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
    )
    styles = _build_styles()
    story = []

    # ── Badge perfil ──
    if estudiante:
        badge_texto = f"⭐ Para: {estudiante.nombre} · {estudiante.grado} · TDAH {estudiante.tipo_tdah}"
    else:
        badge_texto = "Material general para el grupo"
    story.append(Paragraph(badge_texto, styles['BadgePerfil']))

    # ── Título ──
    titulo = _limpiar_emojis(contenido.get('titulo_linea1', ''))
    if contenido.get('titulo_linea2'):
        titulo += f"<br/><font color='#4f46e5'>{_limpiar_emojis(contenido['titulo_linea2'])}</font>"    
        story.append(Paragraph(titulo, styles['TituloMaterial']))
    subtitulo = f"{material_dict.get('tipo_material', '')} · Nivel {material_dict.get('dificultad', '')} · {contenido.get('duracion_estimada', '')}"
    story.append(Paragraph(subtitulo, styles['Subtitulo']))

    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=12))

    # ── Intro (caja ámbar) ──
    intro_html = (
        f"<b>{_limpiar_emojis(contenido.get('intro_titulo', ''))}</b><br/>"
        f"{_limpiar_emojis(contenido.get('intro_texto', ''))}"
    )

    intro_p = Paragraph(intro_html, styles['IntroTexto'])
    story.append(_rounded_box(intro_p, COLOR_AMBER, COLOR_AMBER_BORDER))
    story.append(Spacer(1, 12))

    # ── Palabras clave ──
    palabras = contenido.get('palabras_clave', [])
    if palabras:
        story.append(Paragraph('PALABRAS CLAVE DE HOY', styles['SeccionLabel']))
        chips = []
        for k in palabras:
            texto = _limpiar_emojis(k.get('palabra', ''))  
            chips.append(Paragraph(
                texto,
                ParagraphStyle('chip', parent=styles['Normal'], fontSize=9,
                               textColor=COLOR_VIOLET, alignment=TA_CENTER)
            ))
        # Envuelve cada chip en su propia mini-caja, en fila
        chip_boxes = []
        for chip in chips:
            t = Table([[chip]], colWidths=[None])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), COLOR_VIOLET_LIGHT),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd6fe')),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            chip_boxes.append(t)

        # Distribuye los chips en filas que no excedan el ancho de página
        max_width = 16.5 * cm
        rows, current_row, current_width = [], [], 0
        for chip, box in zip(chips, chip_boxes):
            texto_plano = chip.text
            w = stringWidth(texto_plano.replace('<b>', '').replace('</b>', ''), 'Helvetica', 9) + 20
            if current_width + w > max_width and current_row:
                rows.append(current_row)
                current_row, current_width = [], 0
            current_row.append(box)
            current_width += w + 6
        if current_row:
            rows.append(current_row)

        for row in rows:
            t = Table([row], colWidths=[None] * len(row), hAlign='LEFT')
            t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
            story.append(t)
            story.append(Spacer(1, 4))

        story.append(Spacer(1, 8))

    # ── Pasos ──
    pasos = contenido.get('pasos', [])
    if pasos:
        story.append(Paragraph('PASOS A SEGUIR', styles['SeccionLabel']))
        for i, paso in enumerate(pasos):
            color_accent, color_bg = STEP_COLORS[i % len(STEP_COLORS)]

            numero = Table([[str(i + 1)]], colWidths=[0.7 * cm], rowHeights=[0.7 * cm])
            numero.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), color_accent),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ]))

            contenido_texto = (
                f"<b>{_limpiar_emojis(paso.get('titulo', ''))}</b><br/>"
                f"{_limpiar_emojis(paso.get('contenido', ''))}"
            )
            
            texto_p = Paragraph(contenido_texto, styles['PasoContenido'])

            # Ejercicio grid (si existe)
            ejercicio = paso.get('ejercicio_grid')
            paso_content = [texto_p]
            if ejercicio:
                celdas = []
                for item in ejercicio:
                    celda_texto = (
                        f"<font size=7 color='#64748b'>{item.get('label', '')}</font><br/>"
                        f"<font size=13 color='#7c3aed'><b>{item.get('valor', '')}</b></font>"
                    )
                    celdas.append(Paragraph(celda_texto, ParagraphStyle(
                        'gridcell', parent=styles['Normal'], alignment=TA_CENTER, leading=14
                    )))
                grid = Table([celdas], colWidths=[5.2 * cm] * len(celdas))
                grid.setStyle(TableStyle([
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd6fe')),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd6fe')),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]))
                paso_content.append(Spacer(1, 6))
                paso_content.append(grid)

            # Fila: número | contenido
            inner = Table(
                [[numero, paso_content]],
                colWidths=[1 * cm, 15 * cm],
            )
            inner.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (1, 0), (1, 0), 8),
            ]))

            story.append(_rounded_box(inner, color_bg))
            story.append(Spacer(1, 8))

    # ── Autoevaluación ──
    autoeval = contenido.get('autoevaluacion')
    if autoeval:
        story.append(Paragraph('AUTOEVALUACIÓN', styles['SeccionLabel']))
        for i, q in enumerate(autoeval):
            pregunta_html = f"<b>{i + 1}. {_limpiar_emojis(q.get('pregunta', ''))}</b>"
            opciones_html = '<br/>'.join(f"[ ] {_limpiar_emojis(opt)}" for opt in q.get('opciones', []))
            bloque = Paragraph(f"{pregunta_html}<br/>{opciones_html}", styles['PasoContenido'])
            story.append(_rounded_box(bloque, COLOR_SLATE_LIGHT))
            story.append(Spacer(1, 8))

    # ── Cierre ──
    cierre_html = (
        f"<b>{_limpiar_emojis(contenido.get('cierre_titulo', ''))}</b><br/>"
        f"{_limpiar_emojis(contenido.get('cierre_texto', ''))}"
    )

    cierre_p = Paragraph(cierre_html, styles['CierreTexto'])
    story.append(_rounded_box(cierre_p, COLOR_AMBER, COLOR_AMBER_BORDER))
    story.append(Spacer(1, 16))

    # ── Footer ──
    story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=6))
    fecha = material_dict.get('creado_en', '')
    story.append(Paragraph(f"Generado por EduIA TDAH · {fecha}", styles['FooterTexto']))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
