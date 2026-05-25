# Contexto del Proyecto: Plataforma de Geografía

Este documento consolida toda la información, contexto y detalles técnicos del proyecto "Plataforma de Geografía" para facilitar su entendimiento, desarrollo y mantenimiento.

## 1. Descripción General del Proyecto
Plataforma web educativa interactiva orientada a estudiantes de primer año de educación media general (13-14 años), diseñada para enseñar Geografía. El proyecto sigue el modelo pedagógico CDAVA (Medina, 2005). Es una Single Page Application (SPA) construida sin un backend tradicional, donde toda la información fluye desde un archivo de datos local.

## 2. Características Principales
- **Diseño Mobile-First**: Interfaz completamente responsiva optimizada para teléfonos, tablets y computadoras de escritorio, utilizando Tailwind CSS para su diseño visual.
- **Contenido Dinámico Centralizado**: Todo el contenido educativo (teoría, actividades, glosario) proviene de un único archivo `data.json`.
- **Glosario Interactivo**: Las palabras clave en los textos son detectadas mediante etiquetas (ej. `<glossary>palabra</glossary>`) y presentan tooltips con su definición al pasar el ratón o hacer clic.
- **Múltiples Formatos de Evaluación**:
  - **Respuesta Libre**: Verificación de texto mediante búsqueda inteligente de palabras clave, ignorando acentos y mayúsculas.
  - **Verdadero o Falso**: Actividades clásicas de selección binaria.
  - **Matching (Relacionar Conceptos)**: Seleccionar la opción correcta que corresponde a un concepto específico.
  - **Sopa de Letras (Word Search)**: Actividad interactiva para encontrar palabras clave en una cuadrícula generada dinámicamente.
- **Sistema de Calificación Dual**: Asigna puntuaciones del 0 al 100 y ofrece retroalimentación visual con emojis y colores (✅ Éxito, 😊 Regular, ❌ Error).
- **Sistema de Autenticación**: Gestión de sesiones de estudiantes y administradores, asegurando acceso protegido y personalizado.
- **Persistencia y Sincronización de Datos**: Guarda el avance del estudiante en el `localStorage` aislado mediante namespacing (`ID de usuario`) para evitar cruce de datos en equipos compartidos, y sincroniza el progreso en background con una base de datos en Notion.

## 3. Tecnologías y Stack Técnico
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS (con paleta de colores personalizada)
- **Lenguaje**: JavaScript (ES6+) y JSX
- **Despliegue**: Preparado para servicios como Vercel o Netlify.

## 4. Arquitectura y Estructura de Archivos
La arquitectura se basa en componentes funcionales desacoplados que consumen datos del archivo central.

```text
src/
├── components/           # Componentes modulares de React
│   ├── ContentRenderer.jsx # Itera bloques JSON y renderiza HTML y tooltips del glosario
│   ├── FreeTextActivity.jsx# Maneja las actividades de respuesta libre
│   ├── GlossaryTooltip.jsx # Renderiza el tooltip interactivo para el glosario
│   ├── MatchingActivity.jsx# Maneja las actividades de relacionar conceptos
│   ├── ModuleCard.jsx      # Tarjeta visual para presentar módulos
│   ├── ModuleList.jsx      # Contenedor para la lista de módulos
│   ├── ProgressBar.jsx     # Barra de progreso visual
│   ├── ScoreCard.jsx       # Interfaz de calificación final tras completar una actividad
│   ├── TrueFalseActivity.jsx# Maneja las actividades de verdadero/falso
│   └── WordSearchActivity.jsx# Maneja la actividad de sopa de letras
├── auth/                   # Componentes de autenticación
│   ├── LoginPage.jsx       # Acceso para estudiantes
│   └── RegisterPage.jsx    # Registro de estudiantes
├── admin/                  # Componentes de administración
│   ├── AdminLoginPage.jsx  # Acceso para administradores
│   └── AdminDashboard.jsx  # Tablero de reportes de estudiantes
├── data/
│   └── data.json           # Fuente central de verdad (Módulos, Preguntas, Glosario)
├── hooks/
│   ├── useAuth.js          # Gestión del estado de autenticación de usuarios
│   ├── useGlossary.jsx     # Lógica para procesar y exponer el glosario
│   ├── useNotionProgress.ts# Sincronización de progreso con Notion y fallback offline
│   └── useProgress.jsx     # (Legacy) Gestión del progreso local
├── utils/
│   ├── evaluation.js       # Lógica pura de evaluación (comparación de textos, acentos)
│   └── feedback.js         # Lógica para asignar emojis/colores según puntaje
├── App.jsx               # Layout principal (Header, Sidebar, Main)
├── index.css             # CSS global y directivas de Tailwind
└── main.jsx              # Punto de entrada de la aplicación React
```

