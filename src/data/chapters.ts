import chapter1ChaseInk from '../stories/chapter1_chase.ink?raw';
import chapter2BanquetInk from '../stories/chapter1_banquet.ink?raw';
import chapter3ClandestineTamerInk from '../stories/chapter3_clandestine_tamer.ink?raw';
import puzzle1SunTrapInk from '../stories/puzzle1_suntrap.ink?raw';
import puzzle2RegigigasInk from '../stories/puzzle2_regigigas_boss.ink?raw';
import chapterLittleCupInk from '../stories/chapter_littlecup.ink?raw';
import duel1HonorInk from '../stories/duel1_honor1v1.ink?raw';
import chapter2MonotypeInk from '../stories/chapter2_monotype.ink?raw';
import archiveVgc2024Ink from '../stories/archive_vgc2024.ink?raw';
import challengeLastBastionInk from '../stories/challenge1_last_bastion.ink?raw';
import survivalGalarMinesInk from '../stories/survival1_galar_mines.ink?raw';
import showcaseTriplesPhalanxInk from '../stories/showcase_triples_phalanx.ink?raw';
import challengeThreeKnightsInk from '../stories/challenge2_three_knights.ink?raw';
import archiveGen1SilphInk from '../stories/archive_gen1_silph.ink?raw';
import archiveAnimeTobiasInk from '../stories/archive_anime_tobias.ink?raw';
import challengeWeatherTerrainsInk from '../stories/challenge_weather_terrains.ink?raw';
import {
  resolveAnimeAshVsTobiasBattle,
  resolveChampionLittleCupBattle,
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
  resolveChapter2MonotypeBattle,
  resolveClandestineTamerBattle,
  resolveDuel1Honor1v1Battle,
  resolveGen1SilphArchiveBattle,
  resolveLastBastionBattle,
  resolveMinesWave1Battle,
  resolveMinesWave2Battle,
  resolvePuzzle1SunTrapBattle,
  resolvePuzzle2RegigigasBattle,
  resolveThreeKnightsBattle,
  resolveTriplesPhalanxBattle,
  resolveVgcWorlds2024Battle,
  resolveWeatherTerrainsChallengeBattle,
} from '../engine/teamBuilderTree';
import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  CAMPAIGN_SINGLES_FORMAT_ID,
  type ChapterDefinition,
  type PersistedPartyState,
  type StoryFlags,
} from '../types/game';

