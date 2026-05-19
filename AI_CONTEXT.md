# CONTEXTO DEL PROYECTO PARA IA (HANDOFF)

Este documento contiene el contexto completo de la arquitectura, decisiones de diseño y estado actual de la "Plataforma Educativa de Geografía" para facilitar la continuación del desarrollo por parte de otra Inteligencia Artificial.

## 1. OBJETIVO DEL PROYECTO
Construir una plataforma web educativa SPA (Single Page Application) sin backend, orientada a niños de 13-14 años, diseñada bajo la estrategia "Mobile-First" y utilizando React + Vite + Tailwind CSS. 

## 2. ARQUITECTURA Y ESTRUCTURA DE ARCHIVOS
La aplicación se rige por un esquema centralizado de datos (`data.json`) que alimenta componentes funcionales altamente desacoplados.

```text
src/
├── app/                  # (Reservado para futuros layouts de enrutamiento)
├── components/           # Componentes visuales y lógicos
│   ├── ContentRenderer.jsx # Itera sobre bloques JSON y renderiza HTML + Tooltips
│   ├── FreeTextActivity.jsx# Actividad: Respuesta Libre
│   ├── GlossaryTooltip.jsx # Componente visual interactivo (Hover/Click) para definiciones
│   ├── MatchingActivity.jsx# Actividad: Relacionar opciones con select
│   ├── ModuleCard.jsx      # UI de tarjeta de presentación de cada módulo
│   ├── ModuleList.jsx      # Contenedor de las tarjetas
│   ├── ProgressBar.jsx     # UI de progreso general del estudiante
│   ├── ScoreCard.jsx       # UI de calificación final mostrada al terminar actividad
│   └── TrueFalseActivity.jsx# Actividad: Verdadero/Falso
├── data/
│   └── data.json           # LA FUENTE DE LA VERDAD (Glosario, Módulos, Contenido, Preguntas)
├── hooks/
│   ├── useGlossary.jsx     # (Opcional/Legacy) Lógica de parseo del glosario
│   └── useProgress.jsx     # Interfaz con localStorage ('geografia_progreso')
├── utils/
│   ├── evaluation.js       # Contiene 'evaluarRespuesta' (case-insensitive, ignora acentos)
│   └── feedback.js         # Contiene 'getFeedback' (puntaje -> Emoji + Colores)
├── App.jsx               # Layout Principal (Header, Sidebar responsivo, Main area)
├── index.css             # Directivas de Tailwind y estilos base
└── main.jsx              # Punto de entrada de React
```

## 3. FUENTE DE DATOS (`data.json`)
Es el motor de la aplicación. Todo texto con la etiqueta `<glossary>palabra</glossary>` es interpretado en tiempo de ejecución por `ContentRenderer.jsx`, que busca esa "palabra" en el array `glossario` del mismo JSON y la reemplaza por un componente `GlossaryTooltip`.

Estructura de un Módulo:
- `id`, `numero`, `titulo`, `descripcion`
- `contenido.bloques`: Array de objetos que dictan el renderizado (`titulo-seccion`, `parrafo`, `lista`, etc).
- `actividad`: Objeto que define el tipo de evaluación al final del contenido (`respuesta-libre`, `verdadero-falso`, `matching`).

## 4. SISTEMA DE PROGRESO Y ESTADO
- **Almacenamiento**: No hay base de datos. Se usa `localStorage` bajo la llave `geografia_progreso`.
- **Estructura Guardada**:
  ```json
  {
    "1-tectonica-placas": {
      "act-tectonica-1": {
        "respuestas": { "tec-q1": "alfred wegener" },
        "calificacion": 100
      }
    }
  }
  ```
- **Flujo**:
  1. `App.jsx` carga el progreso inicial vía `useProgress()`.
  2. Pasa `savedProgress` como prop a las actividades.
  3. Si la actividad ya fue completada, inicializa los estados y muestra el `ScoreCard` directamente.
  4. Al pulsar "Siguiente Módulo", `App.jsx` calcula el siguiente ID y renderiza el nuevo contenido.

## 5. REGLAS DE DISEÑO (TAILWIND CSS)
- **Mobile-first**: Clases base para móvil, clases prefijadas con `md:` o `sm:` para desktop.
- **Sidebar**: En móvil es un menú "Off-canvas" (Slide over) oculto mediante clases de transición (`-translate-x-full`); en escritorio (`md:relative md:translate-x-0`) permanece fijo a la izquierda.
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
- Ejemplo: Si el array espera "wegener", la respuesta de usuario "creo que fue el cientifico wegener" es `true`.

## 7. QUÉ HACER A CONTINUACIÓN (PENDIENTES)
La aplicación es 100% funcional según el MVP requerido. Si deseas expandirla, podrías:
1. Agregar nuevos módulos en `data.json` agregando actividades como "crucigrama" o "identificación visual".
2. Mejorar accesibilidad añadiendo etiquetas `aria-` completas.
3. Permitir descargar el progreso del usuario en un archivo PDF o JSON.
