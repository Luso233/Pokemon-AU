import chapter0Ink from '../stories/chapter0_testing.ink?raw';
import chapter1Ink from '../stories/chapter1_banquet.ink?raw';
import {
  resolveChapter0Battle,
  resolveChapter1Battle,
} from '../engine/teamBuilderTree';
import type { ChapterDefinition, StoryFlags } from '../types/game';

export const CHAPTERS: ChapterDefinition[] = [
  {
    id: 'ch0-arceus-test',
    number: 'CAPÍTULO 00',
    title: 'El Juicio del Estanque Real',
    subtitle: 'Arceus vs 6 Magikarp · Loop de Testing Completo',
    tag: 'TESTING MVP · SINGLES',
    format: 'singles',
    difficulty: 'Prueba Táctica (1v6 / 2v6)',
    description:
      'Lord Vane intenta ridiculizar a la Corona frente a la corte de Wyndon con seis Magikarp. Tus decisiones definen si Arceus (120 Atk / 120 SpA) adopta set Físico, Especial o Placa Trueno, si peleas solo o con escolta, y qué llevan los 6 Magikarp rivales.',
    accentColor: 'amber',
    featuredPokemon: ['Arceus', 'Magikarp'],
    rivalPreview: 'Lord Vane · 6× Magikarp (Nv. 50 o Nv. 100)',
    inkSource: chapter0Ink,
    resolveBattleConfig: resolveChapter0Battle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const build = String(flags.arceus_build ?? 'physical');
      const stance = String(flags.rival_stance ?? 'ceremonial');
      if (won) {
        return {
          headline: 'Juicio Consumado en el Estanque Real',
          subheadline: 'Los 6 Magikarp de Lord Vane han caído ante el poder de la Corona.',
          badgeText: 'VICTORIA · 6/6 DERROTADOS',
          paragraphs: [
            `Un silencio absoluto recorre los jardines de Wyndon mientras el sexto Magikarp regresa a su Poké Ball. Tu configuración ${
              build === 'physical'
                ? 'Física (Extreme Killer)'
                : build === 'special'
                  ? 'Especial (Calm Mind & Judgment)'
                  : 'Elemental (Arceus-Eléctrico con Placa Trueno)'
            } ejecutó la sentencia sin titubeos.`,
            stance === 'provoked'
              ? 'Incluso con objetos ilegales de mercado negro y nivel 100, el sabotaje de Lord Vane quedó expuesto ante la prensa real. La facción de Tizonio y Dargo acaba de perder su primera jugada política.'
              : 'Mantuviste la compostura real y despachaste la provocación ceremonial con elegancia quirúrgica. El Consejo de Galar toma nota: el heredero no es un adorno.',
            'El loop completo (Novela Visual Ink → Árbol de Decisiones → Inyección al Teambuilder Showdown → Combate en @pkmn/sim → Epílogo) ha finalizado con éxito. Puedes rejugar el capítulo eligiendo otras ramas o probar el Combate Doble 2v2 del Capítulo 01.',
          ],
        };
      }
      return {
        headline: 'Escándalo en la Corte de Wyndon',
        subheadline: 'Contra todo pronóstico, el escuadrón de Magikarp logró imponerse.',
        badgeText: 'DERROTA · REINTENTAR',
        paragraphs: [
          'Los titulares de mañana en Galar serán despiadados. Lord Vane sonríe incrédulo mientras los fotógrafos capturan la escena.',
          'Puedes volver a intentar el combate directamente o rejugar las decisiones del capítulo para ajustar el set de Arceus y el equipo inyectado al Teambuilder.',
        ],
      };
    },
  },
  {
    id: 'ch1-banquet-ambush',
    number: 'CAPÍTULO 01',
    title: 'Emboscada en la Cena de Estado',
    subtitle: 'AU Monarquía de Galar · Combate Doble 2v2 (≤400 BST)',
    tag: 'LORE GALAR · DOBLES 2v2',
    format: 'doubles',
    difficulty: 'Táctico Showdown (Early Game ≤400 BST)',
    description:
      'Apagón total en el Salón de Estado. Un sicario enviado por la rama secundaria ataca en formato Colosseum 2v2 sin grindeo. Decide entre tu Equipo de Vida Diaria o tu Equipo de Combate, elige el set físico/especial de tu atacante mixto y enfrenta sets sucios de Showdown.',
    accentColor: 'indigo',
    featuredPokemon: ['Zacian-Crowned', 'Arcanine', 'Smeargle'],
    rivalPreview: 'Sicario ≤400 BST · Smeargle, Sableye, Cottonee, Ditto/Clefairy',
    inkSource: chapter1Ink,
    resolveBattleConfig: resolveChapter1Battle,
    getEpilogue: (won: boolean, flags: StoryFlags) => {
      const mode = String(flags.team_mode ?? 'daily');
      const plan = String(flags.assassin_plan ?? 'sabotage');
      if (won) {
        return {
          headline: 'La Corona Resiste el Atentado',
          subheadline: 'El sicario es reducido antes de que caigan las puertas del salón.',
          badgeText: 'VICTORIA · EMBOSCADA NEUTRALIZADA',
          paragraphs: [
            mode === 'combat'
              ? 'El rugido de Zacian y el despliegue de tu Equipo de Combate recordaron a todos los embajadores extranjeros por qué ninguna potencia se atreve a desafiar a Galar.'
              : 'Sin siquiera recurrir a tu equipo de guerra, tu Equipo de Vida Diaria demostró que la escolta cotidiana del heredero es una muralla impenetrable.',
            plan === 'mirror'
              ? 'El Ditto con Pañuelo Elegido fue capturado como prueba forense: el vínculo con Tizonio y Dargo ya no puede ocultarse.'
              : 'Neutralizaste las tácticas sucias de Espora, Bromista y Viento Afín turno por turno. El conflicto político apenas comienza.',
          ],
        };
      }
      return {
        headline: 'Evacuación de Emergencia',
        subheadline: 'El sicario logró romper tu formación en el Salón de Estado.',
        badgeText: 'DERROTA · REAGRUPAR',
        paragraphs: [
          'En formato Dobles estilo Colosseum, un solo turno mal calculado contra Espora, Viento Afín o Ditto Impostor puede costarte la partida.',
          'Reintenta el combate o cambia tus decisiones narrativas para desplegar otra composición en el Teambuilder.',
        ],
      };
    },
  },
];