## 5. Fuente de Datos (`data.json`)
El archivo `src/data/data.json` es el núcleo de la aplicación. 
- **Estructura de Módulos**: Define propiedades como `id`, `numero`, `titulo`, y `descripcion`.
- **Contenido**: Dentro de cada módulo, `contenido.bloques` contiene un array que indica el tipo de renderizado (`titulo-seccion`, `parrafo`, `lista`, etc.).
- **Actividades**: Define la evaluación al final del módulo (`respuesta-libre`, `verdadero-falso`, `matching`).
- **Glosario**: Un arreglo con las definiciones. `ContentRenderer.jsx` reemplaza las palabras envueltas en `<glossary>` en tiempo de ejecución.

## 6. Funciones Integradas y Lógica de Negocio

### 6.1. Sistema de Evaluación (`utils/evaluation.js`)
La función principal `evaluarRespuesta(userText, expectedArray)`:
- **Normalización**: Transforma la entrada del usuario a minúsculas, elimina espacios en blanco al inicio/final y remueve tildes (`.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`).
- **Comparación Flexible**: Evalúa si alguna de las cadenas clave definidas en `expectedArray` está incluida dentro del texto escrito por el usuario, permitiendo respuestas naturales pero precisas (ej. respuesta esperada: "wegener", respuesta usuario: "fue alfred wegener" -> Correcto).

### 6.2. Sistema de Retroalimentación (`utils/feedback.js`)
La función `getFeedback(score)`:
- Transforma un puntaje numérico en un objeto de retroalimentación visual y de texto.
- Asigna colores (verde, naranja, rojo) y emojis basados en el rendimiento.

### 6.3. Gestión de Progreso y Sincronización (`hooks/useNotionProgress.ts`)
- Utiliza la clave aislada `geografia_progreso_[studentPageId]` en el `localStorage` para prevenir que estudiantes en un mismo dispositivo compartan caché de progreso.
- Estructura guardada por módulo y actividad, almacenando las respuestas enviadas y la calificación obtenida.
- Flujo: `App.jsx` carga el estado inicial, lo sincroniza en background con la API de Notion al responder actividades, y pasa el estado local a los componentes para retroalimentación inmediata.

### 6.4. Sistema de Autenticación (`hooks/useAuth.js`)
- Gestiona el acceso de estudiantes y administradores, asegurando que las vistas (como el progreso y el Dashboard de administrador) sean exclusivas según el rol del usuario autenticado.

## 7. Diseño y UI (Tailwind CSS)
- **Sidebar**: Implementa un menú "Off-canvas" en móviles que se despliega desde un lado. En pantallas grandes, permanece estático a la izquierda.
- **Paleta de Colores (`tailwind.config.js` / Clases útiles)**:
  - Fondo general: Blanco
  - Texto principal: Gris oscuro
  - Acentos: Azul primario
  - Estados: Verde (Éxito), Naranja (Advertencia/Regular), Rojo (Error)

## 8. Consideraciones para Futuros Desarrollos
- El proyecto es un MVP (Producto Mínimo Viable) funcional.
- Las expansiones recomendadas incluyen:
  - Añadir nuevos tipos de módulos y actividades (ej. mapas interactivos, crucigramas).
  - Mejoras de accesibilidad (atributos ARIA).
  - Funcionalidad para exportar el progreso del estudiante (PDF o JSON).
