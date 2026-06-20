# CONTEXTO DEL PROYECTO PARA IA (HANDOFF)

Este documento contiene el contexto completo de la arquitectura, decisiones de diseño y estado actual de la "Plataforma Educativa de Geografía" para facilitar la continuación del desarrollo por parte de otra Inteligencia Artificial.

## 1. OBJETIVO DEL PROYECTO
Construir una plataforma web educativa SPA (Single Page Application) orientada a niños de 13-14 años, diseñada bajo la estrategia "Mobile-First" y utilizando React + Vite + Tailwind CSS. Actualmente integra un sistema de autenticación de usuarios y sincronización de progreso contra una base de datos de Notion.

## 2. ARQUITECTURA Y ESTRUCTURA DE ARCHIVOS
La aplicación se rige por un esquema de datos local (`data.json`) para el contenido, pero interactúa de forma asíncrona con un backend serverless (Notion API) para guardar el estado y progreso de los alumnos.

```text
src/
├── admin/                # Vistas y componentes para el Panel de Administración (Docentes)
├── auth/                 # Vistas para el Login y Registro de estudiantes
├── components/           # Componentes visuales y lógicos
│   ├── ContentRenderer.jsx # Itera sobre bloques JSON y renderiza HTML + Tooltips
│   ├── CrosswordActivity.jsx# Actividad: Crucigrama interactivo
│   ├── FreeTextActivity.jsx# Actividad: Respuesta Libre
│   ├── GlossaryTooltip.jsx # Componente visual interactivo (Hover/Click) para definiciones
│   ├── MatchingActivity.jsx# Actividad: Relacionar opciones con select
│   ├── ModuleCard.jsx      # UI de tarjeta de presentación de cada módulo
│   ├── ModuleList.jsx      # Contenedor de las tarjetas
│   ├── ProgressBar.jsx     # UI de progreso general del estudiante
│   ├── ScoreCard.jsx       # UI de calificación final mostrada al terminar actividad
│   ├── TrueFalseActivity.jsx# Actividad: Verdadero/Falso
│   └── WordSearchActivity.jsx# Actividad: Sopa de Letras
├── data/
│   └── data.json           # LA FUENTE DE LA VERDAD (Glosario, Módulos, Contenido, Preguntas)
├── hooks/
│   ├── useAuth.ts          # Hook para gestión de sesión (Estudiante / Admin)
│   ├── useGlossary.jsx     # Lógica de parseo del glosario
│   ├── useNotionProgress.ts# Hook para guardar/leer progreso de la DB en Notion
│   └── useProgress.jsx     # (Legacy) Gestión local
├── utils/
│   ├── evaluation.js       # Contiene 'evaluarRespuesta' (case-insensitive, ignora acentos)
│   └── feedback.js         # Contiene 'getFeedback' (puntaje -> Emoji + Colores)
├── App.jsx               # Layout Principal con rutas protegidas
├── index.css             # Directivas de Tailwind y estilos base
└── main.jsx              # Punto de entrada de React
```

## 3. FUENTE DE DATOS (`data.json`)
Es el motor del contenido de la aplicación. Todo texto con la etiqueta `<glossary>palabra</glossary>` es interpretado en tiempo de ejecución por `ContentRenderer.jsx`.
Estructura de un Módulo:
- `id`, `numero`, `titulo`, `descripcion`
- `contenido.bloques`: Array de objetos que dictan el renderizado (`titulo-seccion`, `parrafo`, `lista`, etc).
- `actividad`: Define el tipo de evaluación al final (`respuesta-libre`, `verdadero-falso`, `matching`, `word-search`, `crossword`).

## 4. SISTEMA DE PROGRESO, AUTENTICACIÓN Y ESTADO
- **Autenticación**: Existe un sistema de Login/Registro donde el usuario ingresa su Cédula y Contraseña. Hay un acceso especial para el perfil Administrador.
- **Almacenamiento y Sincronización**: El progreso se almacena localmente usando `localStorage` (separado por ID de estudiante) y se **sincroniza en segundo plano con Notion**.
- **Panel Administrativo**: Los docentes pueden ver el progreso de los alumnos, revisar respuestas exactas, filtrar por módulo o alumno y exportar los datos a CSV o JSON.

## 5. REGLAS DE DISEÑO (TAILWIND CSS)
- **Mobile-first**: Clases base para móvil, clases prefijadas con `md:` o `sm:` para desktop.
- **Sidebar responsivo**: Menú "Off-canvas" en móvil, estático a la izquierda en escritorio.
- **Colores (definidos en `tailwind.config.js`)**:
  - `fondo`: Blanco
  - `textoBase`: Gris oscuro
  - `acento`: Azul primario
  - `exito`: Verde (✅)
  - `advertencia`: Naranja (😊)
  - `error`: Rojo (❌)

## 6. LÓGICA DE EVALUACIÓN
`evaluarRespuesta(userText, expectedArray)` en `utils/evaluation.js`:
- Normaliza todo el texto (`.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")`) eliminando mayúsculas y tildes.
- Evalúa si alguna cadena del `expectedArray` está *incluida* en `userText`.

## 7. ESTADO ACTUAL
La aplicación es funcional, con un sistema de autenticación completo, progreso sincronizado en la nube (Notion API), un panel administrativo avanzado para docentes, y 5 tipos de actividades interactivas (Respuesta libre, Verdadero/Falso, Relacionar conceptos, Sopa de letras y Crucigrama).
