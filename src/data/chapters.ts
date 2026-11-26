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
} from '../engine/teamBuilderTree';
import type {
  ChapterDefinition,
  PersistedPartyState,
  StoryFlags,
} from '../types/game';

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
    rivalProfile: {
      name: 'Asesino Carmesí',
      title: 'Cazador de la Corona',
      bio: 'Mercenario de élite contratado para neutralizar al heredero en las calles de Wyndon. Estudió cada miembro de tu escolta diaria.',
      tacticalInsight:
        'Su apertura busca anular tus pantallas y castigar cualquier reducción de stats. Observa sus turnos scripteados para tenderle trampas.',
      archetypeTag: 'Campaña · Counter-Team',
    },
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
    rivalProfile: {
      name: 'Comandante Siniestro',
      title: 'Casa Rebelde del Estandarte Oscuro',
      bio: 'Noble insurrecto que desafía el decreto real bajo una formación Monotype Siniestro centrada en desgaste y velocidad.',
      tacticalInsight:
        'Buscará apilar Púas desde el primer turno para castigar tus cambios. Controlar el ritmo de entrada y proteger tu inmunidad Tierra es vital.',
      archetypeTag: 'Monotype · Siniestro',
    },
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
    id: 'ch3-clandestine-tamer',
    category: 'story',
    number: 'CAPÍTULO 03',
    title: 'El Foso del Vínculo Roto',
    subtitle: 'Lord Vexen (Domador Clandestino) · Gimmick Frustration 102 BP (Felicidad: 0)',
    tag: 'GIMMICK RENCOR · 6V6 SINGLES',
    format: 'singles',
    formatId: 'gen9customgame',
    formatLabel: '6v6 Singles · Gimmick Rencor',
    difficulty: 'Kaizo Táctico (Frustration 102 BP + Scrappy)',
    description:
      'Desciende al foso clandestino bajo Wyndon donde Lord Vexen entrena tipos Normal con Felicidad: 0 para desatar Frustration a potencia máxima (102 BP / 153 con STAB), incluyendo Kangaskhan Scrappy @ Silk Scarf y Ursaring @ Eviolite. Elige si rescatar y desplegar a su Ursaring herido.',
    accentColor: 'rose',
    featuredPokemon: ['Kangaskhan', 'Ursaring', 'Archaludon', 'Lopunny'],
    rivalPreview: 'Lord Vexen · Kangaskhan Scrappy, Ursaring Eviolite, Lopunny ★ Nv. 62',
    rivalProfile: {
      name: 'Lord Vexen',
      title: 'Domador Clandestino',
      bio: 'Noble caído que opera un foso ilegal bajo Wyndon. Rompe el vínculo de sus Pokémon para llevar Frustration al máximo poder.',
      tacticalInsight:
        'Sus Pokémon luchan con rabia contenida; evita intercambiar golpes físicos directos contra tipos Normal.',
      archetypeTag: 'Gimmick: Rencor',
    },
    inkSource: chapter3ClandestineTamerInk,
    resolveBattleConfig: resolveClandestineTamerBattle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const ally = String(flags.tamer_ally ?? 'rescued_ursaring');
      if (won) {
        return {
          headline: 'El Foso Clandestino Clausurado',
          subheadline:
            'Lord Vexen cae arrestado por la Guardia Real mientras las jaulas subterráneas se abren.',
          badgeText: 'VICTORIA · VÍNCULO SANADO',
          paragraphs: [
            ally === 'rescued_ursaring'
              ? 'El Ursaring rescatado descargó por última vez el rencor de su antiguo captor con Frustration al 100% antes de aceptar una nueva vida junto a la Corona.'
              : 'Tu disciplina defensiva (Casco Dentado, Firmeza y Defensa Férrea) demostró que la crueldad de Lord Vexen nunca superará a la táctica real.',
          ],
        };
      }
      return {
        headline: 'Aplastado por el Rencor del Foso',
        subheadline:
          'Los golpes de Frustration a 102 de potencia base y Kangaskhan Scrappy quebraron tu línea.',
        badgeText: 'DERROTA · REAGRUPAR ESTRATEGIA',
        paragraphs: [
          'Recuerda que Kangaskhan golpea a Fantasmas con Scrappy y Ursaring/Obstagoon aprovechan quemaduras con Guts. Castiga sus ataques físicos con Rocky Helmet, Stamina y Iron Defense.',
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
    rivalProfile: {
      name: 'Sicario del Banquete',
      title: 'Infiltrado de la Cena de Estado',
      bio: 'Agente encubierto especialista en tácticas sucias de bajo BST diseñadas para neutralizar amenazas legendarias.',
      tacticalInsight:
        'Depende de control sucio (Espora, Fuego Fatuo, Impostor) para castigar a atacantes potenciados. No le regales turnos gratis.',
      archetypeTag: 'Bonus · Táctica Sucia',
    },
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
    rivalProfile: {
      name: 'Estratega Solar',
      title: 'Arquitecto de la Trampa',
      bio: 'Maestro de acertijos tácticos que prepara el tablero en desventaja extrema para poner a prueba el ingenio del Príncipe.',
      tacticalInsight:
        'Su fuerza nace de sus mejoras acumuladas y el orden de velocidad bajo Viento Afín. Invierte o roba ese poder antes de que barra tu equipo.',
      archetypeTag: 'Puzzle: Inversión',
    },
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
  {
    id: 'puzzle-02-regigigas',
    category: 'puzzles',
    number: 'PUZZLE 02',
    title: 'El Coloso Despertado',
    subtitle: 'Regigigas Raid Boss (Nv. 85 sin Slow Start) + 5 Supports Nv. 50',
    tag: 'PUZZLE · RAID BOSS DOBLES',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: 'Puzzle 6v6 Dobles · Raid Boss',
    difficulty: 'Kaizo Raid Boss (Estado Turno 0 Inyectado)',
    description:
      'Regigigas Nv. 85 entra en Turno 0 ya liberado de Slow Start, protegido por Sustituto (25% PS), Aqua Ring, Ingrain, Reflect, Light Screen y +1 Atk/Def/SpD junto a 5 supports (Grimmsnarl, Clefairy, Comfey, Alcremie, Sableye). Usa herramientas quirúrgicas Nv. 55 (Infiltrator, Psychic Noise, Brick Break, Haze) para derribar al Titán.',
    accentColor: 'amber',
    featuredPokemon: ['Regigigas', 'Dragapult', 'Farigiraf', 'Murkrow'],
    rivalPreview: 'Custodio del Coloso · Regigigas ★ Nv. 85 + 5 Supports Nv. 50',
    rivalProfile: {
      name: 'Custodio del Coloso',
      title: 'Guardián del Templo Puntaneva',
      bio: 'Sacerdote de la cámara sellada que transfirió cinco auras ancestrales a Regigigas antes de abrir las puertas del santuario.',
      tacticalInsight:
        'Su formación gira en torno a un coloso ya despertado y blindado. Romper sus barreras será inútil si no cortas su regeneración.',
      archetypeTag: 'Puzzle: Raid Boss',
    },
    inkSource: puzzle2RegigigasInk,
    resolveBattleConfig: resolvePuzzle2RegigigasBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: '¡El Coloso del Santuario Derribado!',
          subheadline:
            'Desmantelaste cada capa del Raid Boss Regigigas con cirugía competitiva a Nivel 55.',
          badgeText: 'PUZZLE 02 COMPLETADO · RAID BOSS KO',
          paragraphs: [
            'Cortar la regeneración triple con Psychic Noise, atravesar Sustituto y Pantallas con Infiltrator, limpiar Decorate con Haze y romper barreras con Brick Break doblegó a un Titán 30 niveles superior.',
          ],
        };
      }
      return {
        headline: 'El Titán Sigue en Pie',
        subheadline:
          'La regeneración combinada de Aqua Ring, Ingrain, Leftovers y sus cinco supports sostuvo a Regigigas.',
        badgeText: 'PUZZLE FALLIDO · REAJUSTAR LÍNEA',
        paragraphs: [
          'Consejo Kaizo: aplica Psychic Noise de Farigiraf para sellar toda curación (incluido Floral Healing de Comfey), limpia sus boosts con Murkrow Haze y presiona directo a través del Sustituto con Dragapult Infiltrator o Urshifu.',
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
    rivalProfile: {
      name: 'La Campeona',
      title: 'Soberana Invicta de Galar',
      bio: 'Mentora de infancia del Príncipe. Incluso en un combate amistoso con crías, jamás contiene el verdadero nivel táctico de la élite.',
      tacticalInsight:
        'Su núcleo abusa de Trampa Rocas y cambios con Regeneración antes de cerrar con un As sobre-leveado. Reserva un recurso de emergencia para el final.',
      archetypeTag: 'Flashback · Little Cup',
    },
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
    rivalProfile: {
      name: 'Duelista de la Corte',
      title: 'Espadachín del Círculo de Honor',
      bio: 'Aristócrata de Galar que resuelve disputas políticas mediante duelos 1v1 a muerte súbita sin banca ni segundas oportunidades.',
      tacticalInsight:
        'Todo se decide en el Team Preview. Revisa el Open Teamsheet y recuerda la pista que dejó escapar antes del duelo.',
      archetypeTag: 'Showcase · 1v1',
    },
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
    rivalProfile: {
      name: 'Finalista Mundial VGC 2024',
      title: 'Masters Finals · Honolulu Reg G',
      bio: 'Simulación histórica de la final del Campeonato Mundial 2024 entre Luca Ceribelli (Italia) y Yuta Ishigaki (Japón).',
      tacticalInsight:
        'Controla el campo eléctrico, el clima y el duelo entre Viento Afín y Espacio Raro. Consulta siempre el Open Teamsheet antes de confirmar tus 4.',
      archetypeTag: 'Showcase · VGC Reg G',
    },
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
  {
    id: 'showcase-triples-phalanx',
    category: 'showcases',
    number: 'CAPÍTULO C',
    title: 'La Falange de Hammerlocke',
    subtitle: 'Caballería del Duque · Batalla Triple 6v6 con Megaevoluciones (Gen 6)',
    tag: 'TRIPLES 6V6 · GEN 6',
    format: 'triples',
    formatId: 'gen6triplescustomgame',
    formatLabel: 'Triples 6v6 · Gen 6',
    difficulty: 'Táctico Posicional (3 Slots Activos)',
    description:
      'Choque militar contra el Duque de Hammerlocke en Batalla Triple 6v6. Domina el alcance posicional (Izquierda · Centro · Derecha), ataques voladores/pulso de cruce de campo (Brave Bird, Air Slash), Wide Guard y Megaevolución con Mega Gardevoir vs. Mega Kangaskhan.',
    accentColor: 'indigo',
    featuredPokemon: ['Gardevoir-Mega', 'Hitmontop', 'Talonflame', 'Kangaskhan-Mega'],
    rivalPreview: 'Duque de Hammerlocke · Mega Kangaskhan, Aegislash, Togekiss, Landorus-T',
    rivalProfile: {
      name: 'Duque de Hammerlocke',
      title: 'Comandante de la Falange',
      bio: 'Veterano estratega de la Casa de Hammerlocke que despliega formaciones de tres flancos con disciplina militar de Sexta Generación.',
      tacticalInsight:
        'Protege sus líneas con Vastaguardia y controla el ritmo con Viento Afín. Usa ataques de largo alcance o Amago para quebrar su centro.',
      archetypeTag: 'Showcase · Triples Gen 6',
    },
    inkSource: showcaseTriplesPhalanxInk,
    resolveBattleConfig: resolveTriplesPhalanxBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: 'La Falange de Hammerlocke Quebrada',
          subheadline:
            'Tu dominio de las tres líneas de batalla y el alcance posicional superó a la Caballería del Duque.',
          badgeText: 'VICTORIA · TRIPLES 6V6',
          paragraphs: [
            'El Duque de Hammerlocke inclina su estandarte azul cobalto: «Pocas mentes dominan el tablero triple con tanta claridad. El centro y los flancos te obedecieron como un solo escudo.»',
          ],
        };
      }
      return {
        headline: 'La Falange Mantuvo la Línea',
        subheadline:
          'El Wide Guard de Aegislash y el Viento Afín de Togekiss frenaron el avance.',
        badgeText: 'DERROTA · REAGRUPAR FALANGE',
        paragraphs: [
          'Usa Feint de Hitmontop para romper el Wide Guard de Turno 1 o usa Brave Bird de Talonflame para golpear la esquina opuesta.',
        ],
      };
    },
  },

  /* ===================== DESAFÍOS ===================== */
  {
    id: 'challenge-last-bastion',
    category: 'challenges',
    number: 'CAPÍTULO A',
    title: 'El Último Bastión',
    subtitle: 'La Milicia de los Muelles · 1 Pokémon Aliado (Raid Boss) vs. 6 Mercenarios',
    tag: 'DESAFÍO · 1 VS 6 DOBLES',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: '1 vs 6 · Dobles',
    difficulty: 'Raid Boss Solitario (Defiant + Rage Fist)',
    description:
      'Emboscada en el puente estrecho de los Muelles de Wyndon. Solo tu Annihilape (@ Leftovers · Defiant · Tera Fuego) queda en pie frente a los 6 mercenarios de la Milicia (Krookodile, Toxicroak, Kilowattrel, Mudsdale, Grimmsnarl y Regirock Tera Dark). Aprovecha su Intimidate y fuego amigo.',
    accentColor: 'orange',
    featuredPokemon: ['Annihilape', 'Krookodile', 'Toxicroak', 'Regirock'],
    rivalPreview: 'La Milicia de los Muelles · 6 Mercenarios (Fuego Amigo T1)',
    rivalProfile: {
      name: 'Capataz de los Muelles',
      title: 'La Milicia de los Muelles',
      bio: 'Banda de seis mercenarios portuarios que intentan abrumar por número al heredero en un puente estrecho.',
      tacticalInsight:
        'Son impulsivos y mal coordinados: su propia Intimidación y ataques de área pueden volverse en su contra si escalas en el momento justo.',
      archetypeTag: 'Desafío · 1 vs 6',
    },
    inkSource: challengeLastBastionInk,
    resolveBattleConfig: resolveLastBastionBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: '¡El Puente de los Muelles Resiste!',
          subheadline:
            'Un solo Annihilape barrió a los seis mercenarios de La Milicia de los Muelles.',
          badgeText: 'DESAFÍO SUPERADO · 1 VS 6',
          paragraphs: [
            'Cada golpe recibido y cada Intimidación mal calculada alimentaron la furia imparable de Annihilape hasta despejar el puente por completo.',
          ],
        };
      }
      return {
        headline: 'Superado en el Puente de Carga',
        subheadline:
          'La presión numérica de los seis mercenarios logró derribar a Annihilape.',
        badgeText: 'DESAFÍO FALLIDO · REINTENTAR',
        paragraphs: [
          'Consejo: aprovecha el +1 de Defiant y el Earthquake amigo de Krookodile en Turno 1, escala con Bulk Up, cúrate con Drain Punch y guarda Tera Fuego para resistir a Grimmsnarl.',
        ],
      };
    },
  },
  {
    id: 'challenge-three-knights',
    category: 'challenges',
    number: 'CAPÍTULO D',
    title: 'El Juicio de los Tres Caballeros',
    subtitle: 'Tríada de Élite del Duque · 1 As Central vs. 3 Caballeros en Triples',
    tag: 'DESAFÍO · 1 VS 3 TRIPLES',
    format: 'triples',
    formatId: 'gen6triplescustomgame',
    formatLabel: '1 vs 3 · Triples',
    difficulty: 'Kaizo Lectura de Wide Guard (Turnos 1 y 3)',
    description:
      'Enfrenta en solitario desde el Centro del tablero Triple a Escavalier, Aegislash y Bisharp con Mega Charizard Y o Garchomp Life Orb. Lee los Turnos 1 y 3 scripteados de Wide Guard de Aegislash alternando ataques individuales y de área.',
    accentColor: 'rose',
    featuredPokemon: ['Charizard-Mega-Y', 'Garchomp', 'Aegislash', 'Escavalier'],
    rivalPreview: 'Tríada de Élite · Escavalier, Aegislash (Wide Guard T1/T3), Bisharp',
    rivalProfile: {
      name: 'Tríada de Élite del Duque',
      title: 'Escavalier · Aegislash · Bisharp',
      bio: 'Los tres caballeros de acero que someten a prueba a los aspirantes en un juicio solitario en el centro de la arena triple.',
      tacticalInsight:
        'Su escudo de área sigue un compás predecible en turnos impares, pero su rematador guarda prioridad letal si te descuidas con pocos PS.',
      archetypeTag: 'Desafío · 1 vs 3 Kaizo',
    },
    inkSource: challengeThreeKnightsInk,
    resolveBattleConfig: resolveThreeKnightsBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: '¡Juicio de los Tres Caballeros Superado!',
          subheadline:
            'Tu lectura de Vastaguardia permitió a un solo As doblegar a la Tríada de Élite.',
          badgeText: 'DESAFÍO SUPERADO · 1 VS 3 TRIPLES',
          paragraphs: [
            'Alternar golpes individuales en los turnos impares (Wide Guard) con ráfagas de área en los turnos pares desarmó por completo a los tres caballeros.',
          ],
        };
      }
      return {
        headline: 'La Tríada Sostuvo el Escudo',
        subheadline:
          'Escavalier, Aegislash y Bisharp resistieron el asalto solitario.',
        badgeText: 'DESAFÍO FALLIDO · REINTENTAR',
        paragraphs: [
          'Recuerda: Aegislash levanta Wide Guard en Turno 1 y Turno 3. Usa Air Slash / Solar Beam / Dragon Claw esos turnos y reserva Heat Wave / Earthquake para los turnos pares.',
        ],
      };
    },
  },

  /* ===================== SUPERVIVENCIA (BACK-TO-BACK) ===================== */
  {
    id: 'survival-galar-mines',
    category: 'survival',
    number: 'CAPÍTULO B',
    title: 'Asedio en las Minas de Galar',
    subtitle: 'Back-to-Back sin curación · Zapadores Rebeldes → Capitán Corrupto',
    tag: 'SUPERVIVENCIA · BACK-TO-BACK',
    format: 'singles',
    formatId: 'gen9customgame',
    formatLabel: 'Back-to-Back · Persistencia',
    difficulty: '2 Oleadas Consecutivas (HP/PP/Estados Persistentes)',
    description:
      'Fuga por las Minas de Galar en dos combates encadenados por Ink sin curación intermedia. Sobrevive primero a los Zapadores Rebeldes (cuyo último Golem @ Custap Berry detona Explosión), cruza la escena del humo con tu desgaste real intacto y derrota al Capitán de la Guardia Corrupta.',
    accentColor: 'amber',
    featuredPokemon: ['Arcanine', 'Dragapult', 'Golem', 'Bisharp'],
    rivalPreview: 'Oleada 1: Zapadores (Explosion) → Oleada 2: Capitán Corrupto',
    rivalProfile: {
      name: 'Zapadores y Capitán Corrupto',
      title: 'Bloqueo de las Minas de Galar',
      bio: 'Demolición coordinada en dos oleadas sin respiro: primero desgastan al objetivo con explosivos y luego rematan en la salida.',
      tacticalInsight:
        'El daño, los estados y los PP perdidos en la primera oleada se arrastran íntegros a la segunda. Cuidado con una detonación suicida al final de la Oleada 1.',
      archetypeTag: 'Supervivencia · Back-to-Back',
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
          headline: '¡Fuga Exitosa de las Minas de Galar!',
          subheadline:
            'Superaste las dos oleadas consecutivas sin curación gestionando PS, estados y PP hasta el final.',
          badgeText: 'SUPERVIVENCIA COMPLETADA · 2/2 OLEADAS',
          paragraphs: [
            'Dejaste atrás a los Zapadores Rebeldes y rompiste el bloqueo del Capitán Corrupto incluso con el desgaste heredado por BattlePersistenceManager.',
          ],
        };
      }
      return {
        headline: 'Atrapado en el Nivel Profundo 4',
        subheadline:
          'El desgaste acumulado entre oleadas doblegó al escuadrón de fuga.',
        badgeText: 'SUPERVIVENCIA FALLIDA · REINTENTAR',
        paragraphs: [
          'Consejo clave: usa Protect o cambia a Dragapult (tipo Fantasma, inmune a Normal) cuando Golem baje de 35% PS o quede último para esquivar su Explosion sin perder piezas para la Oleada 2.',
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
    subtitle: 'El Archivista Real · Smogon Gen 1 OU Clásico vs. Mew & Mewtwo',
    tag: 'ARCHIVO HISTÓRICO · GEN 1 RBY',
    format: 'singles',
    formatId: 'gen1customgame',
    formatLabel: 'Gen 1 OU vs Ubers',
    difficulty: 'Era Antigua de Kanto (Sin objetos ni habilidades)',
    description:
      'El Archivista Real carga una simulación nativa de Generación 1 (gen1customgame). Pilotea el equipo clásico de Smogon Gen 1 OU (Tauros, Chansey, Snorlax, Exeggutor, Starmie, Alakazam) contra la versión equilibrada de Mewtwo y Mew (sin Amnesia ni Recover).',
    accentColor: 'slate',
    featuredPokemon: ['Tauros', 'Alakazam', 'Mewtwo', 'Mew'],
    rivalPreview: 'El Archivista Real · Mewtwo & Mew (Equilibrados) + Gen 1 OU',
    rivalProfile: {
      name: 'El Archivista Real',
      title: 'Custodio de la Reliquia de Silph Co.',
      bio: 'Erudito que preserva cintas de combate de la Era Antigua de Kanto, donde no existían objetos ni habilidades y los críticos dependían de la Velocidad.',
      tacticalInsight:
        'En Gen 1 la Parálisis y el Sueño dominan el ritmo. Frena el Especial masivo de Mewtwo antes de que barra con críticos.',
      archetypeTag: 'Archivo · Gen 1 RBY',
    },
    inkSource: archiveGen1SilphInk,
    resolveBattleConfig: resolveGen1SilphArchiveBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: '¡La Reliquia de Silph Co. Dominada!',
          subheadline:
            'El control táctico de Gen 1 OU (parálisis, sueño y explosiones) venció al poder genético de Mew y Mewtwo.',
          badgeText: 'ARCHIVO GEN 1 COMPLETADO',
          paragraphs: [
            'El Archivista Real apaga el monitor de fósforo verde con admiración: «Incluso ante el poder bruto de la Era Antigua de Kanto, la estrategia clásica de Tauros, Chansey y Exeggutor sigue siendo inmortal.»',
          ],
        };
      }
      return {
        headline: 'Anomalía Genética Imparable',
        subheadline:
          'Mewtwo y Mew impusieron su estadística Especial y velocidad crítica de Primera Generación.',
        badgeText: 'SIMULACIÓN FALLIDA · REINTENTAR',
        paragraphs: [
          'Usa a Chansey con Light Screen + Thunder Wave para frenar a Mewtwo, y aprovecha el Sleep Powder y Explosion de Exeggutor o Self-Destruct de Snorlax para derribar a las amenazas más duras.',
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
    subtitle: 'Conferencia del Valle Lirio (6v6 Nv. 60) · Omniboost «Espíritu de Sinnoh»',
    tag: 'ARCHIVO ANIME · 6V6 OMNIBOOST',
    format: 'singles',
    formatId: 'gen9customgame',
    formatLabel: '6v6 Singles · Omniboost',
    difficulty: 'Kaizo Legendarios (Darkrai · Latios · Cresselia · Giratina-O)',
    description:
      'Revive el duelo más infame del anime a Nivel 60: pilota el equipo completo de Ash (Pikachu, Heracross, Sceptile, Swellow, Torkoal, Gible) con +2 Omniboost al Líder que elijas en Team Preview y Baton Pass, frente a Darkrai, Latios, Cresselia (Psych Up + Lunar Dance), Latias, Lucario y Giratina-Origin.',
    accentColor: 'purple',
    featuredPokemon: ['Pikachu', 'Heracross', 'Darkrai', 'Giratina-Origin'],
    rivalPreview: 'Tobías · Darkrai, Latios, Cresselia, Latias, Lucario, Giratina-Origin',
    rivalProfile: {
      name: 'Tobías',
      title: 'El del Action Replay',
      bio: 'Entrenador misterioso de la Conferencia del Valle Lirio. Nadie sabe de dónde sacó tantos legendarios; rumores hablan de un dispositivo prohibido.',
      tacticalInsight:
        'Fuerza bruta de Ubers, pero con decisiones de entrenamiento cuestionables. Cuidado con su Cresselia: puede copiar tus mejoras si te confías.',
      archetypeTag: 'Archivo: Anime',
    },
    inkSource: archiveAnimeTobiasInk,
    resolveBattleConfig: resolveAnimeAshVsTobiasBattle,
    getEpilogue: (won: boolean) => {
      if (won) {
        return {
          headline: '¡Historia Reescrita en el Valle Lirio!',
          subheadline:
            'Ash Ketchum derrumbó a los seis Pokémon de Tobías y alzó el pase a la final de Sinnoh.',
          badgeText: 'ARCHIVO ANIME · VICTORIA HISTÓRICA',
          paragraphs: [
            'El estadio entero estalla al ver caer a Giratina-Origin: «¡Ni siquiera un equipo entero de mitos y legendarios pudo frenar el Espíritu de Sinnoh y el trabajo en equipo de Ash!»',
          ],
        };
      }
      return {
        headline: 'El Muro de Legendarios de Tobías',
        subheadline:
          'El poder bruto de Darkrai, Cresselia y Giratina-Origin volvió a sentenciar la semifinal.',
        badgeText: 'DERROTA · REINTENTAR SEMIFINAL',
        paragraphs: [
          'Consejo Kaizo: elige a Heracross (Sleep Talk contra Dark Void) o usa Swellow/Torkoal para pasar el +2 Omniboost con Baton Pass, y recuerda presionar a Cresselia antes de que copie tus boosts con Psych Up o use Lunar Dance.',
        ],
      };
    },
  },
];
