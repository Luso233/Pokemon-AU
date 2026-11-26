import chapter1ChaseInk from '../stories/chapter1_chase.ink?raw';
import chapter2BanquetInk from '../stories/chapter1_banquet.ink?raw';
import puzzle1SunTrapInk from '../stories/puzzle1_suntrap.ink?raw';
import chapterLittleCupInk from '../stories/chapter_littlecup.ink?raw';
import {
  resolveChampionLittleCupBattle,
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
  resolvePuzzle1SunTrapBattle,
} from '../engine/teamBuilderTree';
import type { ChapterDefinition, StoryFlags } from '../types/game';

export const CHAPTERS: ChapterDefinition[] = [
  {
    id: 'ch1-wyndon-chase',
    number: 'CAPÍTULO 01',
    title: 'Cacería en los Callejones de Wyndon',
    subtitle: 'El Príncipe Rubio vs. El Asesino Carmesí · 6v6 Dobles con IA Scripteada',
    tag: 'HISTORIA PRINCIPAL · 6V6 DOBLES',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: '6v6 Dobles · Tera',
    difficulty: 'Táctico Counter (Editable por decisiones)',
    description:
      'Huyendo bajo la lluvia de Wyndon solo con tu Equipo de Vida Diaria, eres perseguido por un Asesino cuyo equipo 6v6 (Grafaiai, Kingambit, Slowking-Galar, Gholdengo, Heatran, Rillaboom) fue diseñado para destruir el tuyo. Tus 4 decisiones cambian leads, sabotean objetos, mejoran tus sets y exponen turnos scripteados de su IA.',
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
    id: 'puzzle-01-sun-trap',
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
          'Recuerda el guion enemigo: en Turno 1 Volcarona usa Heat Wave y Mega Metagross ataca a Inkay con Meteor Mash; en Turno 2 Mega Metagross tira Bullet Punch a Inkay. Protege, interrumpe con Fake Out o invierte sus boosts con Topsy-Turvy.',
        ],
      };
    },
  },
  {
    id: 'flashback-lc-champion',
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
    rivalPreview: 'La Campeona · Onix/Mienfoo/Foongus/Gastly/Pawniard Nv.6 + Vullaby ★ Nv.7',
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
          'Consejo táctico: frena las rocas de Onix en Turno 1 con Rookidee (Taunt) o Larvitar (Rock Blast), usa a Larvesta para quemar a Mienfoo/Pawniard, y reserva a Ralts con Focus Sash + Destiny Bond para eliminar a Vullaby ★ Nivel 7.',
        ],
      };
    },
  },
  {
    id: 'ch2-banquet-ambush',
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
];
