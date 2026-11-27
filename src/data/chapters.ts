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
  resolveAeosDittoBlackSiteBattle,
  resolveBastardBrotherClimaxBattle,
  resolveOrreShadowAmbushBattle,
  resolvePoketopiaTraitorCouncilBattle,
  resolvePostgameChampionBattle,
  resolveTamraCruViceroyBattle,
  resolveTohjoShentaiTrialBattle,
  resolveXd001ShadowLugiaBattle,
} from '../engine/campaignEscalationBattles';
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
  {
    id: 'ch4-orre-shadow-ambush',
    category: 'story',
    number: 'ACTO II · CAP. 04',
    title: 'Emboscada de Pokémon Oscuros',
    subtitle: 'Cielo Oscuro (Shadow Sky) en el Cañón de Aura (Orre)',
    tag: 'ACTO II · SHADOW POKÉMON',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Shadow · Nv. 88',
    difficulty: 'Acto II',
    description:
      'Cruzando el oeste desértico hacia Cordelia, el Sindicato de Pokémon Oscuros de Aura desata Cielo Oscuro (Shadow Sky) y movimientos Shadow reales (2× a todo salvo Hada 0× Inmune). ¡Vencer los arrebata a tu PC Box!',
    accentColor: 'purple',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Metagross', mode: 'boss', label: 'Oscuro' },
    featuredPokemon: ['Tyranitar', 'Houndoom-Mega', 'Salamence', 'Metagross'],
    rivalPreview: 'Sindicato de Aura (Orre)',
    rivalProfile: {
      name: 'Sindicato de Pokémon Oscuros',
      title: 'Comandante de Aura (Orre)',
      bio: 'Célula armada nacida de la guerra civil entre Teselia y Aura. Cierran el corazón de sus Pokémon para desatar movimientos Shadow devastadores bajo Cielo Oscuro.',
      tacticalInsight:
        'Ataques Shadow pegan 2× a todos los tipos EXCEPTO Hada (0× Inmune) y otros Oscuros (0.5×). ¡Trae tipo Hada y arrebata sus Pokémon Oscuros al ganar!',
      archetypeTag: 'Acto II · Colosseum / XD',
    },
    inkSource: [
      'VAR orre_stance = "direct"',
      '-> inicio',
      '=== inicio ===',
      'El viento rojo del Cañón de Aura levanta muros de arena mientras las camionetas blindadas del Sindicato bloquean el único puente rumbo al sur. # bg: wyndon-alleys # speaker: Narrador # char: corrupt_captain # side: right # pokemon: tyranitar # mood: serious',
      '«¡Miren quién cruza el desierto sin permiso! La CRU paga en oro puro por el heredero de Galar, y aquí nadie pelea limpio.» # bg: wyndon-alleys # speaker: Comandante de Aura # char: corrupt_captain # side: right # pokemon: excadrill # mood: smug',
      '* [Romper la formación de frente para liberar los convoyes civiles]',
      '    ~ orre_stance = "direct"',
      '    «¡Valiente pero ingenuo! ¡Suelten la Tormenta de Arena y aplasten al principito!» # bg: wyndon-alleys # speaker: Comandante de Aura # char: corrupt_captain # side: right # pokemon: metagross # mood: fierce',
      '    -> cierre',
      '* [Sabotear primero los generadores del flanco antes del choque]',
      '    ~ orre_stance = "ambush"',
      '    «¡Tsk! Aprendiste trucos sucios en Mesoa… igual no pasarán de mi Metagross Oscuro.» # bg: wyndon-alleys # speaker: Comandante de Aura # char: corrupt_captain # side: right # pokemon: houndoommega # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'La arena se cierra sobre el cañón. Superar esta emboscada abre el paso hacia Cordelia y los vínculos del Cono Austral. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolveOrreShadowAmbushBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'El Cañón de Aura Queda Abierto',
            subheadline: 'El Sindicato retrocede entre la arena mientras despejas la ruta hacia Cordelia.',
            badgeText: 'ACTO II · AURA SUPERADA',
            paragraphs: [
              'Sobreviviste al primer choque con objetos Choice, Vidasfera y clima persistente. Al cruzar la frontera sur, los observatorios de Cordelia abren sus señales de auxilio en tu mapa.',
            ],
          }
        : {
            headline: 'Enterrado en la Tormenta de Aura',
            subheadline: 'La presión de Excadrill y los objetos Choice quebró tus líneas.',
            badgeText: 'DERROTA · REAGRUPAR',
            paragraphs: [
              'Ajusta tu control de clima o recluta un counter de Arena en la Tienda (Filtros Showdown) antes de volver al cañón.',
            ],
          },
  },
  {
    id: 'ch8-tamra-cru-viceroy',
    category: 'story',
    number: 'ACTO III · CAP. 08',
    title: 'El Virrey de la CRU',
    subtitle: 'Fundiciones coloniales de cobre y acero en Tamra',
    tag: 'ACTO III · 6V6 DOBLES',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex · Nv. 102',
    difficulty: 'Acto III',
    description:
      'En el corazón saqueado de Tamra, el Virrey de la CRU te espera entre Trampa Rocas, Púas y un Copperajah sobrecargado al nivel 102 que simboliza dos siglos de explotación imperial.',
    accentColor: 'slate',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Copperajah', mode: 'boss', label: 'Virrey' },
    featuredPokemon: ['Copperajah', 'Gholdengo', 'Heatran', 'Empoleon'],
    rivalPreview: 'El Virrey de la CRU',
    rivalProfile: {
      name: 'El Virrey de la CRU',
      title: 'Gobernador Colonial de Tamra',
      bio: 'Administrador implacable que convirtió los reinos de Tamra en fundiciones de acero y exportación masiva de Copperajah hacia Galar.',
      tacticalInsight:
        'Hazards desde Turno 0, Empoleon Competitive contra Intimidate y Copperajah ★ con +1 Atk/+1 Def. Necesitas Fuego/Lucha/Tierra y control de hazards.',
      archetypeTag: 'Acto III · Acero & Hazards',
    },
    inkSource: [
      'VAR tamra_vow = "liberate"',
      '-> inicio',
      '=== inicio ===',
      'El humo cobrizo de las fundiciones de Tamra oscurece el cielo mientras cadenas de acero rodean los corrales de Copperajah. En la pasarela superior espera el Virrey de la CRU. # bg: wyndon-docks # speaker: Narrador # char: dark_commander # side: right # pokemon: copperajah # mood: serious',
      '«¿El príncipe exiliado pretendiendo dar sermones morales? Tu propia dinastía firmó las concesiones de Tamra hace dos siglos.» # bg: wyndon-docks # speaker: El Virrey de la CRU # char: dark_commander # side: right # pokemon: gholdengo # mood: smug',
      '* [«Entonces seré el heredero que queme esas concesiones hoy mismo.»]',
      '    ~ tamra_vow = "liberate"',
      '    «¡Insolente! ¡Activen las Trampa Rocas y las Púas! ¡Que el acero de Tamra lo aplaste!» # bg: wyndon-docks # speaker: El Virrey de la CRU # char: dark_commander # side: right # pokemon: copperajah # mood: fierce',
      '    -> cierre',
      '* [«Abre los corrales de Copperajah o derribo toda tu fortaleza.»]',
      '    ~ tamra_vow = "storm"',
      '    «¡Inténtalo! ¡Skarmory, Viento Afín; Copperajah, aplasta el patio!» # bg: wyndon-docks # speaker: El Virrey de la CRU # char: dark_commander # side: right # pokemon: skarmory # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'El suelo tiembla bajo toneladas de acero. Derrotar al Virrey libera la ruta del Índico-Pacífico rumbo a la Unión Ranger y al Black Site de Isla Æos. # bg: wyndon-docks # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolveTamraCruViceroyBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'Cae el Virreinato de Tamra',
            subheadline: 'Las cadenas de las fundiciones ceden mientras Copperajah ruge libre por primera vez.',
            badgeText: 'ACTO III · TAMRA LIBERADA',
            paragraphs: [
              'La caída del Virrey fractura el control de la CRU en el Índico y revela las coordenadas encriptadas del Black Site de Isla Æos, además de abrir el contacto con la Unión Ranger.',
            ],
          }
        : {
            headline: 'Rechazado por la Muralla de Acero',
            subheadline: 'Las hazards iniciales y Copperajah sobrecargado cerraron el patio.',
            badgeText: 'DERROTA · REAGRUPAR',
            paragraphs: [
              'Cuidado con activar Competitive de Empoleon con Intimidate; equipa Heavy-Duty Boots o cobertura Fuego/Lucha y vuelve a asaltar la fundición.',
            ],
          },
  },
  {
    id: 'ch9-aeos-ditto-blacksite',
    category: 'story',
    number: 'ACTO III · CAP. 09',
    title: 'Asalto al Black Site del Ditto',
    subtitle: 'El corazón secreto del Monopolio Genético en Isla Æos',
    tag: 'ACTO III · JEFE CLON',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex · Nv. 115',
    difficulty: 'Acto III Jefe',
    description:
      'Bajo el océano de Isla Æos yace la cámara prohibida donde la CRU mantiene al Último Ditto: un Imposter Nv. 115 con PS inflados custodiado por paradojas bajo Campo Eléctrico persistente.',
    accentColor: 'purple',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Ditto', mode: 'boss', label: 'Imposter 115' },
    featuredPokemon: ['Ditto', 'Genesect', 'Iron Bundle', 'Iron Hands'],
    rivalPreview: 'Director del Black Site Æos',
    rivalProfile: {
      name: 'Director del Black Site Æos',
      title: 'Custodio del Monopolio Ditto · CRU',
      bio: 'Científico jefe que administra los reactores de clonación ilegal que sostienen el monopolio Pokémon de Wyndon.',
      tacticalInsight:
        'El Último Ditto ★ (Nv. 115 · Imposter + Focus Sash) copia tus stats y boosts con HP inflado. Rompe Pantalla de Luz y no te boostees sin plan B.',
      archetypeTag: 'Acto III · Imposter Boss',
    },
    inkSource: [
      'VAR aeos_plan = "destroy"',
      '-> inicio',
      '=== inicio ===',
      'Tubos de luz azul eléctrico iluminan una cámara submarina donde cientos de embriones artificiales palpitan alrededor de una sola cápsula dorada: El Último Ditto. # bg: royal-training-ground # speaker: Narrador # char: royal_archivist # side: right # pokemon: ditto # mood: serious',
      '«Sin esta célula, Alteza, tu imperio colapsa en seis meses. Todo el mercado mundial de Poké Balls depende de este tanque.» # bg: royal-training-ground # speaker: Director del Black Site # char: royal_archivist # side: right # pokemon: genesect # mood: smug',
      '* [«Un imperio sostenido por clones y extinción merece caer.»]',
      '    ~ aeos_plan = "destroy"',
      '    «¡Protocolo de contención máximo! ¡Enciendan el Campo Eléctrico y liberen a la Muestra Alfa!» # bg: royal-training-ground # speaker: Director del Black Site # char: royal_archivist # side: right # pokemon: ironbundle # mood: fierce',
      '    -> cierre',
      '* [«Dame los archivos del laboratorio y libera a Ditto ahora mismo.»]',
      '    ~ aeos_plan = "expose"',
      '    «¡Nunca! ¡Veamos si tu propio equipo sobrevive al reflejo del Último Ditto nivel 115!» # bg: royal-training-ground # speaker: Director del Black Site # char: royal_archivist # side: right # pokemon: ditto # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'Los reactores sobrecargan la arena con electricidad pura. Tomar el Black Site abre los vínculos de Isla Æos y Pokétopia, y despeja el camino hacia el Acto IV.',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolveAeosDittoBlackSiteBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'El Monopolio Ditto Queda al Descubierto',
            subheadline: 'Los reactores de Isla Æos se apagan y las pruebas genéticas recorren todo el Pacífico.',
            badgeText: 'ACTO III COMPLETADO',
            paragraphs: [
              'Con el Black Site expuesto ante el planeta, Isla Æos y Pokétopia abren sus contactos clandestinos y las Potencias Libres de Tohjo y Shentai te convocan para el Acto IV.',
            ],
          }
        : {
            headline: 'Neutralizado por tu Propio Reflejo',
            subheadline: 'El Último Ditto Nv. 115 volvió tus propias armas contra tu escuadrón.',
            badgeText: 'DERROTA · REAGRUPAR',
            paragraphs: [
              'Evita dejar sweepers con +2/+2 cuando Ditto esté por bajar y trae respuestas sólidas contra Iron Hands, Iron Bundle y Genesect.',
            ],
          },
  },
  {
    id: 'ch10-tohjo-shentai-trial',
    category: 'story',
    number: 'ACTO IV · CAP. 10',
    title: 'Prueba de las Potencias Libres',
    subtitle: 'Cumbre marcial de Tohjo y Shentai bajo Gravedad',
    tag: 'ACTO IV · OU / UBER',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex · Nv. 105',
    difficulty: 'Acto IV',
    description:
      'Antes de prestar sus flotas para marchar sobre Galar, la Confederación Tohjo y el Imperio de Shentai te someten a una prueba OU/Uber bajo Gravedad persistente.',
    accentColor: 'sky',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Chien-Pao', mode: 'boss', label: 'Potencias' },
    featuredPokemon: ['Chien-Pao', 'Chi-Yu', 'Urshifu', 'Landorus'],
    rivalPreview: 'Concilio de Tohjo & Shentai',
    rivalProfile: {
      name: 'Concilio de Tohjo & Shentai',
      title: 'Prueba Marcial de las Potencias Libres',
      bio: 'Representantes invictos de las únicas potencias que jamás cedieron ante Galar ni la CRU. Evalúan si el heredero tiene la fuerza para cambiar la historia.',
      tacticalInsight:
        'Gravedad persistente aterriza a todos los voladores y da 100% de precisión a Sandsear Storm y Heat Wave. Wide Guard y control de velocidad son clave.',
      archetypeTag: 'Acto IV · Gravedad & Ruinas',
    },
    inkSource: [
      'VAR alliance_tone = "honor"',
      '-> inicio',
      '=== inicio ===',
      'En una terraza de piedra sobre las nubes, los estandartes de la Confederación Tohjo y el Imperio Milenario de Shentai ondean juntos por primera vez en cien años. # bg: honor-duel-hall # speaker: Narrador # char: e4_ransei # side: right # pokemon: chienpao # mood: serious',
      '«Exponer el Black Site de Æos fue audaz, Príncipe de Galar. Pero en el trono de Wyndon te esperan Zamazenta y Eternatus. Demuéstranos que mereces nuestra alianza.» # bg: honor-duel-hall # speaker: Concilio de Tohjo & Shentai # char: e4_ransei # side: right # pokemon: chiyu # mood: confident',
      '* [«Pongan toda su fuerza sobre la mesa. No vine a pedir caridad.»]',
      '    ~ alliance_tone = "honor"',
      '    «¡Esas son palabras de soberano! ¡Activen la Gravedad Marcial y desaten las Ruinas!» # bg: honor-duel-hall # speaker: Concilio de Tohjo & Shentai # char: e4_ransei # side: right # pokemon: urshifu # mood: fierce',
      '    -> cierre',
      '* [«Si nos derrotan hoy, Galar devorará a Oriente mañana. Probémonos ahora.»]',
      '    ~ alliance_tone = "pragmatic"',
      '    «Lucidez fría… veamos si tu equipo resiste el mismo nivel de exigencia.» # bg: honor-duel-hall # speaker: Concilio de Tohjo & Shentai # char: e4_ransei # side: right # pokemon: landorus # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'La gravedad aplasta la arena entera. Ganar esta cumbre abre los últimos Vínculos de Late Game (el Alto Mando de las cuatro potencias) y marca el asalto a Pokétopia. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: kingambit # mood: serious',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolveTohjoShentaiTrialBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'Las Potencias Libres Firman el Pacto',
            subheadline: 'Tohjo, Shentai y el Alto Mando mundial ponen sus ejércitos a tu lado.',
            badgeText: 'ACTO IV · ALIANZA SELLADA',
            paragraphs: [
              'Superaste la prueba OU/Uber bajo Gravedad. Los cuatro miembros del Alto Mando (Ransei, Ferrum, Veridia y Kalos) revelan ahora sus Vínculos en el mapa, y el Coliseo de Pokétopia espera el golpe final contra el Consejo Traidor.',
            ],
          }
        : {
            headline: 'Superado en la Cumbre de Oriente',
            subheadline: 'Las Cuatro Ruinas y la Gravedad Marcial quebraron tu formación.',
            badgeText: 'DERROTA · REAGRUPAR',
            paragraphs: [
              'Recuerda que bajo Gravedad los Pokémon Voladores/Levitación reciben daño Tierra completo y Heat Wave nunca falla. Prepara Wide Guard y prioridades.',
            ],
          },
  },
  {
    id: 'ch11-poketopia-traitor-council',
    category: 'story',
    number: 'ACTO IV · CAP. 11',
    title: 'Caída del Consejo Traidor',
    subtitle: 'El Coliseo Dorado de Pokétopia antes del regreso a Galar',
    tag: 'ACTO IV · UBER FINAL',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex · Nv. 106',
    difficulty: 'Acto IV Jefe',
    description:
      'La cúpula traidora que financió el golpe de tu hermano se atrinchera en el Coliseo de Pokétopia con Espacio Raro, Zona Extraña, Miraidon y Calyrex-Ice ★.',
    accentColor: 'rose',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Calyrex-Ice', mode: 'boss', label: 'Consejo' },
    featuredPokemon: ['Calyrex-Ice', 'Miraidon', 'Flutter Mane', 'Ursaluna-Bloodmoon'],
    rivalPreview: 'El Consejo Traidor',
    rivalProfile: {
      name: 'El Consejo Traidor',
      title: 'Cúpula Financiera de la CRU · Pokétopia',
      bio: 'Los magnates y generales que vendieron tu exilio y financiaron el núcleo Dinamax de tu hermano bastardo.',
      tacticalInsight:
        'Espacio Raro + Zona Extraña en Turno 0 potencian a Calyrex-Ice ★ y Ursaluna-Bloodmoon mientras Miraidon y Flutter Mane barren cuando acaba el truco.',
      archetypeTag: 'Acto IV · Doble Uber',
    },
    inkSource: [
      'VAR council_fate = "trial"',
      '-> inicio',
      '=== inicio ===',
      'Las gradas doradas de Pokétopia arden con reflectores mientras la cúpula entera del Consejo Traidor bloquea el acceso a los barcos rumbo a Wyndon. # bg: underground-ring # speaker: Narrador # char: dark_commander # side: right # pokemon: calyrexice # mood: serious',
      '«¡¿Cómo te atreves a aparecer aquí con toda una coalición mundial?! Tu hermano ya despertó el núcleo Eternamax en Wyndon: ¡llegas demasiado tarde!» # bg: underground-ring # speaker: El Consejo Traidor # char: dark_commander # side: right # pokemon: miraidon # mood: fierce',
      '* [«Quítense del camino o los juzgo en esta misma arena.»]',
      '    ~ council_fate = "trial"',
      '    «¡Activen Espacio Raro y Zona Extraña! ¡Que Miraidon y Calyrex-Ice borren su nombre de la historia!» # bg: underground-ring # speaker: El Consejo Traidor # char: dark_commander # side: right # pokemon: calyrexice # mood: fierce',
      '    -> cierre',
      '* [«Díganle a mi hermano que ya voy subiendo las escaleras del trono.»]',
      '    ~ council_fate = "storm"',
      '    «¡No saldrás vivo de Pokétopia, príncipe!» # bg: underground-ring # speaker: El Consejo Traidor # char: dark_commander # side: right # pokemon: fluttermane # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'Espacio Raro y Zona Extraña distorsionan el Coliseo. Derribar al Consejo abole todo límite BST y abre el asalto final a la Ciudadela Real de Galar.',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolvePoketopiaTraitorCouncilBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'El Consejo Traidor Cae en Pokétopia',
            subheadline: 'El límite BST queda abolido: la flota aliada zarpa rumbo a la Ciudadela Real de Wyndon.',
            badgeText: 'ACTO IV COMPLETADO · CLÍMAX DESBLOQUEADO',
            paragraphs: [
              'Con el Consejo desmantelado, ya no existen restricciones imperiales sobre tu equipo (BST Cap ∞). Si aún quieres sellar tu Confesión Romántica antes del final, hazlo ahora antes de marchar sobre El Hermano Bastardo.',
            ],
          }
        : {
            headline: 'Frenado en el Coliseo Dorado',
            subheadline: 'La combinación de Espacio Raro, Zona Extraña y doble Uber sostuvo al Consejo.',
            badgeText: 'DERROTA · REAGRUPAR',
            paragraphs: [
              'Usa Protect/Fake Out para quemar los 5 turnos de Espacio Raro y Zona Extraña, o revierte Trick Room desde Turno 1.',
            ],
          },
  },
  {
    id: 'ch12-bastard-brother-climax',
    category: 'story',
    number: 'CLÍMAX · CAP. 12',
    title: 'El Hermano Bastardo',
    subtitle: 'Trono de la Ciudadela Real · Escudo y Eternatus-Eternamax',
    tag: 'CLÍMAX · JEFE FINAL',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'CLÍMAX · Nv. 115',
    difficulty: 'Clímax Final',
    description:
      'El regreso definitivo a Wyndon sin límite de BST. Tu hermano usurpador desata Reflejo + Pantalla de Luz desde Turno 0, Zamazenta-Crowned (Nv. 112) y el coloso prohibido Eternatus-Eternamax ★ (Nv. 115).',
    accentColor: 'rose',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Eternatus-Eternamax', mode: 'boss', label: 'Clímax' },
    featuredPokemon: ['Eternatus-Eternamax', 'Zamazenta-Crowned', 'Calyrex-Shadow', 'Koraidon'],
    rivalPreview: 'El Hermano Bastardo',
    rivalProfile: {
      name: 'El Hermano Bastardo',
      title: 'Usurpador del Trono de Galar · Escudo & Eternamax',
      bio: 'Quien orquestó tu exilio y selló pactos oscuros con la CRU. Protegido por Zamazenta-Crowned y el poder prohibido de Eternatus-Eternamax.',
      tacticalInsight:
        'Pantallas duales + Trampa Rocas T0, presión Uber de Koraidon/Calyrex-Shadow y Eternatus-Eternamax ★ Nv. 115 con Recuperación. Rompe pantallas y corta su curación.',
      archetypeTag: 'Clímax · La Corona',
    },
    inkSource: [
      'VAR throne_vow = "justice"',
      '-> inicio',
      '=== inicio ===',
      'Relámpagos magenta rasgan el cielo sobre la Ciudadela Real de Wyndon. Sentado en el trono de tu padre, tu hermano sostiene la Corona de Galar mientras una grieta Dinamax ruge detrás del vitral roto. # bg: clocktower-ruins # speaker: Narrador # char: bastard_brother # side: right # pokemon: zamazentacrowned # mood: fierce',
      '«¿Sabes cuánto me reí cuando cruzaste el canal en un bote pesquero, hermanito? Creí que morirías en Mesoa o en el desierto de Aura… y en cambio trajiste al mundo entero a mi puerta.» # bg: clocktower-ruins # speaker: El Hermano Bastardo # char: bastard_brother # side: right # pokemon: zamazentacrowned # mood: smug',
      'Zamazenta-Crowned golpea el mármol con su Escudo Herrumbroso mientras la energía carmesí del cielo se condensa en la silueta colosal de Eternatus-Eternamax. # bg: clocktower-ruins # speaker: Narrador # char: bastard_brother # side: right # pokemon: eternatuseternamax # mood: fierce',
      '* [«Voy a arrancarte esa corona y enterrar el Monopolio Ditto para siempre.»]',
      '    ~ throne_vow = "justice"',
      '    «¡Entonces muere como un héroe de cuento! ¡Escudo Usurpado, Pantallas Reales y Energía Dinamax al máximo!» # bg: clocktower-ruins # speaker: El Hermano Bastardo # char: bastard_brother # side: right # pokemon: eternatuseternamax # mood: fierce',
      '    -> cierre',
      '* [«Galar jamás volverá a saquear el planeta. Se acabó tu reinado, hermano.»]',
      '    ~ throne_vow = "mercy"',
      '    «¡Patético! ¡Veremos si tu compasión sobrevive a Zamazenta y a Eternatus-Eternamax!» # bg: clocktower-ruins # speaker: El Hermano Bastardo # char: bastard_brother # side: right # pokemon: zamazentacrowned # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'El combate definitivo por la Corona de Galar comienza. Ganar sella el final principal, calcula tu Ending definitivo y revela el desafío Postgame en el Estadio de Wyndon. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolveBastardBrotherClimaxBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'La Corona de Galar Regresa a su Legítimo Heredero',
            subheadline: 'La energía Dinamax se disipa sobre Wyndon y el reinado del Usurpador llega a su fin.',
            badgeText: 'CLÍMAX SUPERADO · FIN DE LA CAMPAÑA',
            paragraphs: [
              'Ante la caída de Eternatus-Eternamax y Zamazenta-Crowned, la Ciudadela Real inclina sus estandartes. El Monopolio Ditto queda abolido, las colonias de la CRU recuperan su soberanía y tu destino queda sellado según los vínculos que decidiste confesar.',
              'En el horizonte del Estadio de Wyndon, una última invitación dorada brilla para quienes buscan la maestría absoluta: el desafío Postgame Anything Goes contra La Campeona de Galar.',
            ],
          }
        : {
            headline: 'La Ciudadela Aún Arde bajo Energía Dinamax',
            subheadline: 'El Escudo Usurpado y Eternatus-Eternamax repelieron el asalto al trono.',
            badgeText: 'DERROTA EN EL CLÍMAX · REAGRUPAR',
            paragraphs: [
              'Ya no tienes límite de BST: recluta tus mejores refuerzos de la Casa PC, rompe las pantallas iniciales del Usurpador y bloquea la Recuperación de Eternatus-Eternamax.',
            ],
          },
  },
  {
    id: 'ch13-postgame-champion',
    category: 'story',
    number: 'POSTGAME · CAP. 13',
    title: 'La Campeona de Galar (Anything Goes)',
    subtitle: 'Estadio Real de Wyndon · El equipo más roto del juego',
    tag: 'POSTGAME · ANYTHING GOES',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'POSTGAME · Nv. 120',
    difficulty: 'Postgame AG',
    description:
      'Solo visible tras derrotar al Hermano Bastardo. La Campeona abandona toda contención en Anything Goes puro (Nv. 115–120): Kyogre Specs, Xerneas Geomancy, Zacian-C, Calyrex-Shadow, Arceus y Mega-Rayquaza ★.',
    accentColor: 'purple',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Rayquaza-Mega', mode: 'boss', label: 'Postgame 120' },
    featuredPokemon: ['Rayquaza-Mega', 'Arceus', 'Xerneas', 'Kyogre'],
    rivalPreview: 'La Campeona (Anything Goes)',
    rivalProfile: {
      name: 'La Campeona de Galar',
      title: 'Postgame Opcional · Anything Goes Puro (Nv. 115–120)',
      bio: 'Tu maestra de infancia, liberada por fin de toda regla de torneo para medir al nuevo Monarca de Galar con el equipo más devastador del juego.',
      tacticalInsight:
        'Lluvia ∞ + Viento Afín T0 + Xerneas Power Herb Geomancy + Kyogre Specs Water Spout + Arceus + Mega-Rayquaza ★ Nv. 120. Trae tu máximo poder Anything Goes.',
      archetypeTag: 'Postgame · Mastery Badge & NG+',
    },
    inkSource: [
      'VAR postgame_mastery = "accepted"',
      '-> inicio',
      '=== inicio ===',
      'El Estadio Real de Wyndon está completamente vacío salvo por los reflectores de la noche y el murmullo de la lluvia. En el centro del campo, La Campeona sostiene seis Poké Balls doradas. # bg: royal-training-ground # speaker: Narrador # char: champion # side: right # pokemon: rayquazamega # mood: confident',
      '«Venciste a tu hermano, desmantelaste la CRU y salvaste el reino, pequeño. Ahora ya no soy tu maestra ni tú eres el príncipe fugitivo… somos dos soberanos bajo reglas Anything Goes sin piedad.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: arceus # mood: fierce',
      '* [«No te guardes nada, Campeona. Vamos por la Insignia de Maestría.»]',
      '    ~ postgame_mastery = "accepted"',
      '    «¡Esa es la mirada que esperé diez años por ver! ¡Kyogre, Xerneas, Mega-Rayquaza… muéstrenle el techo del mundo!» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: rayquazamega # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'Desafío Postgame Anything Goes (Nv. 115–120). Vencer otorga el True Mastery Badge y desbloquea New Game+. # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: zamazentacrowned # mood: serious',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolvePostgameChampionBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'TRUE MASTERY: Soberano Absoluto de Anything Goes',
            subheadline: 'Mega-Rayquaza ★ Nv. 120 desciende entre aplausos de tu maestra: desbloqueaste True Mastery Badge y New Game+.',
            badgeText: '🏆 TRUE MASTERY BADGE · NEW GAME+ DESBLOQUEADO',
            paragraphs: [
              'La Campeona deja caer su capa entre risas sinceras y te estrecha la mano bajo la lluvia del estadio: «Ya no queda nada que enseñarte. Eres oficialmente el entrenador más fuerte de este mundo.»',
              'Tu perfil ahora porta la Insignia de Maestría Verdadera y puedes iniciar una partida New Game+ conservando tu Pokédex desbloqueada y tus Amuletos Variocolor.',
            ],
          }
        : {
            headline: 'El Techo de Anything Goes Resiste',
            subheadline: 'La Campeona al 100% (Nv. 115–120) demostró por qué nadie la derrocó jamás.',
            badgeText: 'POSTGAME · REINTENTAR',
            paragraphs: [
              'Trae tus propios Ubers, Haze/Clear Smog contra Geomancy de Xerneas, Wide Guard frente a Water Spout/Astral Barrage y vuelve al Estadio de Wyndon.',
            ],
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
    id: 'challenge-xd001-shadow-lugia',
    category: 'challenges',
    number: 'RAID XD001',
    title: 'Proyecto XD001: Lugia Oscuro',
    subtitle: 'Isla Tempestad (Aura) · Cielo Oscuro y las 3 Aves Oscuras',
    tag: 'RAID OSCURO · SNAGGABLE',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Shadow Raid · Nv. 102',
    difficulty: 'Jefe Oscuro',
    description:
      'En las ruinas volcánicas de Isla Tempestad (Aura), el Maestro Cifra resguarda el arma definitiva que la CRU jamás pudo clonar: XD001 Lugia Oscuro ★ con Shadow Aeroblast (área 115 BP) y Shadow Eclipse (+2 SpA/+2 SpD/+1 Spe). ¡Vencer arrebata a los 6 Pokémon Oscuros directo a tus Cajas PC!',
    accentColor: 'purple',
    teamEditPolicy: 'editable',
    teamMode: 'campaign',
    showcaseSprite: { species: 'Lugia', mode: 'boss', label: 'XD001 Oscuro' },
    featuredPokemon: ['Lugia', 'Articuno', 'Zapdos', 'Moltres'],
    rivalPreview: 'Maestro Cifra Greevil · XD001',
    rivalProfile: {
      name: 'Maestro Cifra Greevil',
      title: 'Proyecto XD001 · Isla Tempestad (Aura)',
      bio: 'Arquitecto de la máquina de corazones cerrados en Aura. Despliega a Articuno, Zapdos, Moltres, Snorlax, Salamence y al legendario XD001 Lugia Oscuro ★ bajo Cielo Oscuro perpetuo.',
      tacticalInsight:
        'El tipo Hada es INMUNE (0×) a todos los ataques Shadow. Rompe Multiscale de XD001 y frena Shadow Eclipse con Haze o Taunt antes de que barra el tablero con Shadow Aeroblast.',
      archetypeTag: 'Raid Colosseum / XD · Snagging',
    },
    inkSource: [
      'VAR xd001_stance = "keep_choice"',
      '-> inicio',
      '=== inicio ===',
      'Nubes violetas giran sobre el cráter de Isla Tempestad frente a la costa de Aura. Un rugido abisal desgarra la tormenta y una silueta negra y plateada desciende con ojos carmesí: XD001, el Lugia Oscuro. # bg: titan-sanctum # speaker: Narrador # char: dark_commander # side: right # pokemon: lugia # mood: fierce',
      '«¡Bienvenido al Proyecto XD001, Príncipe de Galar! Mientras tu familia clonaba copias débiles con Ditto, en Aura perfeccionamos el cierre total del corazón.» # bg: titan-sanctum # speaker: Maestro Cifra # char: dark_commander # side: right # pokemon: articuno # mood: smug',
      '* [«Voy a arrebatarte a XD001 y llevarlo a la Cámara de Purificación para abrir su corazón.»]',
      '    ~ xd001_stance = "purify"',
      '    «¡Iluso! ¡XD001 fue diseñado para ser imposible de purificar! ¡Aves Oscuras, desaten el Cielo Oscuro!» # bg: titan-sanctum # speaker: Maestro Cifra # char: dark_commander # side: right # pokemon: lugia # mood: fierce',
      '    -> cierre',
      '* [«Si los arrebato ahora, decidiré yo mismo si sanarlos… o usar Shadow Aeroblast contra el Usurpador.»]',
      '    ~ xd001_stance = "keep_choice"',
      '    «¡Ja! Hablas como un verdadero tirano. ¡Veamos si sobrevives primero a Shadow Eclipse y Shadow Aeroblast!» # bg: titan-sanctum # speaker: Maestro Cifra # char: dark_commander # side: right # pokemon: zapdos # mood: fierce',
      '    -> cierre',
      '=== cierre ===',
      'El Cielo Oscuro cae sobre el cráter. Recuerda: el tipo Hada es INMUNE (0×) a los ataques Shadow. Al ganar, XD001 Lugia Oscuro y los otros 5 Pokémon Oscuros se unen directamente a tus Cajas PC. # bg: titan-sanctum # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious',
      '-> END',
    ].join('\n'),
    resolveBattleConfig: resolveXd001ShadowLugiaBattle,
    getEpilogue: (won: boolean) =>
      won
        ? {
            headline: 'XD001 Lugia Oscuro Arrebatado',
            subheadline:
              'La tormenta violeta sobre Isla Tempestad cede mientras las 6 Poké Balls Oscuras se registran en tu PC Box.',
            badgeText: 'VICTORIA · PROYECTO XD001 CAPTURADO',
            paragraphs: [
              'XD001 Lugia Oscuro (con Shadow Aeroblast y Shadow Eclipse) junto con Articuno, Zapdos, Moltres, Snorlax y Salamence Oscuros ahora reposan en tus Cajas PC.',
              'Llévalos a la nueva pestaña «Cámara de Purificación» en tus Cajas PC para bajar su Medidor de Corazón pasivamente — y al llegar a 0, decide libremente si purificarlos (Lugia aprende Psycho Boost y activa el Poder de la Amistad) o dejarlos Oscuros para siempre con sus movimientos rotos.',
            ],
          }
        : {
            headline: 'Barrido por el Cielo Oscuro de XD001',
            subheadline:
              'Shadow Eclipse y Shadow Aeroblast dominaron el cráter de Isla Tempestad.',
            badgeText: 'DERROTA · REAGRUPAR',
            paragraphs: [
              'Trae Pokémon tipo Hada (inmunidad 0× a Shadow), Haze o Clear Smog contra Shadow Eclipse, y cambia el clima de Cielo Oscuro antes de volver a Isla Tempestad.',
            ],
          },
  },
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