export const CHAPTERS: ChapterDefinition[] = [
  /* ===================== HISTORIA ===================== */
  {
    id: 'ch1-wyndon-chase',
    category: 'story',
    number: 'CAPÍTULO 01',
    title: 'Cacería en los Callejones de Wyndon',
    subtitle: 'Una noche de lluvia lejos de la armería del palacio',
    tag: 'HISTORIA · 6V6 DOBLES',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex Dobles',
    difficulty: 'Campaña',
    description:
      'Las sirenas del palacio quedaron atrás bajo el aguacero. Solo con tu escolta diaria, tendrás que abrirte paso entre callejones cerrados mientras alguien que conoce tus pasos te pisa los talones.',
    accentColor: 'amber',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Arcanine', mode: 'player-ace' },
    featuredPokemon: ['Arcanine', 'Gardevoir', 'Milotic', 'Corviknight'],
    rivalPreview: 'Asesino Carmesí',
    rivalProfile: {
      name: 'Asesino Carmesí',
      title: 'Cazador de la Corona',
      bio: 'Mercenario contratado para interceptar al heredero lejos de la guardia real. Lleva meses estudiando la rutina del palacio.',
      tacticalInsight:
        'Pelea con cálculo frío; si pierde la paciencia o se confía, su propia prisa puede delatarle el siguiente movimiento.',
      archetypeTag: 'Campaña · Wyndon',
    },
    inkSource: chapter1ChaseInk,
    resolveBattleConfig: resolveChapter1ChaseBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const sabotage = String(flags.sabotage_plan ?? 'no_trap');
      if (won) {
        return {
          headline: 'Sobreviviente de la Torre del Reloj',
          subheadline:
            'El Asesino Carmesí se pierde entre la lluvia al ver desmoronarse su emboscada.',
          badgeText: 'VICTORIA · CAPÍTULO 01',
          paragraphs: [
            sabotage === 'no_trap'
              ? 'Resististe de frente sin recurrir a distracciones en los callejones. Incluso sin tu equipo de guerra, la escolta diaria demostró que la Corona no cae tan fácil.'
              : 'Cada decisión en medio de la fuga pesó en el patio de piedra. El mercenario se retira entre el vapor sabiendo que subestimó al heredero.',
            'El sello real sigue en tu bolsillo, aunque el silencio que cae sobre Wyndon anuncia que esto fue apenas la primera jugada.',
          ],
        };
      }
      return {
        headline: 'Acorralado bajo la Lluvia de Wyndon',
        subheadline:
          'El patio de la Torre del Reloj quedó en silencio cuando cedió tu última línea.',
        badgeText: 'DERROTA · REAGRUPAR',
        paragraphs: [
          'El cazador había planeado la noche entera para este encuentro. Puedes tomar otro camino durante la fuga o ajustar tus objetos y movimientos en el Teambuilder antes de volver a intentarlo.',
        ],
      };
    },
  },
  {
    id: 'ch2-monotype-banners',
    category: 'story',
    number: 'CAPÍTULO 02',
    title: 'Choque de Estandartes',
    subtitle: 'Decreto real en la frontera ocupada de Kalos',
    tag: 'MONOTYPE · 6V6 SINGLES',
    format: 'singles',
    formatId: 'gen9monotype',
    formatLabel: '6v6 Monotype',
    difficulty: 'Campaña',
    description:
      'Apenas cruzas el canal hacia la frontera ocupada de Kalos, los pendones oscuros de la Casa Rebelde te cierran el paso invocando el decreto antiguo de linaje puro.',
    accentColor: 'slate',
    teamEditPolicy: 'fixed',
    teamMode: 'challenge',
    showcaseSprite: { species: 'Corviknight', mode: 'player-ace' },
    featuredPokemon: ['Corviknight', 'Heatran', 'Gholdengo', 'Scizor'],
    rivalPreview: 'Comandante de la Casa Rebelde',
    rivalProfile: {
      name: 'Comandante Siniestro',
      title: 'Casa Rebelde del Estandarte Oscuro',
      bio: 'Noble insurrecto que invocó el viejo decreto de estandartes para desafiar a la Corona a campo abierto.',
      tacticalInsight:
        'Su vanguardia no busca un duelo limpio: prefiere ensuciar el terreno y castigar cada retirada.',
      archetypeTag: 'Monotype · Estandartes',
    },
    monotypeMatchup: { playerType: 'Steel', rivalType: 'Dark' },
    inkSource: chapter2MonotypeInk,
    resolveBattleConfig: resolveChapter2MonotypeBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'El Estandarte de Acero Permanece en Pie',
          subheadline:
            'Los pendones rebeldes se inclinan sobre el campo de ceniza.',
          badgeText: 'VICTORIA · CAPÍTULO 02',
          paragraphs: [
            'Tu línea de acero resistió el asedio y demostró ante los testigos de la corte que el metal de Galar todavía no se oxida.',
          ],
        };
      }
      return {
        headline: 'El Estandarte Oscuro Reclama el Campo',
        subheadline:
          'El desgaste de la batalla abierta terminó quebrando tu formación.',
        badgeText: 'DERROTA · REAGRUPAR',
        paragraphs: [
          'Reconsidera el orden de salida al iniciar el combate o fortalece a tu escuadrón antes de volver a cruzar los estandartes.',
        ],
      };
    },
  },
  {
    id: 'ch3-clandestine-tamer',
    category: 'story',
    number: 'CAPÍTULO 03',
    title: 'El Foso del Vínculo Roto',
    subtitle: 'Antorchas rojas en un puerto sin ley de Mesoa',
    tag: 'HISTORIA · 6V6 SINGLES',
    format: 'singles',
    formatId: CAMPAIGN_SINGLES_FORMAT_ID,
    formatLabel: 'NatDex Singles',
    difficulty: 'Campaña',
    description:
      'Fugitivo al otro lado del Atlántico, entras en un cuadrilátero clandestino de Mesoa donde un noble exiliado convierte el resentimiento en arma para los cárteles de crianza fuera del control de la CRU.',
    accentColor: 'rose',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Archaludon', mode: 'player-ace' },
    featuredPokemon: ['Archaludon', 'Ursaring', 'Corviknight'],
    rivalPreview: 'Lord Vexen',
    rivalProfile: {
      name: 'Lord Vexen',
      title: 'Domador Clandestino',
      bio: 'Aristócrata expulsado de la corte que dirige combates ilegales bajo la ciudad. Desprecia cualquier vínculo que no nazca del miedo.',
      tacticalInsight:
        'Sus Pokémon golpean con una furia contenida fuera de lo común; responder con fuerza bruta frente a frente rara vez sale barato.',
      archetypeTag: 'Campaña · Foso Clandestino',
    },
    inkSource: chapter3ClandestineTamerInk,
    resolveBattleConfig: resolveClandestineTamerBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const ally = String(flags.tamer_ally ?? 'rescued_ursaring');
      if (won) {
        return {
          headline: 'El Foso Queda Clausurado',
          subheadline:
            'La Guardia Real irrumpe en la cámara subterránea mientras las cerraduras ceden una tras otra.',
          badgeText: 'VICTORIA · CAPÍTULO 03',
          paragraphs: [
            ally === 'rescued_ursaring'
              ? 'El Ursaring que liberaste sostuvo la mirada de su antiguo captor hasta el último golpe. Cuando cayó el silencio, bajó los hombros por primera vez en meses.'
              : 'Mantuviste la calma ante la brutalidad del cuadrilátero y cerraste el negocio de Lord Vexen sin ceder un solo paso a sus reglas.',
          ],
        };
      }
      return {
        headline: 'Devuelto a la Oscuridad del Foso',
        subheadline:
          'La furia desatada sobre la arena subterránea rompió tu defensa.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Las bestias del foso castigan a cualquiera que intercambie golpes sin medir el desgaste. Ajusta tu preparación antes de bajar de nuevo.',
        ],
      };
    },
  },
  {
    id: 'ch2-banquet-ambush',
    category: 'story',
    number: 'BONUS 02',
    title: 'Emboscada en la Cena de Estado',
    subtitle: 'Apagón en el Salón de Cristal',
    tag: 'BONUS · SIN REGLAS',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex · Sin Reglas',
    difficulty: 'Bonus',
    description:
      'Las lámparas de cristal mueren de golpe y una risita rasposa cruza el humo violeta. Un saboteador sin escrúpulos trae trucos prohibidos al banquete real.',
    accentColor: 'indigo',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Zacian-Crowned', mode: 'player-ace' },
    featuredPokemon: ['Zacian-Crowned', 'Dragapult', 'Arcanine'],
    rivalPreview: 'El Hombre Rata',
    rivalProfile: {
      name: 'El Hombre Rata',
      title: 'Saboteador del Banquete · Sin Reglas',
      bio: 'Rata de alcantarilla con máscara de Zoroark, ballesta oculta y medallas robadas. Odia las peleas limpias y convierte cada turno en una trampa exasperante.',
      tacticalInsight:
        'Sus acompañantes casi no hacen daño directo, pero cada uno está hecho para sacarte de quicio mientras su verdadero verdugo acecha disfrazado.',
      archetypeTag: 'Bonus · Tramposo Sin Reglas',
    },
    inkSource: chapter2BanquetInk,
    resolveBattleConfig: resolveChapter2BanquetBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const mode = String(flags.team_mode ?? 'daily');
      if (won) {
        return {
          headline: 'La Cena de Estado Resiste el Atentado',
          subheadline:
            'El humo se disipa mientras las luces de emergencia devuelven el orden al salón.',
          badgeText: 'VICTORIA · BONUS 02',
          paragraphs: [
            mode === 'combat'
              ? 'El destello metálico del Código Corona bastó para recordar a los invitados extranjeros por qué nadie desafía a Galar a plena luz.'
              : 'Sofocaste la emboscada sin abrir siquiera la armería de guerra, manteniendo intacta la compostura del palacio.',
          ],
        };
      }
      return {
        headline: 'Evacuación de Emergencia',
        subheadline:
          'Los trucos sucios del infiltrado lograron desarmar tu formación entre el humo.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'En un salón cerrado, subestimar a un rival pequeño cuesta la pelea entera. Vuelve a entrar con otra lectura.',
        ],
      };
    },
  },

  /* ===================== PUZZLES ===================== */
  {
    id: 'puzzle-01-sun-trap',
    category: 'puzzles',
    number: 'PUZZLE 01',
    title: 'La Trampa del Sol',
    subtitle: '48°C en el Canal de Miraj, aire acondicionado adentro',
    tag: 'PUZZLE · 3V3 DOBLES',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Puzzle 3v3',
    difficulty: 'Puzzle',
    description:
      'La aduana de Miraj arde bajo un sol abrasador mientras una voz chillona suena desde una cabina móvil con aire acondicionado. Un niño conectado a seis pantallas bloquea tu paso hacia Oriente.',
    accentColor: 'orange',
    teamEditPolicy: 'fixed',
    teamMode: 'locked',
    showcaseSprite: { species: 'Sableye', mode: 'player-ace' },
    featuredPokemon: ['Sableye', 'Inkay', 'Ditto'],
    rivalPreview: 'El Estratega Solar',
    rivalProfile: {
      name: 'El Estratega Solar',
      title: 'Tirano del Ladder OU · Cabina con A/C',
      bio: 'Niño mimado en pijama, pantuflas de Snorlax y visor VR que controla a sus Pokémon a distancia desde una cabina refrigerada como si el combate real fuera un ranking en línea.',
      tacticalInsight:
        'Todo su dominio descansa sobre el impulso que ya acumuló antes de que llegaras. Si le quiebras el guion, su cabina entera entra en pánico.',
      archetypeTag: 'Puzzle · Sátira OU',
    },
    inkSource: puzzle1SunTrapInk,
    resolveBattleConfig: resolvePuzzle1SunTrapBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'Pantallazo Azul en la Cabina',
          subheadline:
            'Las seis pantallas se apagan de golpe mientras el aire acondicionado escupe vapor tibia sobre el patio.',
          badgeText: 'PUZZLE 01 COMPLETADO',
          paragraphs: [
            'Ningún visor VR reemplaza leer a un compañero a los ojos. Donde el Estratega Solar veía una partida resuelta desde su sillón, le diste la vuelta al tablero entero.',
          ],
        };
      }
      return {
        headline: 'Consumido por el Sol Intenso',
        subheadline:
          'Una risa distorsionada por el altavoz celebra desde la cabina refrigerada.',
        badgeText: 'PUZZLE FALLIDO · REINTENTAR',
        paragraphs: [
          'Observa el patrón repetitivo que programa desde su joystick y vuelve a intentarlo; cada pieza en tu equipo existe para desarmar su truco barato.',
        ],
      };
    },
  },
  {
    id: 'puzzle-02-regigigas',
    category: 'puzzles',
    number: 'PUZZLE 02',
    title: 'El Coloso Despertado',
    subtitle: 'Santuario rúnico ancestral en el Valle del Rift',
    tag: 'PUZZLE · JEFE RAID',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Jefe 6v6 NatDex',
    difficulty: 'Puzzle Jefe',
    description:
      'En el corazón salvaje de Kemetia, un ser colosal cubierto de musgo antiguo alza una llave brillante en una cámara anterior a la CRU. Cuando gira el sello, el sopor de Regigigas se evapora al instante.',
    accentColor: 'amber',
    teamEditPolicy: 'fixed',
    teamMode: 'locked',
    showcaseSprite: { species: 'Regigigas', mode: 'boss', label: 'Jefe' },
    featuredPokemon: ['Regigigas', 'Dragapult', 'Farigiraf'],
    rivalPreview: 'Guardián del Coloso',
    rivalProfile: {
      name: 'Guardián del Coloso',
      title: 'Ente Antiguo · Portador de la Llave Rúnica',
      bio: 'Gigante no humano de piel pálida, musgo vivo y mente ancestral. Empuña la llave que anula las ataduras de Regigigas y lo desata como soberano absoluto del santuario.',
      tacticalInsight:
        'Atacar al titán sin desmontar primero las capas y el sostén que el Guardián teje a su alrededor solo alargará la caída.',
      archetypeTag: 'Jefe · Santuario Antiguo',
    },
    inkSource: puzzle2RegigigasInk,
    resolveBattleConfig: resolvePuzzle2RegigigasBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'El Coloso Regresa al Reposo',
          subheadline:
            'El Guardián inclina su martillo de piedra mientras las runas de la llave se apagan en silencio.',
          badgeText: 'PUZZLE 02 COMPLETADO',
          paragraphs: [
            'Desarmaste capa por capa a una fortaleza viviente treinta niveles por encima de los tuyos. El ente antiguo asiente una sola vez antes de fundirse de nuevo con la penumbra del templo.',
          ],
        };
      }
      return {
        headline: 'El Titán Sigue en Pie',
        subheadline:
          'El brillo de la llave rúnica restaura la postura del coloso tras cada golpe.',
        badgeText: 'PUZZLE FALLIDO · REINTENTAR',
        paragraphs: [
          'Estudia qué mantiene en pie al coloso y aprovecha el Teambuilder si necesitas abrir un ángulo distinto antes de volver a desafiar al Guardián.',
        ],
      };
    },
  },

  /* ===================== FLASHBACKS ===================== */
  {
    id: 'flashback-lc-champion',
    category: 'flashbacks',
    number: 'FLASHBACK LC',
    title: 'La Prueba de la Campeona',
    subtitle: 'Un jardín soleado de hace diez años',
    tag: 'FLASHBACK · LITTLE CUP',
    format: 'singles',
    formatId: CAMPAIGN_SINGLES_FORMAT_ID,
    formatLabel: 'Little Cup',
    difficulty: 'Flashback',
    description:
      'Diez años atrás, en el jardín del palacio, sostienes las Poké Balls de tus primeras crías frente a la sonrisa serena de la Campeona. Su lección no conoce la piedad.',
    accentColor: 'purple',
    teamEditPolicy: 'fixed',
    teamMode: 'locked',
    showcaseSprite: { species: 'Growlithe', mode: 'player-ace' },
    featuredPokemon: ['Growlithe', 'Larvesta', 'Ralts'],
    rivalPreview: 'La Campeona',
    rivalProfile: {
      name: 'La Campeona',
      title: 'Soberana Invicta de Galar',
      bio: 'Mentora de infancia del Príncipe. Incluso cuando el combate es un juego entre crías, enseña como si la corona dependiera de ello.',
      tacticalInsight:
        'Jamás cede el ritmo del campo por cortesía. Si te desconcentras un turno, la brecha de experiencia se vuelve un muro.',
      archetypeTag: 'Flashback · Infancia',
    },
    inkSource: chapterLittleCupInk,
    resolveBattleConfig: resolveChampionLittleCupBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'La Promesa del Heredero',
          subheadline:
            'La Campeona aplaude despacio bajo el sol dorado del jardín.',
          badgeText: 'VICTORIA · FLASHBACK',
          paragraphs: [
            '«No retrocediste ni un paso, aunque sabías que la balanza estaba inclinada en tu contra. Recuerda esta tarde cuando el mundo real no te pida permiso para pelear.»',
          ],
        };
      }
      return {
        headline: 'Lección de la Tarde',
        subheadline:
          'La diferencia de temple se notó en cada intercambio del jardín.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'La Campeona te tiende la mano con una sonrisa tranquila: «Otra vez, pequeño. Mira cómo empieza la pelea antes de lanzar tu primera orden.»',
        ],
      };
    },
  },

  /* ===================== SHOWCASES COMPETITIVOS ===================== */
  {
    id: 'duel-01-honor-1v1',
    category: 'showcases',
    number: 'DUELO 01',
    title: 'Duelo de Honor',
    subtitle: 'Una lanza insumisa en la costa de Vayra',
    tag: 'SHOWCASE · 1V1 A MUERTE',
    format: 'singles',
    formatId: 'gen91v1',
    formatLabel: '1v1 · Pick 1',
    difficulty: 'Competitivo',
    description:
      'En las costas indómitas de Vayra, destrozadas por las guerras proxy de Galar, una guerrera clava su lanza frente a ti. Su reto no admite relevos ni escolta: un duelo 1v1 a muerte.',
    accentColor: 'rose',
    teamEditPolicy: 'fixed',
    teamMode: 'challenge',
    showcaseSprite: { species: 'Metagross', mode: 'player-ace' },
    featuredPokemon: ['Metagross', 'Gallade', 'Primarina'],
    rivalPreview: 'La Duelista de la Frontera',
    rivalProfile: {
      name: 'La Duelista de la Frontera',
      title: 'Guerrera Insumisa · Duelo a Muerte 1v1',
      bio: 'Guerrera curtida que viajó hasta Galar para cobrarle al heredero del imperio décadas de sometimiento sobre su tierra.',
      tacticalInsight:
        'Todo el duelo se decide en los segundos previos a lanzar la Poké Ball. Un solo gesto en su postura delata su jugada.',
      archetypeTag: 'Duelo a Muerte · 1v1',
    },
    inkSource: duel1HonorInk,
    resolveBattleConfig: resolveDuel1Honor1v1Battle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'El Círculo Dicta Tregua',
          subheadline:
            'La guerrera apoya la rodilla sobre la piedra tibia sin bajar jamás la mirada.',
          badgeText: 'VICTORIA · DUELO 01',
          paragraphs: [
            'Respetaste su desafío sin escudo ni escolta y ganaste en muerte súbita. Cuando retiras la orden de arresto y le abres paso hacia la mesa de paz, la frontera entera escucha el eco del duelo.',
          ],
        };
      }
      return {
        headline: 'Sentenciado en Muerte Súbita',
        subheadline:
          'La Duelista de la Frontera leyó tu apertura y cerró el duelo de un solo golpe.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Frente a alguien que pelea por la libertad de su pueblo no hay margen para dudar. Vuelve a leer su postura antes de que suene la campana.',
        ],
      };
    },
  },
  {
    id: 'archive-vgc-2024',
    category: 'showcases',
    number: 'ARCHIVO VGC',
    title: 'Final Mundial 2024: Luca vs. Yuta',
    subtitle: 'Simulación holográfica de Honolulu',
    tag: 'WORLDS · VGC REG G',
    format: 'doubles',
    formatId: 'gen9vgc2024regg',
    formatLabel: 'VGC 4v4 Nv. 50',
    difficulty: 'Competitivo',
    description:
      'Las pantallas del archivo real reconstruyen la gran final de Honolulu bajo reglas oficiales de torneo. Elige bando y mide tu templanza en el escenario más alto.',
    accentColor: 'sky',
    teamEditPolicy: 'fixed',
    teamMode: 'challenge',
    showcaseSprite: { species: 'Miraidon', mode: 'player-ace' },
    featuredPokemon: ['Miraidon', 'Calyrex-Ice'],
    rivalPreview: 'Finalista Mundial VGC 2024',
    rivalProfile: {
      name: 'Finalista Mundial 2024',
      title: 'Masters Finals · Honolulu',
      bio: 'Reconstrucción histórica de la final del Campeonato Mundial 2024 entre Italia y Japón.',
      tacticalInsight:
        'Quien controle el ritmo de velocidad y el clima dicta cada intercambio. Revisa el Open Teamsheet con calma.',
      archetypeTag: 'Archivo · VGC Reg G',
    },
    inkSource: archiveVgc2024Ink,
    resolveBattleConfig: resolveVgcWorlds2024Battle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const asYuta = String(flags.selected_player ?? 'luca') === 'yuta';
      const playerLabel = asYuta ? 'Yuta Ishigaki' : 'Luca Ceribelli';
      const rivalLabel = asYuta ? 'Luca Ceribelli' : 'Yuta Ishigaki';

      if (won) {
        return {
          headline: 'Ovación en el Archivo de Honolulu',
          subheadline: `${playerLabel} se impuso sobre ${rivalLabel} en el cierre del estadio holográfico.`,
          badgeText: 'VICTORIA · ARCHIVO VGC',
          paragraphs: [
            'La Campeona apaga la proyección con una inclinación de cabeza: «Sostener la calma bajo un escenario así marca la diferencia entre un buen entrenador y un soberano.»',
          ],
        };
      }
      return {
        headline: `El Estadio Se Inclina por ${rivalLabel}`,
        subheadline:
          'El control de ritmo rival terminó cerrando cada ventana del combate.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Puedes volver a estudiar el Open Teamsheet o cambiar de bando en la simulación para entender ambos lados del tablero.',
        ],
      };
    },
  },
  {
    id: 'showcase-triples-phalanx',
    category: 'showcases',
    number: 'CAPÍTULO C',
    title: 'La Falange de Hammerlocke',
    subtitle: 'Tres líneas bloqueando el paso hacia el Atlántico',
    tag: 'TRIPLES · GEN 6',
    format: 'triples',
    formatId: 'gen6triplescustomgame',
    formatLabel: 'Triples 6v6',
    difficulty: 'Táctico',
    description:
      'En el paso montañoso entre Kalos y Paldea, el Duque despliega su caballería en formación triple clásica para impedirte zarpar hacia América. El centro manda el tablero, pero los flancos deciden la guerra.',
    accentColor: 'indigo',
    teamEditPolicy: 'fixed',
    teamMode: 'challenge',
    showcaseSprite: { species: 'Gardevoir-Mega', mode: 'player-ace' },
    featuredPokemon: ['Gardevoir-Mega', 'Hitmontop', 'Talonflame'],
    rivalPreview: 'Duque de Hammerlocke',
    rivalProfile: {
      name: 'Duque de Hammerlocke',
      title: 'Comandante de la Falange',
      bio: 'Veterano estratega que aún instruye a su casa en el arte perdido de las formaciones de tres flancos.',
      tacticalInsight:
        'Su vanguardia pelea como un escudo cerrado; encontrar qué ataques alcanzan las esquinas opuestas abre la brecha.',
      archetypeTag: 'Triples · Hammerlocke',
    },
    inkSource: showcaseTriplesPhalanxInk,
    resolveBattleConfig: resolveTriplesPhalanxBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'La Falange Cede el Paso',
          subheadline:
            'El Duque inclina su estandarte azul cobalto frente a las murallas.',
          badgeText: 'VICTORIA · CAPÍTULO C',
          paragraphs: [
            '«Hacía años que nadie leía tres frentes al mismo tiempo con tanta claridad. Los flancos y el centro te respondieron como un solo latido.»',
          ],
        };
      }
      return {
        headline: 'La Falange Sostuvo la Muralla',
        subheadline:
          'La coordinación de los tres flancos enemigos frenó tu avance.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'En un campo triple la posición vale tanto como la potencia. Reacomoda tus flancos y vuelve a embestir.',
        ],
      };
    },
  },

  /* ===================== DESAFÍOS ===================== */
  {
    id: 'challenge-weather-terrains',
    category: 'challenges',
    number: 'DESAFÍO CLIMA',
    title: 'La Cabina de los 8 Elementos',
    subtitle: 'Domo climático colonial en Tamra y un Castform presumido',
    tag: 'DESAFÍO · CLIMAS Y TERRENOS',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex · 8 Modos',
    difficulty: 'Desafío',
    description:
      'El Estratega Solar secuestró un laboratorio de monzones de la CRU en Tamra para presumir los 4 climas y los 4 terrenos sin bajarse de su sillón refrigerado. Elige qué elemento enfrentar contra su preciado Castform.',
    accentColor: 'sky',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Castform', mode: 'boss', label: 'As Clima' },
    featuredPokemon: ['Castform', 'Gardevoir', 'Arcanine', 'Milotic'],
    rivalPreview: 'El Estratega Solar',
    rivalProfile: {
      name: 'El Estratega Solar',
      title: 'Tirano del Ladder OU · 8 Elementos',
      bio: 'Niño mimado en pijama manchada, pantuflas de Snorlax y visor VR que controla proyectores de Sol, Lluvia, Arena, Nieve y los 4 Terrenos desde su cabina.',
      tacticalInsight:
        'Cada simulación enseña reglas clave de clima o terreno, y siempre reserva a su sobrevalorado Castform ★ como remate final.',
      archetypeTag: 'Desafío · 4 Climas / 4 Terrenos',
    },
    inkSource: challengeWeatherTerrainsInk,
    resolveBattleConfig: resolveWeatherTerrainsChallengeBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const modeNames: Record<string, string> = {
        sun: 'Sol Intenso',
        rain: 'Lluvia Torrencial',
        sand: 'Tormenta de Arena',
        snow: 'Nieve Helada',
        electric: 'Campo Eléctrico',
        grassy: 'Campo de Hierba',
        psychic: 'Campo Psíquico',
        misty: 'Campo de Niebla',
      };
      const label = modeNames[String(flags.climate_mode ?? 'sun')] ?? 'Simulación Climática';
      if (won) {
        return {
          headline: `${label} Bajo Control`,
          subheadline:
            'El Estratega Solar arroja una lata vacía contra su monitor al ver caer a su preciado Castform.',
          badgeText: 'VICTORIA · 8 ELEMENTOS',
          paragraphs: [
            `Dominaste la simulación de ${label} sin recurrir a pantallas ni atajos. Puedes volver al domo cuando quieras para probar cualquiera de los otros siete climas y terrenos.`,
          ],
        };
      }
      return {
        headline: `Superado por ${label}`,
        subheadline:
          'Los proyectores del domo amplificaron la ventaja ambiental de la cabina rival.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          `Cada clima y terreno cambia por completo las reglas del combate. Aprovecha lo que acabas de ver en ${label} o prueba otra simulación del domo antes de volver a retarlo.`,
        ],
      };
    },
  },
  {
    id: 'challenge-last-bastion',
    category: 'challenges',
    number: 'CAPÍTULO A',
    title: 'El Último Bastión',
    subtitle: 'Un puente cerrado entre la niebla del puerto',
    tag: 'DESAFÍO · 1 VS 6',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: '1 vs 6 · NatDex',
    difficulty: 'Desafío',
    description:
      'Madrugada en los muelles de Wyndon. La niebla marina cierra ambas salidas del puente de carga y solo un compañero queda en pie frente a toda la cuadrilla portuaria.',
    accentColor: 'orange',
    teamEditPolicy: 'fixed',
    teamMode: 'locked',
    showcaseSprite: { species: 'Annihilape', mode: 'player-ace' },
    featuredPokemon: ['Annihilape'],
    rivalPreview: 'La Milicia de los Muelles',
    rivalProfile: {
      name: 'Capataz de los Muelles',
      title: 'La Milicia de los Muelles',
      bio: 'Matones del puerto que apuestan al número y al ruido para acorralar presas solitarias en los puentes de carga.',
      tacticalInsight:
        'Son demasiados para un espacio tan estrecho y rara vez se cuidan entre ellos cuando pierden la cabeza.',
      archetypeTag: 'Desafío · 1 vs 6',
    },
    inkSource: challengeLastBastionInk,
    resolveBattleConfig: resolveLastBastionBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'El Puente Permanece en Pie',
          subheadline:
            'La niebla del puerto se despeja mientras el último mercenario retrocede hacia las grúas.',
          badgeText: 'VICTORIA · CAPÍTULO A',
          paragraphs: [
            'Un solo compañero bastó para sostener el paso contra seis. Cada golpe que recibió solo endureció su postura hasta despejar el puente entero.',
          ],
        };
      }
      return {
        headline: 'Superado en el Puente de Carga',
        subheadline:
          'La avalancha de la cuadrilla portuaria terminó cerrándote el paso.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'En inferioridad numérica, elegir cuándo resistir y cuándo golpear marca toda la diferencia.',
        ],
      };
    },
  },
  {
    id: 'challenge-three-knights',
    category: 'challenges',
    number: 'CAPÍTULO D',
    title: 'El Juicio de los Tres Caballeros',
    subtitle: 'Guarnición naval de las Islas Bruma en Cordelia',
    tag: 'DESAFÍO · 1 VS 3',
    format: 'triples',
    formatId: 'gen6triplescustomgame',
    formatLabel: '1 vs 3 · Triples',
    difficulty: 'Desafío',
    description:
      'En los acantilados de Cordelia, tres caballeros despachados desde la base imperial de las Islas Bruma cierran media luna sobre tu barco: un solo representante contra los tres a la vez.',
    accentColor: 'rose',
    teamEditPolicy: 'fixed',
    teamMode: 'locked',
    showcaseSprite: { species: 'Charizard-Mega-Y', mode: 'player-ace' },
    featuredPokemon: ['Charizard-Mega-Y', 'Garchomp'],
    rivalPreview: 'Caín, Abel y Frey (Los Tres Jinetes)',
    rivalProfile: {
      name: 'Caín, Abel y Frey',
      title: 'Los Tres Jinetes · Islas Bruma',
      bio: 'Trío fornido y bigotón que se parece demasiado a sus Pokémon: Sir Caín (Escavalier), Sir Abel (Aegislash) y Sir Frey (Bisharp).',
      tacticalInsight:
        'Sir Abel marca el compás con su escudo mientras Sir Caín embiste de frente y Sir Frey espera el contragolpe.',
      archetypeTag: 'Desafío · 1 vs 3 · Caín, Abel y Frey',
    },
    inkSource: challengeThreeKnightsInk,
    resolveBattleConfig: resolveThreeKnightsBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'El Círculo Reconoce a su Comandante',
          subheadline:
            'Los tres caballeros bajan las lanzas al unísono sobre la piedra tibia.',
          badgeText: 'VICTORIA · CAPÍTULO D',
          paragraphs: [
            'Leíste su cadencia de escudo y golpeaste justo cuando la formación respiraba. El Consejo de Guerra abre sus puertas.',
          ],
        };
      }
      return {
        headline: 'La Tríada Sostuvo el Escudo',
        subheadline:
          'La media luna de acero repelió tu asalto en solitario.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Fíjate en el compás con el que alzan su defensa; golpear a destiempo desperdicia tu mejor turno.',
        ],
      };
    },
  },

  /* ===================== SUPERVIVENCIA (BACK-TO-BACK) ===================== */
  {
    id: 'survival-galar-mines',
    category: 'survival',
    number: 'CAPÍTULO B',
    title: 'Asedio en las Minas de Tarran',
    subtitle: 'Galerías del continente-prisión sin tiempo para curar',
    tag: 'SUPERVIVENCIA · BACK-TO-BACK',
    format: 'singles',
    formatId: CAMPAIGN_SINGLES_FORMAT_ID,
    formatLabel: 'NatDex · 2 Oleadas',
    difficulty: 'Supervivencia',
    description:
      'Tarran, Nivel Profundo 4. Las lámparas parpadean entre el polvo rojo del continente-prisión y dos escuadrones sellan la salida de la galería. Cada rasguño del primer choque te acompañará al segundo.',
    accentColor: 'amber',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Dragapult', mode: 'player-ace' },
    featuredPokemon: ['Dragapult', 'Arcanine', 'Corviknight'],
    rivalPreview: 'Bloqueo de las Minas',
    rivalProfile: {
      name: 'Bloqueo de las Minas',
      title: 'Zapadores y Guardia Corrupta',
      bio: 'Operativo en dos fases diseñado para desgastar a cualquiera que intente escapar por los túneles profundos.',
      tacticalInsight:
        'Salir vivo de la primera oleada no basta si llegas sin aliento a la boca del túnel. Cuida cada recurso.',
      archetypeTag: 'Supervivencia · Sin Curación',
    },
    inkSource: survivalGalarMinesInk,
    resolveBattleConfig: resolveMinesWave1Battle,
    resolveStageBattleConfig: (
      battleId: string,
      flags: StoryFlags,
      persistedPartyState?: PersistedPartyState
    ) => {
      if (battleId === 'mines_wave2') {
        return resolveMinesWave2Battle(flags, persistedPartyState);
      }
      return resolveMinesWave1Battle(flags);
    },
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'Aire Fresco Fuera de la Galería',
          subheadline:
            'El humo gris queda atrás mientras tu escuadrón cruza la boca de la mina.',
          badgeText: 'VICTORIA · CAPÍTULO B',
          paragraphs: [
            'Soportaste el estruendo de los túneles y rompiste el segundo cerco con las heridas aún abiertas. Nadie podrá sellar este paso otra vez.',
          ],
        };
      }
      return {
        headline: 'Atrapado en el Nivel Profundo 4',
        subheadline:
          'El desgaste acumulado entre ambas oleadas terminó doblando tus rodillas.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'En una fuga sin descanso, cada punto de salud y cada PP cuentan para lo que aguarda tras el humo.',
        ],
      };
    },
  },

  /* ===================== ARCHIVO HISTÓRICO (GEN 1) ===================== */
  {
    id: 'archive-gen1-silph',
    category: 'archive',
    number: 'CAPÍTULO E',
    title: 'Reliquia de Silph Co.',
    subtitle: 'Cinta sellada de la Era Antigua de Kanto',
    tag: 'ARCHIVO · GEN 1',
    format: 'singles',
    formatId: 'gen1customgame',
    formatLabel: 'Gen 1 · Clásico',
    difficulty: 'Archivo Jefe',
    description:
      'En la bóveda subterránea del archivo, un monitor de fósforo verde despierta un registro prohibido de Kanto: las reglas originales, sin objetos ni habilidades, frente al mito de Mewtwo.',
    accentColor: 'slate',
    teamEditPolicy: 'fixed',
    teamMode: 'challenge',
    showcaseSprite: { species: 'Mewtwo', mode: 'boss', label: 'Jefe' },
    featuredPokemon: ['Mewtwo', 'Tauros', 'Alakazam'],
    rivalPreview: 'El Archivista Real',
    rivalProfile: {
      name: 'El Archivista Real',
      title: 'Custodio de la Bóveda Silph',
      bio: 'Erudito obsesionado con preservar los duelos de una época más cruda, donde la velocidad decidía los golpes críticos y no existían objetos.',
      tacticalInsight:
        'Las reglas modernas no sirven aquí: en la Era Antigua, la parálisis, el sueño y el sacrificio calculado cambian el mundo entero.',
      archetypeTag: 'Archivo · Era Antigua',
    },
    inkSource: archiveGen1SilphInk,
    resolveBattleConfig: resolveGen1SilphArchiveBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'La Reliquia de Silph Co. Dominada',
          subheadline:
            'El monitor de fósforo verde parpadea en calma al cerrarse la simulación.',
          badgeText: 'VICTORIA · ARCHIVO GEN 1',
          paragraphs: [
            'El Archivista Real se quita los lentes con una sonrisa de asombro: «Incluso frente al experimento más temido de Kanto, la vieja escuela no ha perdido un ápice de filo.»',
          ],
        };
      }
      return {
        headline: 'Presión Psíquica Imparable',
        subheadline:
          'El poder bruto de la Era Antigua cerró el registro antes de tiempo.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'En un mundo sin objetos ni habilidades, controlar el estado del rival pesa más que cualquier golpe aislado.',
        ],
      };
    },
  },

  /* ===================== ARCHIVO ANIME ===================== */
  {
    id: 'anime-ash-vs-tobias',
    category: 'anime',
    number: 'ARCHIVO ANIME',
    title: 'Liga de Sinnoh — Ash vs. Tobías',
    subtitle: 'Semifinales de la Conferencia del Valle Lirio',
    tag: 'ARCHIVO ANIME · 6V6',
    format: 'singles',
    formatId: CAMPAIGN_SINGLES_FORMAT_ID,
    formatLabel: 'NatDex Singles',
    difficulty: 'Archivo',
    description:
      'El estadio del Valle Lirio contiene el aliento. Un entrenador envuelto en rumores sube al podio frente a Ash y Pikachu, y nadie en las gradas sabe realmente qué guarda en su cinturón.',
    accentColor: 'purple',
    teamEditPolicy: 'fixed',
    teamMode: 'locked',
    showcaseSprite: { species: 'Pikachu', mode: 'player-ace' },
    featuredPokemon: ['Pikachu', 'Sceptile', 'Heracross', 'Swellow'],
    rivalPreview: 'Tobías',
    rivalProfile: {
      name: 'Tobías',
      title: 'El Misterio del Valle Lirio',
      bio: 'Participante silencioso que barrió los gimnasios de Sinnoh sin mostrar jamás su equipo completo. Las gradas solo murmuran leyendas sobre él.',
      tacticalInsight:
        'Su poder individual parece sacado de un mito, pero los combates largos siempre revelan grietas cuando alguien depende solo de su fama.',
      archetypeTag: 'Archivo · Liga de Sinnoh',
    },
    inkSource: archiveAnimeTobiasInk,
    resolveBattleConfig: resolveAnimeAshVsTobiasBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'Historia Reescrita en el Valle Lirio',
          subheadline:
            'El estadio entero estalla cuando cae la última Poké Ball de Tobías.',
          badgeText: 'VICTORIA · LIGA DE SINNOH',
          paragraphs: [
            'Pikachu salta al hombro de Ash mientras las gradas rugen como nunca antes. Por primera vez, el misterio de Tobías encontró un muro que no pudo derribar.',
          ],
        };
      }
      return {
        headline: 'El Telón Cae en el Valle Lirio',
        subheadline:
          'El peso de los mitos volvió a inclinar la semifinal de Sinnoh.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Ahora conoces un poco más de lo que escondía tras esa capa oscura. Ajusta tu estrategia y vuelve a subir al podio.',
        ],
      };
    },
  },
];
