import chapter1ChaseInk from '../stories/chapter1_chase.ink?raw';
import chapter2BanquetInk from '../stories/chapter1_banquet.ink?raw';
import {
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
} from '../engine/teamBuilderTree';
import type { ChapterDefinition, StoryFlags } from '../types/game';

export const CHAPTERS: ChapterDefinition[] = [
  {
    id: 'ch1-wyndon-chase',
    number: 'CAPÍTULO 01',
    title: 'Cacería en los Callejones de Wyndon',
    subtitle: 'El Príncipe Rubio vs. El Asesino Carmesí · 6v6 Dobles con IA Scripteada',
    tag: 'HISTORIA PRINCIPAL · 6v6 DOBLES',
    format: 'doubles',
    difficulty: 'Táctico Counter (Editable por decisiones)',
    description:
      'Huyendo bajo la lluvia de Wyndon solo con tu Equipo de Vida Diaria, eres perseguido por un Asesino cuyo equipo 6v6 (Grafaiai, Kingambit, Slowking-Galar, Gholdengo, Heatran, Rillaboom) fue diseñado para destruir el tuyo. Tus 4 decisiones durante la persecución cambian leads, sabotean objetos, mejoran tus sets y exponen los turnos scripteados de su IA.',
    accentColor: 'amber',
    featuredPokemon: ['Arcanine', 'Gardevoir', 'Grafaiai', 'Kingambit'],
    rivalPreview: 'Asesino Carmesí · Equipo Anti-Príncipe 6v6 (Niebla de Guerra)',
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
            'El Asesino desaparece en la niebla con una última mirada: «Esto solo fue el aviso, Alteza. La próxima vez no traeré contención.» Puedes rejugar el capítulo tomando otras decisiones (o el reto puro sin sabotajes) para comparar la dificultad.',
          ],
        };
      }
      return {
        headline: 'Acorralado bajo la Lluvia de Wyndon',
        subheadline:
          'El equipo counter del Asesino Carmesí logró neutralizar tu Equipo de Vida Diaria.',
        badgeText: 'DERROTA · REAGRUPAR ESTRATEGIA',
        paragraphs: [
          'El equipo del Asesino está construido pieza por pieza contra tus sets base: Taunt para Gardevoir, Defiant + Brick Break contra Arcanine/Pantallas, Psychic Noise contra Milotic y Good as Gold contra tus estados.',
          'Prueba rejugar las decisiones de la persecución para sabotear sus objetos, activar Mental Herb en Gardevoir, cambiar tu lead en los acueductos o provocar su IA para engañar sus turnos scripteados.',
        ],
      };
    },
  },
  {
    id: 'ch2-banquet-ambush',
    number: 'CAPÍTULO 02',
    title: 'Emboscada en la Cena de Estado',
    subtitle: 'Bonus AU Galar · Combate Doble 2v2 (≤400 BST)',
    tag: 'BONUS · DOBLES 2v2',
    format: 'doubles',
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
          'Un solo turno mal calculado contra Espora, Fuego Fatuo o Ditto Impostor cuesta la partida. Reintenta el combate o cambia tus decisiones.',
        ],
      };
    },
  },
];
