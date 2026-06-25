# EduIA

![React](https://img.shields.io/badge/React-18-black?style=for-the-badge&logo=react&logoColor=61DAFB)
![Django](https://img.shields.io/badge/Django-6.0-black?style=for-the-badge&logo=django&logoColor=0C4B33)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-black?style=for-the-badge&logo=postgresql&logoColor=4169E1)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-black?style=for-the-badge&logo=googlegemini&logoColor=8E75B2)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-success?style=for-the-badge)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)

Plataforma web de apoyo pedagógico para el seguimiento y acompañamiento de estudiantes con Trastorno por Déficit de Atención e Hiperactividad (TDAH), impulsada por inteligencia artificial generativa.

**Repositorio:** [github.com/ElkinAcevedo/Edutdah](https://github.com/ElkinAcevedo/Edutdah)

---

## Tabla de contenidos

- [El problema](#el-problema)
- [La solución](#la-solución)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Modelo de datos](#modelo-de-datos)
- [Flujo de funcionamiento](#flujo-de-funcionamiento)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Autenticación y seguridad](#autenticación-y-seguridad)
- [Inteligencia artificial](#inteligencia-artificial)
- [Roadmap](#roadmap)
- [Autores](#autores)

---

## El problema

En un aula promedio de 30 a 40 estudiantes, una proporción significativa presenta dificultades de atención, impulsividad o hiperactividad. Aunque el docente busca ofrecer un acompañamiento personalizado, el tiempo disponible es limitado y la carga administrativa es alta. Como resultado, las observaciones sobre el comportamiento de los estudiantes terminan dispersas en cuadernos, anotaciones sueltas o simplemente en la memoria del profesor.

Esto genera consecuencias concretas:

- Se dificulta identificar patrones de comportamiento a lo largo del tiempo.
- Se pierde información relevante para la toma de decisiones pedagógicas.
- Las estrategias de intervención se aplican de forma general, no individualizada.
- El seguimiento longitudinal de cada estudiante se vuelve prácticamente inviable.

La mayoría de instituciones educativas no cuenta con herramientas tecnológicas especializadas para este propósito, registra observaciones de forma manual, y no aprovecha las capacidades actuales de la inteligencia artificial para apoyar el trabajo docente.

## La solución

EduIA transforma observaciones cotidianas del aula en información estructurada y útil para el docente. La plataforma centraliza la gestión de estudiantes, el registro de observaciones, el análisis de patrones de comportamiento y la generación de material educativo adaptado, todo dentro de un único sistema apoyado por inteligencia artificial con acceso real a los datos registrados.

El objetivo no es sustituir el criterio del docente, sino ampliar su capacidad de observación: convertir anotaciones aisladas en evidencia acumulada, y esa evidencia en recomendaciones pedagógicas concretas.

## Funcionalidades

### Gestión de estudiantes
Registro y administración de perfiles individuales: nombre, edad, grado, tipo de TDAH (Combinado, Inatento o Hiperactivo), fortalezas y métricas de atención y participación.

### Bitácora de seguimiento
Registro cronológico de observaciones clasificadas por categoría — dificultades de atención, logros positivos, ajustes de entorno — que documentan la evolución del estudiante a lo largo del tiempo.

### Análisis con inteligencia artificial
A partir de las observaciones acumuladas, el sistema detecta patrones de comportamiento y genera un resumen, una identificación del patrón más relevante y una recomendación pedagógica concreta. El análisis se cachea mediante un hash de las entradas para evitar recalcularlo cuando los datos no han cambiado.

### Asistente conversacional con ejecución de acciones reales
A diferencia de un chatbot que solo conversa, el asistente de EduIA utiliza **function calling**: durante la conversación, el modelo decide cuándo consultar la base de datos o cuándo registrar información nueva, sin intervención manual del docente.

Capacidades del asistente:
- Localizar el perfil de un estudiante mencionado por nombre, sin requerir su identificador.
- Consultar el historial reciente de bitácora antes de responder.
- Registrar una nueva observación a partir de un relato en lenguaje natural, infiriendo la categoría y el nivel de atención correspondiente.
- Recomendar estrategias reales del Banco de Estrategias, nunca generadas de forma especulativa.

### Generador de material educativo adaptado
Creación de actividades, lecturas y evaluaciones ajustadas al perfil de un estudiante específico — o de carácter general para el grupo —, considerando su tipo de TDAH y nivel de atención. El contenido se genera con estructura pedagógica (introducción, conceptos clave, pasos numerados, cierre, autoevaluación opcional) y puede exportarse a PDF.

### Banco de estrategias
Repositorio de estrategias pedagógicas basadas en evidencia, organizadas por categoría (atención, impulsividad, organización, evaluación, transiciones), con guía de aplicación paso a paso y tasa de efectividad reportada.

### Autenticación por docente
Cada profesor accede únicamente a la información de sus propios estudiantes, bitácoras y materiales generados, mediante un sistema de autenticación basado en tokens.

## Arquitectura

EduIA sigue una arquitectura por capas, donde cada componente tiene una responsabilidad claramente delimitada:

```
 Frontend (React)
       │  Captura acciones del usuario, presenta información
       ▼
 API REST (Django REST Framework)
       │  Intermediario entre interfaz y lógica de negocio
       ▼
 Backend (Django)
       │  Valida datos, gestiona usuarios, procesa bitácoras,
       │  prepara información para la IA, coordina la generación
       │  de materiales
       ├──────────────┐
       ▼              ▼
 Base de datos    Inteligencia Artificial
 (PostgreSQL)      (Gemini + Function Calling)
```

Cuando un docente realiza una acción en la interfaz, el frontend envía una solicitud HTTP a la API; el backend procesa la petición, interactúa con la base de datos o con el modelo de lenguaje según corresponda, y devuelve una respuesta estructurada al cliente. Esta separación permite que cada capa evolucione de forma independiente sin acoplar la interfaz a la lógica de negocio.

## Stack tecnológico

| Capa | Tecnología | Función en el proyecto |
|---|---|---|
| Interfaz | **React** | Construcción de la interfaz mediante componentes reutilizables (Dashboard, gestión de estudiantes, bitácora, asistente, generador de materiales) |
| Build tool | **Vite** | Compilación, gestión de dependencias y recarga en caliente durante el desarrollo |
| Estilos | **Tailwind CSS** | Sistema de diseño basado en utilidades, consistente en toda la aplicación |
| Comunicación HTTP | **Axios** | Cliente para el consumo de la API REST desde el frontend |
| Backend | **Django** | Lógica de negocio: gestión de usuarios, procesamiento de solicitudes, integración con la base de datos y con la IA |
| API | **Django REST Framework** | Exposición de los datos como endpoints JSON estandarizados |
| Base de datos | **PostgreSQL** | Almacenamiento estructurado y confiable de toda la información del sistema |
| Inteligencia artificial | **Gemini (Google AI)** | Procesamiento de lenguaje natural: análisis de patrones, generación de recomendaciones, function calling y creación de materiales adaptados |
| Autenticación | **djangorestframework-simplejwt** | Emisión y validación de tokens de sesión por docente |
| Generación de documentos | **ReportLab** | Exportación de materiales educativos a formato PDF |

## Modelo de datos

| Entidad | Descripción |
|---|---|
| **Usuario** | Docente autenticado en la plataforma |
| **Estudiante** | Perfil individual: edad, grado, tipo de TDAH, fortalezas, métricas de atención y participación |
| **Bitácora** | Observación puntual categorizada, asociada a un estudiante |
| **Análisis** | Resultado generado por IA a partir de las observaciones acumuladas, cacheado por hash |
| **Estrategia** | Estrategia pedagógica del Banco de Estrategias |
| **Material Adaptado** | Contenido educativo generado, asociado a un docente y opcionalmente a un estudiante |

## Flujo de funcionamiento

1. El docente registra una observación sobre un estudiante, ya sea mediante un formulario estructurado o narrándola en lenguaje natural al asistente.
2. La información llega al backend a través de la API REST.
3. El backend valida los datos y los almacena en la base de datos, asociados al estudiante y al docente correspondiente.
4. Cuando se acumula suficiente evidencia (mínimo tres observaciones), el sistema envía los datos preprocesados al modelo de inteligencia artificial.
5. El modelo analiza patrones de comportamiento y devuelve un resumen, un patrón identificado y una recomendación pedagógica.
6. El resultado se almacena y se presenta al docente en la interfaz, listo para orientar la siguiente intervención en el aula.

Este ciclo se repite y se enriquece con cada nueva observación, transformando progresivamente datos aislados en conocimiento pedagógico acumulado.

## Estructura del proyecto

```
edutdah/
├── backend/
│   ├── core/
│   │   └── settings.py        # Configuración de Django, JWT, CORS
│   └── api/
│       ├── models.py           # Usuario, Estudiante, Bitácora,
│       │                       # Análisis, Material Adaptado, Estrategia
│       ├── serializers.py      # Serializers de DRF
│       ├── views.py            # Endpoints de la API
│       ├── urls.py              # Definición de rutas
│       ├── gemini.py            # Lógica de IA: análisis, chat, function calling
│       └── pdf_export.py        # Generación de material en PDF
└── frontend/
    └── src/
        ├── api.js                # Cliente Axios con autenticación
        ├── context/
        │   └── AuthContext.jsx   # Estado global de sesión
        ├── components/
        └── views/
            ├── DashboardView.jsx
            ├── StudentsView.jsx
            ├── LogbookView.jsx
            ├── AssistantView.jsx
            ├── AdapterView.jsx
            ├── BankView.jsx
            ├── LoginView.jsx
            └── RegisterView.jsx
```

## Instalación

### Requisitos previos

- Python 3.10 o superior
- Node.js 18 o superior
- PostgreSQL 14 o superior

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # En Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`, consumiendo la API en `http://localhost:8000/api/`.

## Variables de entorno

Crear un archivo `.env` dentro de `backend/`:

```env
GEMINI_API_KEY=tu_api_key_de_google_ai
```

## Autenticación y seguridad

EduIA implementa autenticación basada en JSON Web Tokens. Cada solicitud a la API debe incluir el encabezado `Authorization: Bearer <token>`, y todos los recursos —estudiantes, bitácoras, análisis y materiales— quedan estrictamente aislados por docente: un usuario nunca puede acceder a información registrada por otro.

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/auth/register/` | `POST` | Registro de un nuevo docente |
| `/api/auth/login/` | `POST` | Inicio de sesión |
| `/api/auth/me/` | `GET` | Perfil del usuario autenticado |

## Inteligencia artificial

La capa de inteligencia artificial es el componente que aporta el valor diferencial del proyecto. En lugar de limitarse a generar texto a partir de un prompt estático, el asistente de EduIA utiliza **function calling**: durante la conversación, el modelo evalúa si necesita ejecutar una acción concreta —buscar un estudiante, consultar su historial, registrar una observación o recomendar una estrategia— y la ejecuta directamente sobre la base de datos antes de responder.

Esto permite interacciones como la siguiente:

> *Docente: "Mateo estuvo muy disperso hoy en la clase de lectura."*
> El asistente identifica al estudiante mencionado, infiere la categoría de la observación y el nivel de atención correspondiente, y registra la entrada en la bitácora de forma autónoma — sin que el docente diligencie ningún formulario adicional.

El sistema de análisis de patrones utiliza un mecanismo de cacheo basado en hash de las observaciones acumuladas, evitando llamadas redundantes al modelo cuando la información no ha cambiado desde el último análisis generado.

## Roadmap

- Recuperación de contraseña
- Notificaciones automáticas para alertas generadas por la IA
- Exportación completa de la bitácora a PDF
- Panel de coordinación para múltiples docentes de un mismo grado
- Manejo de reintento exponencial ante errores transitorios de disponibilidad del modelo

## Autores

- **Elkin Acevedo**
- **Camila Rubio**

Proyecto desarrollado en el marco de la formación en Ingeniería de Sistemas, orientado a la aplicación práctica de inteligencia artificial generativa en contextos educativos reales.
