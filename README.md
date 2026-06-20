# Plataforma de Geografía - Primer Año

Plataforma web educativa interactiva basada en el modelo CDAVA (Medina, 2005) para la enseñanza de Geografía a estudiantes de primer año de educación media general (13-14 años).

## 🚀 Características Principales

- **Diseño Mobile-First**: Interfaz optimizada para teléfonos móviles, tablets y escritorio, utilizando Tailwind CSS.
- **Contenido Dinámico**: Todo el material de estudio, actividades y el glosario se alimentan de un único archivo estructural `data.json`.
- **Glosario Interactivo**: Las palabras clave dentro del texto se resaltan y muestran su definición mediante un Tooltip al hacer clic o pasar el mouse.
- **Múltiples Evaluaciones**: Soporta actividades interactivas integradas:
  - Preguntas de Respuesta Libre (búsqueda inteligente de palabras clave).
  - Preguntas de Verdadero/Falso.
  - Actividades de Relacionar Conceptos (Matching).
- **Sistema de Calificación Dual**: Genera puntuaciones de 0 a 100 acompañadas de emojis motivacionales (✅, 😊, ❌) basados en el rendimiento.
- **Persistencia de Datos**: Guarda automáticamente el progreso del estudiante (actividades completadas y puntuaciones) en el almacenamiento local del navegador (`localStorage`), permitiendo retomar el estudio sin necesidad de una base de datos o registro de usuario.

## 🛠 Tecnologías Utilizadas

- **React 18**
- **Vite**
- **Tailwind CSS** (Configurado con paleta de colores personalizada)
- **JavaScript/JSX**

## 💻 Instalación y Uso Local

1. Clona este repositorio o descarga los archivos.
2. Abre una terminal en la carpeta del proyecto (`plataforma-geografia`).
3. Instala las dependencias:
   ```bash
   pnpm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```
5. Abre tu navegador en la URL indicada (usualmente `http://localhost:5173`).

## 🌐 Despliegue (Deploy)

El proyecto está optimizado para ser desplegado fácilmente en plataformas gratuitas como **Vercel** o **Netlify**.

1. Sube el código a un repositorio de GitHub.
2. Conecta el repositorio a Vercel/Netlify.
3. La configuración por defecto de Vite será detectada automáticamente (`npm run build` y directorio `dist`).

## 📁 Estructura del Proyecto

- `/src/data/data.json`: Contiene toda la información teórica, preguntas y glosario.
- `/src/components/`: Componentes modulares de React (tarjetas, renderizador de contenido, actividades, etc).
- `/src/hooks/`: Hooks personalizados (`useGlossary` para tooltips y `useProgress` para guardar en localStorage).
- `/src/utils/`: Funciones puras de lógica (evaluación de texto, generación de feedback).
