# 🎓 EduIA
### Plataforma Inteligente de Apoyo Educativo para Estudiantes con TDAH

EduIA es una plataforma web diseñada para apoyar a docentes en el seguimiento y acompañamiento de estudiantes con Trastorno por Déficit de Atención e Hiperactividad (TDAH) mediante el uso de Inteligencia Artificial.

La plataforma permite registrar observaciones pedagógicas, generar análisis automáticos, obtener recomendaciones personalizadas y crear materiales adaptados a las necesidades de cada estudiante.

---

## 📖 Descripción del Proyecto

Los docentes suelen enfrentar dificultades para realizar un seguimiento continuo y sistemático de estudiantes con TDAH debido a la carga administrativa y la falta de herramientas especializadas.

EduIA busca solucionar esta problemática proporcionando un entorno centralizado donde los docentes pueden:

- Registrar observaciones de comportamiento y desempeño.
- Analizar patrones mediante Inteligencia Artificial.
- Generar recomendaciones pedagógicas personalizadas.
- Consultar estrategias de intervención.
- Crear materiales adaptados según las necesidades del estudiante.
- Interactuar con un asistente virtual contextualizado.

---

## ✨ Características Principales

### 👨‍🎓 Gestión de Estudiantes

- Registro y administración de estudiantes.
- Información académica y personal.
- Seguimiento individualizado.

### 📝 Bitácora de Observaciones

- Registro diario de comportamientos.
- Seguimiento de atención y participación.
- Clasificación por categorías.

### 🤖 Análisis Inteligente

- Procesamiento de observaciones mediante IA.
- Identificación de fortalezas.
- Detección de dificultades recurrentes.
- Generación de recomendaciones pedagógicas.

### 💬 Asistente Educativo con IA

- Chat contextualizado.
- Respuestas basadas en el historial del estudiante.
- Apoyo a docentes en la toma de decisiones.

### 📚 Estrategias Pedagógicas

- Biblioteca de estrategias educativas.
- Filtrado por categoría.
- Recomendaciones adaptadas al contexto.

### 📄 Generación de Material Adaptado

- Creación automática de recursos educativos.
- Adaptación según fortalezas y necesidades del estudiante.

---

## 🏗️ Arquitectura del Sistema

```text
┌─────────────────────┐
│      Frontend       │
│ React + Vite        │
│ Tailwind CSS        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Backend        │
│ Django REST API     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Base de Datos    │
│ PostgreSQL / SQLite │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Gemini AI API    │
│ Inteligencia        │
│ Artificial          │
└─────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React
- React Markdown

### Backend

- Python
- Django
- Django REST Framework
- Django CORS Headers
- Google Gemini API

### Base de Datos

- SQLite (desarrollo)
- PostgreSQL (producción)

### Inteligencia Artificial

- Google Gemini

---

## 📂 Estructura del Proyecto

```text
EduIA/
│
├── backend/
│   ├── api/
│   ├── core/
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# 🚀 Instalación del Proyecto

## Requisitos Previos

Antes de comenzar asegúrate de tener instalado:

### Backend

- Python 3.10 o superior
- pip
- virtualenv

### Frontend

- Node.js 18 o superior
- npm

### Base de Datos

- PostgreSQL (opcional)

---

# 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/ElkinAcevedo/Edutdah.git
```

Entrar al proyecto:

```bash
cd Edutdah
```

---

# 2️⃣ Configurar el Backend

Entrar al directorio:

```bash
cd backend
```

Crear entorno virtual:

### Linux / Mac

```bash
python -m venv venv
source venv/bin/activate
```

### Windows

```cmd
python -m venv venv
venv\Scripts\activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

---

## Configurar Variables de Entorno

Crear un archivo:

```text
backend/core/.env
```

Ejemplo:

```env
SECRET_KEY=tu_clave_secreta

DEBUG=True

GEMINI_API_KEY=tu_api_key

DATABASE_URL=postgresql://usuario:password@localhost:5432/eduia
```

---

## Ejecutar Migraciones

```bash
python manage.py makemigrations
```

```bash
python manage.py migrate
```

---

## Crear Usuario Administrador

```bash
python manage.py createsuperuser
```

---

## Iniciar Backend

```bash
python manage.py runserver
```

Servidor:

```text
http://127.0.0.1:8000
```

Panel administrativo:

```text
http://127.0.0.1:8000/admin
```

---

# 3️⃣ Configurar el Frontend

Abrir otra terminal.

Entrar al frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

---

## Configurar Variables de Entorno

Crear:

```text
frontend/.env
```

Ejemplo:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Ejecutar Frontend

```bash
npm run dev
```

La aplicación estará disponible en:

```text
http://localhost:5173
```

---

# 🌐 Despliegue en Producción

Se recomienda:

### Frontend

- Vercel
- Netlify

### Backend

- Render
- Railway
- VPS Linux

### Base de Datos

- PostgreSQL

---

# 🔐 Seguridad Recomendada

Antes de desplegar en producción:

- Desactivar DEBUG.
- Utilizar HTTPS.
- Configurar PostgreSQL.
- Proteger las claves API.
- Implementar autenticación JWT.
- Configurar permisos de acceso por docente.

---

# 📸 Capturas de Pantalla

Agregar aquí capturas de:

- Dashboard principal
- Gestión de estudiantes
- Bitácora
- Análisis IA
- Asistente virtual
- Material adaptado

---

# 🎯 Objetivo Académico

Este proyecto fue desarrollado como una propuesta tecnológica para apoyar los procesos de enseñanza y seguimiento de estudiantes con TDAH mediante técnicas de Inteligencia Artificial, Procesamiento de Lenguaje Natural y análisis pedagógico automatizado.

---

# 👨‍💻 Autores

**Elkin Acevedo, Camila Rubio**

Estudiantes de Ingeniería de Sistemas.

---

# 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.

Consulta el archivo:

```text
LICENSE
```

para más información.
