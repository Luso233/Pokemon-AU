# Crown of Galar — Novela Visual + Simulador Táctico Pokémon

Prototipo jugable que combina **React 19 + TypeScript + Tailwind CSS**, un motor narrativo profesional headless (**Ink / `inkjs`**), un **Árbol de Decisiones → Inyector de Teambuilder Showdown**, y el motor de combate real de Pokémon Showdown (**`@pkmn/sim`** + **`@pkmn/img`**) corriendo 100% local en el navegador.

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre la URL local que muestre Vite (normalmente `http://localhost:5173`).

### Comandos útiles

- `npm run dev` — Servidor de desarrollo local
- `npm run test:engine` — Prueba automatizada de Ink, el árbol de decisiones y combates completos en `@pkmn/sim` (incluyendo Arceus vs 6 Magikarp y Dobles 2v2)
- `npm run build` — Verificación TypeScript + compilación de producción

## Flujo de juego (Loop completo)

1. **Home Page (`src/components/HomePage.tsx`)**: Portada del proyecto y acceso rápido al capítulo de pruebas.
2. **Selector de Capítulos (`src/components/ChapterSelect.tsx`)**:
   - **Capítulo 00 (Testing MVP · Singles)**: *El Juicio del Estanque Real* — Toma decisiones que cambian el set de **Arceus** (120 Atk / 120 SpA: Físico, Especial o Placa Trueno), si llevas escolta o vas solo (1v6), y qué llevan los **6 Magikarp** rivales (Nv. 50 Salpicadura vs Nv. 100 con objetos competitivos).
   - **Capítulo 01 (Lore Galar AU · Dobles 2v2)**: *Emboscada en la Cena de Estado* — Elige entre el Equipo de Vida Diaria o el Equipo de Combate, define el set físico/especial de tu atacante mixto y enfrenta a un sicario ≤400 BST (incluyendo Ditto Impostor + Pañuelo Elegido).
3. **Novela Visual (`src/components/VisualNovelView.tsx` + `src/stories/*.ink`)**: Diálogos con efecto *typewriter*, etiquetas visuales (`# bg`, `# speaker`, `# pokemon`, `# side`), variables Ink en vivo e historial.
4. **Árbol de Decisiones → Teambuilder (`src/engine/teamBuilderTree.ts` + `src/components/TeambuilderBriefing.tsx`)**: Compila las variables de Ink en texto estándar **Showdown Paste** (visible y editable antes de pelear) y lo inyecta con `Teams.import()` → `Teams.pack()`.
5. **Arena de Combate (`src/engine/battleEngine.ts` + `src/components/BattleArena.tsx`)**: Ejecuta `@pkmn/sim` en Singles o Dobles 2v2 con IA táctica heurística (`src/engine/tacticalAI.ts`) y sprites de `@pkmn/img`.
6. **Epílogo (`src/components/EpilogueView.tsx`)**: Cierra el capítulo según victoria/derrota y decisiones, guardando progreso en `localStorage`.

## Cómo agregar un nuevo capítulo

1. Crea un archivo `src/stories/chapterX.ink` con tus `VAR` y ramas de diálogo (puedes escribirlo en VS Code o en el editor gratuito **Inky**).
2. Agrega la función resolvedora en `src/engine/teamBuilderTree.ts` que lea las `StoryFlags` y llame a `buildShowdownPaste(...)`.
3. Registra el capítulo en `src/data/chapters.ts`.
