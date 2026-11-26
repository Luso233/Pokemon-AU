import chapter1ChaseInk from '../stories/chapter1_chase.ink?raw';
import chapter2BanquetInk from '../stories/chapter1_banquet.ink?raw';
import puzzle1SunTrapInk from '../stories/puzzle1_suntrap.ink?raw';
import chapterLittleCupInk from '../stories/chapter_littlecup.ink?raw';
import duel1HonorInk from '../stories/duel1_honor1v1.ink?raw';
import chapter2MonotypeInk from '../stories/chapter2_monotype.ink?raw';
import archiveVgc2024Ink from '../stories/archive_vgc2024.ink?raw';
import {
  resolveChampionLittleCupBattle,
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
  resolveChapter2MonotypeBattle,
  resolveDuel1Honor1v1Battle,
  resolvePuzzle1SunTrapBattle,
  resolveVgcWorlds2024Battle,
} from '../engine/teamBuilderTree';
import type { ChapterDefinition, StoryFlags } from '../types/game';

export const CHAPTERS: ChapterDefinition[] = [
  /* ===================== HISTORIA ===================== */
  {
    id: 'ch1-wyndon-chase',
    category: 'story',
    number: 'CAPÍTULO 01',
    title: 'Cacería en los Callejones de Wyndon',
    subtitle: 'Príncipe Rubio vs. Asesino Carmesí · 6v6 Dobles con IA Scripteada',
    tag: 'HISTORIA · 6V6 DOBLES',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: '6v6 Dobles · Tera',
    difficulty: 'Táctico Counter (Editable por decisiones)',
    description:
      'Huyendo bajo la lluvia de Wyndon solo con tu Equipo de Vida Diaria, enfrentas al Asesino Carmesí cuyo equipo 6v6 (Grafaiai, Kingambit, Slowking-Galar, Gholdengo, Heatran, Rillaboom) fue diseñado para destruir el tuyo. Tus 4 decisiones alteran leads, sabotean objetos y exponen turnos scripteados.',
    accentColor: 'amber',
    featuredPokemon: ['Arcanine', 'Gardevoir', 'Grafaiai', 'Kingambit'],
    rivalPreview: 'Asesino Carmesí · Equipo Anti-Príncipe 6v6',
    inkSource: chapter1ChaseInk,
    resolveBattleConfig: resolveChapter1ChaseBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const sabotage = String(flags.sabotage_plan ?? 'no_trap');
      const mind = String(flags.mind_game ?? 'cold_silence');
      if (won) {
        return {
          headline: 'Supervivencia en la Torre del Reloj',
          subheadline:
            'El Asesino Carmesí retrocede entre la lluvia tras ver caer su estrategia counter.',
          badgeText: 'VICTORIA · PERSECUCIÓN SUPERADA',
          paragraphs: [
            sabotage === 'no_trap'
              ? '¡Hazaña táctica! Derrotaste al Asesino Carmesí sin sabotear ninguno de sus objetos y con su Ace Kingambit ★ rompiendo el límite de nivel.'
              : 'Tus decisiones durante la persecución marcaron la diferencia: desarmaste un equipo diseñado específicamente para neutralizar tu escolta diaria.',
            mind === 'cold_silence'
              ? 'Incluso con su protocolo frío e implacable activo, lograste leer sus turnos scripteados y quebrar su formación.'
              : 'Engañar a su IA leyendo sus patrones psicológicos te permitió darle la vuelta a una desventaja diseñada para ser letal.',
          ],
        };
      }
      return {
        headline: 'Acorralado bajo la Lluvia de Wyndon',
        subheadline:
          'El equipo counter del Asesino Carmesí logró neutralizar tu Equipo de Vida Diaria.',
        badgeText: 'DERROTA · REAGRUPAR ESTRATEGIA',
        paragraphs: [
          'El equipo del Asesino está construido pieza por pieza contra tus sets base. Rejuega la persecución para sabotear sus objetos, activar Mental Herb en Gardevoir o provocar su IA.',
        ],
      };
    },
  },
  {
    id: 'ch2-monotype-banners',
    category: 'story',
    number: 'CAPÍTULO 02',
    title: 'Choque de Estandartes',
    subtitle: 'Batalla de Casas Nobles · Monotype Acero vs. Siniestro (Lead 1 de 6)',
    tag: 'MONOTYPE · 6V6 SINGLES',
    format: 'singles',
    formatId: 'gen9monotype',
    formatLabel: '6v6 Singles · Monotype',
    difficulty: 'Competitivo Oficial (gen9monotype)',
    description:
      'Por decreto real, cada Casa Noble debe combatir únicamente con Pokémon que compartan el tipo de su estandarte. Defiende el Estandarte de Acero (Corviknight, Heatran, Gholdengo, Archaludon, Iron Treads, Scizor) frente al Estandarte Siniestro rebelde con Team Preview interactivo.',
    accentColor: 'slate',
    featuredPokemon: ['Corviknight', 'Heatran', 'Gholdengo', 'Samurott-Hisui'],
    rivalPreview: 'Estandarte Siniestro · Samurott-H, Ting-Lu, Meowscarada, Greninja',
    monotypeMatchup: { playerType: 'Steel', rivalType: 'Dark' },
    inkSource: chapter2MonotypeInk,
    resolveBattleConfig: resolveChapter2MonotypeBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'El Estandarte de Acero Prevalece',
          subheadline:
            'La formación de la Corona demostró su sinergia de tipos secundarios frente al asedio Siniestro.',
          badgeText: 'VICTORIA · MONOTYPE ACERO',
          paragraphs: [
            'Superaste las Púas de Samurott-Hisui y la presión de Greninja/Meowscarada cubriendo cada debilidad del tipo Acero en formato oficial gen9monotype.',
          ],
        };
      }
      return {
        headline: 'El Estandarte Siniestro Avanza',
        subheadline:
          'Los peligros de entrada y la presión ofensiva Siniestra doblegaron la muralla de Acero.',
        badgeText: 'DERROTA · REAJUSTAR DOCTRINA',
        paragraphs: [
          'Prueba alternar entre Doctrina Velocidad (Gholdengo Scarf + Heatran Air Balloon) y Doctrina Muralla, o cambia tu Lead en el Team Preview.',
        ],
      };
    },
  },
  {
    id: 'ch2-banquet-ambush',
    category: 'story',
    number: 'BONUS 02',
    title: 'Emboscada en la Cena de Estado',
    subtitle: 'Bonus AU Galar · Combate Doble 2v2 (≤400 BST)',
    tag: 'BONUS · DOBLES 2V2',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: 'Dobles 2v2 · ≤400 BST',
    difficulty: 'Early Game ≤400 BST (Sets Showdown)',
    description:
      'Apagón en el Salón de Estado. Decide entre tu Equipo de Vida Diaria o desplegar el Código Corona (Zacian-Crowned + Dragapult físico/especial) contra un escuadrón sucio de Showdown ≤400 BST.',
    accentColor: 'indigo',
    featuredPokemon: ['Zacian-Crowned', 'Dragapult', 'Smeargle'],
    rivalPreview: 'Sicario ≤400 BST · Inteligencia parcial 2/4',
    inkSource: chapter2BanquetInk,
    resolveBattleConfig: resolveChapter2BanquetBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const mode = String(flags.team_mode ?? 'daily');
      if (won) {
        return {
          headline: 'La Corona Resiste el Atentado',
          subheadline: 'El sicario cae antes de que cedan las puertas blindadas.',
          badgeText: 'VICTORIA · EMBOSCADA NEUTRALIZADA',
          paragraphs: [
            mode === 'combat'
              ? 'Zacian y tu Equipo de Combate recordaron a los embajadores extranjeros por qué nadie desafía abiertamente a Galar.'
              : 'Tu Equipo de Vida Diaria neutralizó el sabotaje sin siquiera abrir la armería real.',
          ],
        };
      }
      return {
        headline: 'Evacuación de Emergencia',
        subheadline: 'El sicario rompió tu formación en el Salón de Estado.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Un solo turno mal calculado contra Espora, Fuego Fatuo o Ditto Impostor cuesta la partida.',
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
    subtitle: 'Puzzle 3v3 Dobles · Condiciones Iniciales + Turnos 1 y 2 Scripteados',
    tag: 'PUZZLE TÁCTICO · 3V3 DOBLES',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: 'Puzzle 3v3 Dobles',
    difficulty: 'Acertijo Táctico (Desventaja Inicial)',
    description:
      'Empiezas bajo Sol Intenso, Viento Afín rival, Trampa Rocas en tu lado y Sableye al 65% PS frente a Mega Metagross (+2 Atk, +1 Spe) y Volcarona (+2 SpA, +2 SpD, +2 Spe). Usa a Inkay (Topsy-Turvy / Trick Room), Sableye (Fake Out / Quash) y Ditto (Imposter) para darle la vuelta al guion enemigo.',
    accentColor: 'orange',
    featuredPokemon: ['Inkay', 'Sableye', 'Ditto', 'Metagross-Mega'],
    rivalPreview: 'Mega Metagross (+2/+1), Volcarona (+2/+2/+2), Garchomp',
    inkSource: puzzle1SunTrapInk,
    resolveBattleConfig: resolvePuzzle1SunTrapBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: '¡Puzzle Resuelto: La Trampa Invertida!',
          subheadline:
            'Voltaste las condiciones imposibles del Sol Intenso en contra de su creador.',
          badgeText: 'PUZZLE COMPLETADO · 3/3 KO',
          paragraphs: [
            'Invertir boosts con Topsy-Turvy, robar turnos con Fake Out/Quash y copiar amenazas potenciadas con Ditto demuestra el núcleo del diseño táctico de Crown of Galar.',
          ],
        };
      }
      return {
        headline: 'Atrapado bajo el Sol Intenso',
        subheadline:
          'Los boosts de Mega Metagross y Volcarona arrasaron la formación.',
        badgeText: 'PUZZLE FALLIDO · REINTENTAR',
        paragraphs: [
          'Recuerda el guion enemigo: en Turno 1 Volcarona usa Heat Wave y Mega Metagross ataca a Inkay con Meteor Mash; en Turno 2 Mega Metagross tira Bullet Punch a Inkay.',
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
    subtitle: 'Príncipe (6 años · Nv. 5) vs. La Campeona (Meta S-Tier Little Cup · Nv. 6–7)',
    tag: 'LITTLE CUP NV. 5 VS NV. 6–7',
    format: 'singles',
    formatId: 'gen9customgame',
    formatLabel: 'Little Cup Nv. 5 vs Nv. 6–7',
    difficulty: 'Pesadilla Amistosa (Cap Roto en gen9customgame)',
    description:
      'Recuerdo de infancia contra La Campeona de Galar. Juegas con las preevoluciones Nivel 5 de tu futuro equipo real (Larvesta, Growlithe, Rookidee, Larvitar, Gible, Ralts) contra un núcleo opresivo Nivel 6 (Onix, Mienfoo, Foongus, Gastly, Pawniard) liderado por su As Vullaby ★ Nivel 7.',
    accentColor: 'purple',
    featuredPokemon: ['Larvesta', 'Larvitar', 'Ralts', 'Vullaby'],
    rivalPreview: 'La Campeona · Meta S-Tier LC Nv. 6 + Vullaby ★ Nv. 7',
    inkSource: chapterLittleCupInk,
    resolveBattleConfig: resolveChampionLittleCupBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'La Promesa del Heredero',
          subheadline:
            'La Campeona sonríe genuinamente sorprendida al ver caer a su Vullaby Nivel 7.',
          badgeText: 'VICTORIA · LITTLE CUP SUPERADO',
          paragraphs: [
            '«Increíble... con dos niveles de desventaja lograste desmontar doble Regenerator y tumbar a Vullaby. Algún día estas seis crías protegerán toda la Corona de Galar.»',
          ],
        };
      }
      return {
        headline: 'Lección de la Campeona',
        subheadline:
          'La diferencia de estadísticas de Nivel 6 y 7 en Little Cup se hizo sentir.',
        badgeText: 'DERROTA · INTENTAR OTRA RUTA',
        paragraphs: [
          'Consejo táctico: frena las rocas de Onix en Turno 1 con Rookidee (Taunt) o Larvitar (Rock Blast), y reserva a Ralts con Focus Sash + Destiny Bond para Vullaby ★ Nivel 7.',
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
    subtitle: 'Juicio por Combate Aristocrático · Showcase 1v1 (Bring 3, Pick 1)',
    tag: 'SHOWCASE 1V1 · MUERTE SÚBITA',
    format: 'singles',
    formatId: 'gen91v1',
    formatLabel: '1v1 · Bring 3, Pick 1',
    difficulty: 'Lectura de Team Preview (gen91v1)',
    description:
      'Las reglas de la corte prohíben equipos completos: ambos muestran 3 Pokémon y eligen solo 1 para un combate sin cambios. Lee la pista narrativa de Ink y supera el triángulo táctico (Gallade, Primarina, Metagross vs. Iron Crown, Skeledirge, Urshifu).',
    accentColor: 'rose',
    featuredPokemon: ['Gallade', 'Primarina', 'Metagross', 'Iron Crown'],
    rivalPreview: 'Duelista Rival · Iron Crown, Skeledirge, Urshifu (Elige 1)',
    inkSource: duel1HonorInk,
    resolveBattleConfig: resolveDuel1Honor1v1Battle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'Honor Reivindicado en el Círculo',
          subheadline: 'Tu lectura en el Team Preview sentenció el duelo 1v1 en seco.',
          badgeText: 'VICTORIA · 1V1 SUPERADO',
          paragraphs: [
            'En el formato gen91v1 la batalla empieza antes del Turno 1: elegir la pieza exacta del triángulo frente a la amenaza rival decidió el destino del juicio.',
          ],
        };
      }
      return {
        headline: 'Duelo Perdido en Muerte Súbita',
        subheadline: 'El rival acertó el emparejamiento en el Team Preview.',
        badgeText: 'DERROTA · RELEER TEAM PREVIEW',
        paragraphs: [
          'Revisa la pista de Ink y consulta el Open Teamsheet antes de elegir tu Pokémon en el Team Preview 1 de 3.',
        ],
      };
    },
  },
  {
    id: 'archive-vgc-2024',
    category: 'showcases',
    number: 'ARCHIVO VGC',
    title: 'Final Mundial 2024: Luca vs. Yuta',
    subtitle: 'Elige bando (Luca Ceribelli o Yuta Ishigaki) · VGC Reg G Dobles 4v4 Nv. 50',
    tag: 'WORLDS 2024 · VGC REG G',
    format: 'doubles',
    formatId: 'gen9vgc2024regg',
    formatLabel: 'VGC Reg G · Dobles 4v4 Nv. 50',
    difficulty: 'Masters Finals · Bring 6, Pick 4',
    description:
      'Revive la gran final del Mundial 2024 en Honolulu eligiendo al inicio si juegas como Luca Ceribelli (Miraidon, Whimsicott, Urshifu-R, Ogerpon-H, Iron Hands, Farigiraf) o como Yuta Ishigaki (Calyrex-Ice, Pelipper, Amoonguss, Iron Valiant, Landorus, Urshifu-R), con Open Teamsheets completos e IA scripteada.',
    accentColor: 'sky',
    featuredPokemon: ['Miraidon', 'Urshifu-Rapid-Strike', 'Calyrex-Ice', 'Iron Valiant'],
    rivalPreview: 'Bando elegible: Luca (Miraidon) vs. Yuta (Calyrex-Ice) · Open Sheet',
    inkSource: archiveVgc2024Ink,
    resolveBattleConfig: resolveVgcWorlds2024Battle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const asYuta = String(flags.selected_player ?? 'luca') === 'yuta';
      const playerLabel = asYuta ? 'Yuta Ishigaki (Calyrex-Ice)' : 'Luca Ceribelli (Miraidon)';
      const rivalLabel = asYuta ? 'Luca Ceribelli (Miraidon)' : 'Yuta Ishigaki (Calyrex-Ice)';

      if (won) {
        return {
          headline: '¡Campeón del Archivo Mundial VGC!',
          subheadline: `${playerLabel} se impuso sobre ${rivalLabel} en la simulación de Honolulu.`,
          badgeText: asYuta ? 'VICTORIA · TEAM YUTA VGC' : 'VICTORIA · TEAM LUCA VGC',
          paragraphs: [
            'La Campeona asiente impresionada frente al holograma del estadio: «Dominar Bring 6 Pick 4, Open Teamsheets, control de velocidad y Teracristalización a este nivel te prepara para cualquier guerra en Galar.»',
          ],
        };
      }
      return {
        headline: `Victoria para ${rivalLabel}`,
        subheadline: asYuta
          ? 'El Viento Afín de Whimsicott y la presión de Miraidon controlaron el tablero.'
          : 'La presión de Iron Valiant, Landorus y Espacio Raro de Calyrex-Ice controló la final.',
        badgeText: 'DERROTA · REINTENTAR FINAL',
        paragraphs: [
          'Abre el Open Teamsheet antes de elegir tus 4 Pokémon en el Team Preview o prueba cambiar de bando en la escena inicial para estudiar el enfrentamiento desde ambos lados.',
        ],
      };
    },
  },
];
