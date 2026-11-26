import { Teams } from '@pkmn/sim';
import type {
  BattleDifficultyMode,
  CharacterId,
  NpcAiPersonality,
  NpcDefinition,
  NpcTeamVariant,
  ResolvedBattleConfig,
  RivalProfile,
} from '../types/game';

export const NPC_REGISTRY: Record<CharacterId, NpcDefinition> = {
  prince: {
    id: 'prince',
    name: 'Príncipe Heredero',
    title: 'Heredero de la Corona de Galar',
    bio: 'Joven heredero forzado a convertir su escolta diaria en un arma táctica mientras desentraña la conspiración que rodea al trono.',
    tacticalInsight: 'Equilibrio entre templanza defensiva y respuesta quirúrgica.',
    archetypeTag: 'Protagonista',
    personality: {
      styleName: 'Estratega Real',
      aggression: 0.55,
      disruptionBias: 0.5,
      protectBias: 0.55,
      switchDiscipline: 0.7,
      directiveSummary: 'Combina control de ritmo, protección y contraataques medidos.',
    },
    dialogues: {},
  },

  assassin: {
    id: 'assassin',
    name: 'Asesino Carmesí',
    title: 'Rival Recurrente · Cazador de la Corona',
    bio: 'Mercenario pelirrojo tan brillante como exasperante. Estudió tus hábitos durante meses, pero disfruta demasiado poniéndote a prueba como para dejarte caer sin dar pelea.',
    tacticalInsight:
      'Calcula cada apertura con frialdad, aunque su orgullo lo delata cuando logras leerle el pulso.',
    archetypeTag: 'Rival · Enemigos a Aliados',
    personality: {
      styleName: 'Rival Táctico Preciso',
      aggression: 0.72,
      disruptionBias: 0.68,
      protectBias: 0.45,
      switchDiscipline: 0.75,
      directiveSummary:
        'Castiga aperturas pasivas, busca romper tu ritmo y presiona sin regalar turnos.',
    },
    socialLink: {
      bondTrack: 'rival-romance',
      romanceable: true,
      canTagPartner: true,
      bondNote: 'Vínculo futuro: Rival Recurrente · Ruta Enemies to Lovers & Combates en Equipo',
    },
    dialogues: {
      onBattleStart: [
        '«A ver si aprendiste algo desde la última vez, Alteza. No me hagas aburrirme.»',
      ],
      onFirstFoeKO: [
        '«Buena lectura... nada mal. Pero apenas estamos calentando.»',
      ],
      onPlayerFaint: [
        '«Demasiado lento. Te dije que conozco tus reflejos de memoria.»',
      ],
      onSuperEffective: [
        '«Tsk... ahí sí me dolió. No te acostumbres a acertar así.»',
      ],
      onAceEntry: [
        '«Se acabaron las pruebas. Veamos si puedes sostenerme la mirada contra mi carta fuerte.»',
      ],
      onLowHp: [
        '«Todavía sigo de pie, Príncipe. No celebres antes de tiempo.»',
      ],
      onDefeat: [
        '«...Increíble. Supongo que tendré que seguir vigilándote más de cerca.»',
      ],
      onVictory: [
        '«Levántate, Alteza. Si caes aquí, no valdrá la pena volver a cruzarnos.»',
      ],
    },
    chapterVariants: {
      'ch1-wyndon-chase': [
        {
          id: 'canonical',
          label: 'Formación Original (Anti-Escolta)',
          description: 'Su escuadrón clásico de la persecución en Wyndon.',
        },
        {
          id: 'assassin-tailwind-blitz',
          label: 'Variante: Tormenta de Velocidad',
          description: 'Cambia parte de su vanguardia hacia presión veloz con Tornadus e Incineroar.',
          rivalShowdownPaste: [
            'Tornadus @ Covert Cloak\nAbility: Prankster\nLevel: 100\nTera Type: Dark\nEVs: 252 HP / 4 Def / 252 Spe\nTimid Nature\nIVs: 0 Atk\n- Tailwind\n- Taunt\n- Bleakwind Storm\n- Protect',
            'Incineroar @ Sitrus Berry\nAbility: Intimidate\nLevel: 100\nTera Type: Grass\nEVs: 252 HP / 116 Def / 140 SpD\nCareful Nature\n- Fake Out\n- Flare Blitz\n- Knock Off\n- Parting Shot',
            'Gholdengo @ Life Orb\nAbility: Good as Gold\nLevel: 100\nTera Type: Steel\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\nIVs: 0 Atk\n- Make It Rain\n- Shadow Ball\n- Thunderbolt\n- Protect',
            'Heatran @ Leftovers\nAbility: Flash Fire\nLevel: 100\nTera Type: Grass\nEVs: 252 HP / 4 Def / 252 SpA\nModest Nature\nIVs: 0 Atk\n- Heat Wave\n- Flash Cannon\n- Earth Power\n- Protect',
            'Rillaboom @ Miracle Seed\nAbility: Grassy Surge\nLevel: 100\nTera Type: Fire\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Fake Out\n- Grassy Glide\n- Wood Hammer\n- High Horsepower',
            'Kingambit ★ (Kingambit) @ Black Glasses\nAbility: Defiant\nLevel: 102\nTera Type: Dark\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Brick Break\n- Iron Head\n- Kowtow Cleave\n- Sucker Punch',
          ].join('\n\n'),
          reserveAsLastAceSpecies: 'Kingambit',
        },
      ],
    },
  },

  dark_commander: {
    id: 'dark_commander',
    name: 'Comandante Siniestro',
    title: 'Señor de la Casa Rebelde del Estandarte Oscuro',
    bio: 'Aristócrata de modales glaciales y bastón tallado en calavera. Invocó el decreto antiguo de estandartes para desangrar a la Corona sin mancharse los guantes.',
    tacticalInsight:
      'Su doctrina privilegia el desgaste implacable: ensucia el terreno y espera a que tu armadura ceda por su propio peso.',
    archetypeTag: 'Casa Noble · Estandarte Oscuro',
    personality: {
      styleName: 'Inquisidor de Desgaste',
      aggression: 0.62,
      disruptionBias: 0.82,
      protectBias: 0.4,
      switchDiscipline: 0.78,
      directiveSummary:
        'Prioriza trampas de entrada, control de estado y castigos precisos sobre cambios.',
    },
    socialLink: {
      bondTrack: 'noble-house',
      bondNote: 'Casa Rebelde · Rivalidad política de linaje',
    },
    dialogues: {
      onBattleStart: [
        '«Qué puntualidad, Alteza. Veamos cuánto tarda en oxidarse el acero de la Corona.»',
      ],
      onFirstFoeKO: [
        '«Una pieza menos en el tablero no altera la sentencia del decreto.»',
      ],
      onPlayerFaint: [
        '«Elegante, limpio y definitivo. Así gobierna nuestra casa.»',
      ],
      onSuperEffective: [
        '«Hmm. Debo concederle que eligió bien ese ángulo.»',
      ],
      onAceEntry: [
        '«Basta de cortesías diplomáticas. Que el estandarte oscuro reclame este campo.»',
      ],
      onLowHp: [
        '«Aún queda filo suficiente para cobrar su error.»',
      ],
      onDefeat: [
        '«...El acero resistió hoy. El consejo recordará este desenlace.»',
      ],
      onVictory: [
        '«Retire sus estandartes, Príncipe. El páramo ya dictó veredicto.»',
      ],
    },
    chapterVariants: {
      'ch2-monotype-banners': [
        {
          id: 'canonical',
          label: 'Doctrina Original (Púas y Presión)',
          description: 'Su formación clásica Monotype Siniestro de desgaste.',
        },
        {
          id: 'dark-hyper-offense',
          label: 'Variante: Corte Nocturno (Ofensiva)',
          description: 'Alineación Monotype Siniestro más veloz con pantallas de Grimmsnarl y sweepers pesados.',
          rivalShowdownPaste: [
            'Grimmsnarl @ Light Clay\nAbility: Prankster\nLevel: 100\nEVs: 252 HP / 140 Def / 116 SpD\nCareful Nature\n- Reflect\n- Light Screen\n- Taunt\n- Spirit Break',
            'Weavile @ Heavy-Duty Boots\nAbility: Pressure\nLevel: 100\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Triple Axel\n- Knock Off\n- Low Kick\n- Ice Shard',
            'Hydreigon @ Choice Specs\nAbility: Levitate\nLevel: 100\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\nIVs: 0 Atk\n- Dark Pulse\n- Flamethrower\n- Earth Power\n- Draco Meteor',
            'Bisharp @ Eviolite\nAbility: Defiant\nLevel: 100\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Swords Dance\n- Iron Head\n- Throat Chop\n- Sucker Punch',
            'Mandibuzz @ Rocky Helmet\nAbility: Overcoat\nLevel: 100\nEVs: 248 HP / 244 Def / 16 Spe\nImpish Nature\n- Foul Play\n- Roost\n- U-turn\n- Toxic',
            'Kingambit @ Black Glasses\nAbility: Supreme Overlord\nLevel: 100\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Kowtow Cleave\n- Sucker Punch\n- Iron Head\n- Swords Dance',
          ].join('\n\n'),
          reserveAsLastAceSpecies: 'Kingambit',
        },
      ],
    },
  },

  clandestine_tamer: {
    id: 'clandestine_tamer',
    name: 'Lord Vexen',
    title: 'Domador Clandestino del Foso',
    bio: 'Noble caído en desgracia que apesta a licor barato y crueldad. Gobierna un cuadrilátero subterráneo con látigo y Poké Balls con púas para alimentar el rencor de sus bestias.',
    tacticalInsight:
      'Su orgullo le impide ceder terreno: empuja con fuerza bruta y odio acumulado hasta aplastar o reventar.',
    archetypeTag: 'Foso Clandestino · Rencor',
    personality: {
      styleName: 'Brutalista Implacable',
      aggression: 0.92,
      disruptionBias: 0.35,
      protectBias: 0.15,
      switchDiscipline: 0.2,
      directiveSummary:
        'Ataca casi sin descanso y rara vez se retira; castiga el intercambio físico directo.',
    },
    socialLink: {
      bondTrack: 'antagonist',
      bondNote: 'Enemigo irreconciliable · Red ilegal de Wyndon',
    },
    dialogues: {
      onBattleStart: [
        '«¡Jajaja! ¿El niñito de palacio vino a darme sermones? ¡Muérdanle la garganta!»',
      ],
      onFirstFoeKO: [
        '«¡Inútil! ¡Por eso no merecen más que el látigo! ¡El que sigue!»',
      ],
      onPlayerFaint: [
        '«¡Así suena el odio puro, Alteza! ¡Ni tu corona aguanta ese golpe!»',
      ],
      onSuperEffective: [
        '«¡Maldita basura, aguanta de pie o te dejo sin cena otra semana!»',
      ],
      onAceEntry: [
        '«¡Basta de juegos! ¡Sal de ahí y haz pedazos a este cachorro real!»',
      ],
      onLowHp: [
        '«¡Todavía respiras, bestia! ¡No te atrevas a caer frente a mí!»',
      ],
      onDefeat: [
        '«¡No...! ¡Mis jaulas, mis apuestas! ¡Esto no termina aquí, mocoso!»',
      ],
      onVictory: [
        '«¡Lárguense de mi foso! Aquí manda el látigo, no los discursos bonitos.»',
      ],
    },
    chapterVariants: {
      'ch3-clandestine-tamer': [
        {
          id: 'canonical',
          label: 'Cuadrilátero Original (Vínculo Roto)',
          description: 'Su formación clásica de Normal con Felicidad 0.',
        },
        {
          id: 'vexen-feral-cage',
          label: 'Variante: Jaula Salvaje',
          description: 'Bestias aún más agresivas con Reckless y muros pesados de desgaste.',
          rivalShowdownPaste: [
            'Kangaskhan @ Silk Scarf\nAbility: Scrappy\nLevel: 60\nHappiness: 0\nEVs: 4 HP / 252 Atk / 252 Spe\nJolly Nature\n- Fake Out\n- Frustration\n- Earthquake\n- Sucker Punch',
            'Staraptor @ Choice Scarf\nAbility: Reckless\nLevel: 60\nHappiness: 0\nEVs: 4 HP / 252 Atk / 252 Spe\nJolly Nature\n- Brave Bird\n- Double-Edge\n- Close Combat\n- U-turn',
            'Porygon2 @ Eviolite\nAbility: Trace\nLevel: 60\nHappiness: 0\nEVs: 252 HP / 252 Def / 4 SpD\nBold Nature\nIVs: 0 Atk\n- Foul Play\n- Ice Beam\n- Thunder Wave\n- Recover',
            'Ursaring @ Flame Orb\nAbility: Guts\nLevel: 60\nHappiness: 0\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Frustration\n- Close Combat\n- Crunch\n- Protect',
            'Snorlax @ Leftovers\nAbility: Thick Fat\nLevel: 60\nHappiness: 0\nEVs: 252 HP / 140 Def / 116 SpD\nCareful Nature\n- Frustration\n- Body Press\n- Curse\n- Rest',
            'Lopunny ★ (Lopunny) @ Choice Band\nAbility: Limber\nLevel: 62\nHappiness: 0\nEVs: 4 HP / 252 Atk / 252 Spe\nJolly Nature\n- Frustration\n- High Jump Kick\n- Switcheroo\n- Quick Attack',
          ].join('\n\n'),
          reserveAsLastAceSpecies: 'Lopunny',
        },
      ],
    },
  },

  rat_saboteur: {
    id: 'rat_saboteur',
    name: 'El Hombre Rata',
    title: 'Saboteador del Banquete · Tramposo Sin Reglas',
    bio: 'Rata de alcantarilla con máscara de Zoroark, ballesta oculta y medallas robadas. Odia las peleas limpias: llena el campo de trucos ilegales, trampas desesperantes y un único depredador escondido entre ilusiones.',
    tacticalInsight:
      'Sus acompañantes casi no hacen daño directo, pero cada uno está diseñado para sacarte de quicio mientras su verdadero verdugo acecha disfrazado.',
    archetypeTag: 'Bonus · Tramposo Sin Reglas',
    personality: {
      styleName: 'Tramposo Tilteante',
      aggression: 0.42,
      disruptionBias: 0.98,
      protectBias: 0.78,
      switchDiscipline: 0.65,
      directiveSummary:
        'Abusa de estado, redirección, trucos ilegales y engaños hasta que su As pueda rematar.',
    },
    socialLink: {
      bondTrack: 'antagonist',
      bondNote: 'Sindicato de las cloacas · Especialista en trampas sucias',
    },
    dialogues: {
      onBattleStart: [
        '«¡Jejeje! ¿Reglas de torneo? ¡Aquí abajo las reglas se queman, Alteza! ¡Disfruta el circo!»',
      ],
      onFirstFoeKO: [
        '«¡Uy, qué rudo! No te preocupes, tengo trucos todavía más molestos en el bolsillo.»',
      ],
      onPlayerFaint: [
        '«¡Jajaja! ¿Ya te empezó a doler la cabeza? ¡Y eso que ni viste quién era el de verdad!»',
      ],
      onSuperEffective: [
        '«¡Ey, ey, sin golpear tan fuerte! ¡Eso debería ser ilegal... ah no, aquí nada lo es!»',
      ],
      onAceEntry: [
        '«¡Se acabó el teatro de marionetas! ¡Sal de las sombras, mi joya de la corona, y hazlo pedazos!»',
      ],
      onLowHp: [
        '«¡Aún me queda una rata bajo la manga, principito!»',
      ],
      onDefeat: [
        '«¡Tsk! ¡Maldito niño con suerte! ¡Me llevo mis cuchillos... pero volverás a oír mis pasos en las tuberías!»',
      ],
      onVictory: [
        '«¡Jajaja! Tanto entrenamiento de palacio para caer contra basura callejera. ¡Qué delicia!»',
      ],
    },
    chapterVariants: {
      'ch2-banquet-ambush': [
        {
          id: 'canonical',
          label: 'Circo de la Rata (Shedinja + Mega Sableye + Zoroark)',
          description: 'Utilidad ilegal y desesperante respaldando a un Zoroark sobre-leveado.',
        },
        {
          id: 'rat-banette-nightmare',
          label: 'Variante: Sombras y Destino (Mega Banette + Ditto)',
          description: 'Cambia Mega Sableye y Wobbuffet por Mega Banette Bromista (Mismo Destino) y Ditto Impostor.',
          rivalShowdownPaste: [
            'Smeargle @ Focus Sash\nAbility: Prankster\nLevel: 100\nEVs: 252 HP / 4 Def / 252 Spe\nJolly Nature\n- Spore\n- Follow Me\n- Revival Blessing\n- Fake Out',
            'Shedinja @ Air Balloon\nAbility: Wonder Guard\nLevel: 100\nTera Type: Electric\nEVs: 252 Atk / 252 Spe\nAdamant Nature\n- Shadow Sneak\n- Will-O-Wisp\n- Endeavor\n- Protect',
            'Banette-Mega @ Focus Sash\nAbility: Prankster\nLevel: 100\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Destiny Bond\n- Will-O-Wisp\n- Encore\n- Poltergeist',
            'Ditto @ Choice Scarf\nAbility: Imposter\nLevel: 100\nEVs: 252 HP / 4 Def / 252 Spe\nJolly Nature\n- Transform',
            'Zoroark ★ (Zoroark) @ Life Orb\nAbility: Illusion\nLevel: 118\nTera Type: Dark\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\nIVs: 0 Atk\n- Night Daze\n- Flamethrower\n- Sludge Bomb\n- Nasty Plot',
          ].join('\n\n'),
          reserveAsLastAceSpecies: 'Zoroark',
        },
      ],
    },
  },

  royal_archivist: {
    id: 'royal_archivist',
    name: 'El Archivista Real',
    title: 'Custodio de la Bóveda Silph',
    bio: 'Anciano guardián de pergaminos y cintas prohibidas. Su bastón de astrolabio ilumina las salas más profundas del palacio donde aún respira la Era Antigua de Kanto.',
    tacticalInsight:
      'Respeta la pureza de las viejas leyes: controla el estado del campo con paciencia de erudito.',
    archetypeTag: 'Archivo · Era Antigua Gen 1',
    personality: {
      styleName: 'Erudito Clásico',
      aggression: 0.65,
      disruptionBias: 0.72,
      protectBias: 0.3,
      switchDiscipline: 0.7,
      directiveSummary:
        'Busca parálisis, sueño y remates precisos bajo las leyes implacables de Kanto.',
    },
    socialLink: {
      bondTrack: 'mentor',
      bondNote: 'Sabio del Archivo · Guardián del pasado competitivo',
    },
    dialogues: {
      onBattleStart: [
        '«Silencio en la bóveda, Alteza. Escuche cómo combatían los antiguos antes de que existieran atajos.»',
      ],
      onFirstFoeKO: [
        '«Excelente registro. Veo que su mente se adapta rápido a la vieja escuela.»',
      ],
      onPlayerFaint: [
        '«En la Era Antigua, un solo descuido se paga al instante.»',
      ],
      onSuperEffective: [
        '«Fascinante. Anotaré esa jugada al margen del tomo.»',
      ],
      onAceEntry: [
        '«Ahora enfrente el recuerdo que Silph Co. juró no volver a despertar.»',
      ],
      onDefeat: [
        '«Magnífico... el pasado acaba de inclinarse ante un nuevo maestro.»',
      ],
      onVictory: [
        '«La cinta vuelve al estante. Regrese cuando haya estudiado mejor el pulso de Kanto.»',
      ],
    },
  },

  champion: {
    id: 'champion',
    name: 'La Campeona',
    title: 'Soberana Invicta de Galar',
    bio: 'Mentora de infancia del Príncipe y referente absoluto de la región. Su sonrisa cálida jamás suaviza el filo con el que prueba a quien heredará la corona.',
    tacticalInsight:
      'Nunca regala el ritmo por cortesía; alterna control, desgaste y cierres implacables.',
    archetypeTag: 'Mentora · Soberana',
    personality: {
      styleName: 'Maestría Equilibrada',
      aggression: 0.74,
      disruptionBias: 0.65,
      protectBias: 0.55,
      switchDiscipline: 0.85,
      directiveSummary:
        'Presiona cada debilidad, cuida sus cambios y guarda el golpe decisivo para el final.',
    },
    socialLink: {
      bondTrack: 'mentor',
      canTagPartner: true,
      bondNote: 'Mentora real · Posible aliada en combates en equipo',
    },
    dialogues: {
      onBattleStart: [
        '«Muéstrame todo lo que aprendiste, pequeño. No voy a contenerme hoy.»',
      ],
      onFirstFoeKO: [
        '«¡Bien visto! Así se responde cuando la balanza está inclinada.»',
      ],
      onPlayerFaint: [
        '«Respira y piensa el siguiente turno. El pánico pesa más que cualquier desventaja.»',
      ],
      onAceEntry: [
        '«Llegaste hasta mi favorita. Veamos si puedes sostener este último paso.»',
      ],
      onDefeat: [
        '«Me dejaste sin palabras... Galar va a estar en buenas manos.»',
      ],
      onVictory: [
        '«Buen intento. Levántate, sacúdete la arena y vuelve a desafiarme.»',
      ],
    },
  },

  dock_militia: {
    id: 'dock_militia',
    name: 'Capataz de los Muelles',
    title: 'La Milicia de los Muelles',
    bio: 'Jefe ruidoso de una cuadrilla portuaria que confunde el número con la fuerza.',
    tacticalInsight:
      'Atacan todos a la vez sin miramientos; su propia imprudencia puede volverse tu mejor aliada.',
    archetypeTag: 'Desafío · 1 vs 6',
    personality: {
      styleName: 'Avalancha Imprudente',
      aggression: 0.9,
      disruptionBias: 0.35,
      protectBias: 0.1,
      switchDiscipline: 0.15,
      directiveSummary: 'Embiste sin frenos aunque sus golpes afecten a sus propios socios.',
    },
    dialogues: {
      onBattleStart: ['«¡Cierren el puente! ¡Seis contra uno y nadie sale caminando!»'],
      onFirstFoeKO: ['«¡Qué importa uno menos! ¡Échenle encima al resto!»'],
      onAceEntry: ['«¡Ya estuvo bueno de burlarse del muelle! ¡Aplástenlo de una vez!»'],
      onDefeat: ['«¡Maldito monstruo...! ¡Todos atrás hacia las grúas!»'],
    },
  },

  mine_sapper: {
    id: 'mine_sapper',
    name: 'Jefe Zapador Rebelde',
    title: 'Escuadrón de Demolición · Minas',
    bio: 'Demolicionista fanático que prefiere derrumbar el túnel entero antes que dejarte pasar ileso.',
    tacticalInsight: 'No busca ganar limpio: quiere dejarte roto para lo que aguarda afuera.',
    archetypeTag: 'Supervivencia · Oleada 1',
    personality: {
      styleName: 'Demolición Suicida',
      aggression: 0.85,
      disruptionBias: 0.55,
      protectBias: 0.15,
      switchDiscipline: 0.25,
      directiveSummary: 'Desgasta sin miedo al sacrificio y detona cuando queda acorralado.',
    },
    dialogues: {
      onBattleStart: ['«¡Enciendan las mechas! ¡Aunque pasen, saldrán arrastrándose!»'],
      onLowHp: ['«¡Si nos caemos nosotros, el techo se viene abajo contigo!»'],
      onDefeat: ['«¡Ja! Buena suerte con lo que te espera al otro lado del humo...»'],
    },
  },

  corrupt_captain: {
    id: 'corrupt_captain',
    name: 'Capitán de la Guardia Corrupta',
    title: 'Bloqueo de las Minas',
    bio: 'Oficial traidor que aguarda tras el humo con un escuadrón fresco para rematar sobrevivientes.',
    tacticalInsight: 'Aprovecha cada herida que arrastres de la primera oleada sin piedad.',
    archetypeTag: 'Supervivencia · Oleada 2',
    personality: {
      styleName: 'Verdugo Disciplinado',
      aggression: 0.8,
      disruptionBias: 0.6,
      protectBias: 0.35,
      switchDiscipline: 0.65,
      directiveSummary: 'Remata piezas desgastadas y cierra el paso con orden militar.',
    },
    dialogues: {
      onBattleStart: ['«Sin testigos en el Nivel Profundo 4. Terminemos esto de una vez.»'],
      onPlayerFaint: ['«El cansancio cobra factura, Alteza.»'],
      onDefeat: ['«Imposible... incluso heridos rompieron el cerco.»'],
    },
  },

  hammerlocke_duke: {
    id: 'hammerlocke_duke',
    name: 'Duque de Hammerlocke',
    title: 'Comandante de la Falange',
    bio: 'Veterano estratega que aún instruye a su casa en el arte de las formaciones de tres flancos.',
    tacticalInsight: 'Coordina escudos y velocidad entre sus tres posiciones con disciplina militar.',
    archetypeTag: 'Triples · Hammerlocke',
    personality: {
      styleName: 'Comandante de Falange',
      aggression: 0.68,
      disruptionBias: 0.62,
      protectBias: 0.68,
      switchDiscipline: 0.72,
      directiveSummary: 'Protege sus líneas y castiga cualquier flanco mal cubierto.',
    },
    dialogues: {
      onBattleStart: ['«¡Alineen los tres frentes! Veamos si sabes mandar una falange.»'],
      onFirstFoeKO: ['«¡Cierren la brecha! Un flanco caído no quiebra a Hammerlocke.»'],
      onDefeat: ['«Mis respetos, heredero. Dominas las tres líneas como un general.»'],
    },
  },

  triad_knights: {
    id: 'triad_knights',
    name: 'Tríada de Élite',
    title: 'Guardia Interior de Hammerlocke',
    bio: 'Tres caballeros acorazados entrenados para pelear al unísono en el círculo de piedra.',
    tacticalInsight: 'Su escudo central respira a un compás fijo mientras la hoja del flanco acecha.',
    archetypeTag: 'Desafío · 1 vs 3',
    personality: {
      styleName: 'Escudo y Lanza',
      aggression: 0.72,
      disruptionBias: 0.5,
      protectBias: 0.75,
      switchDiscipline: 0.5,
      directiveSummary: 'Alterna defensa de área y remates letales coordinados.',
    },
    dialogues: {
      onBattleStart: ['«¡Formación de juicio! Sostén el centro si te crees digno.»'],
      onFirstFoeKO: ['«Un hermano cae, pero el círculo sigue cerrado.»'],
      onDefeat: ['«Las lanzas se inclinan. Has superado el juicio del castillo.»'],
    },
  },

  colossus_keeper: {
    id: 'colossus_keeper',
    name: 'Custodio del Coloso',
    title: 'Guardián del Santuario Sellado',
    bio: 'Sacerdote que preparó el despertar del titán con cinco acólitos dedicados a mantenerlo inmortal.',
    tacticalInsight: 'Todos sus acompañantes existen solo para curar, blindar y alimentar al coloso.',
    archetypeTag: 'Jefe · Santuario',
    personality: {
      styleName: 'Coro del Titán',
      aggression: 0.55,
      disruptionBias: 0.75,
      protectBias: 0.72,
      switchDiscipline: 0.45,
      directiveSummary: 'Prioriza curar y potenciar al coloso sobre cualquier daño menor.',
    },
    dialogues: {
      onBattleStart: ['«El santuario entero respira por el Titán. Tu esfuerzo se disolverá contra la piedra.»'],
      onSuperEffective: ['«Las runas absorberán incluso ese impacto... mientras el coro siga cantando.»'],
      onDefeat: ['«Las seis luces se apagan... el coloso vuelve al sueño.»'],
    },
  },

  tobias: {
    id: 'tobias',
    name: 'Tobías',
    title: 'El Misterio del Valle Lirio',
    bio: 'Participante silencioso que barrió los gimnasios de Sinnoh sin mostrar jamás su equipo completo.',
    tacticalInsight: 'Su poder individual parece sacado de un mito, pero ningún gigante es invencible en una pelea larga.',
    archetypeTag: 'Archivo · Liga de Sinnoh',
    personality: {
      styleName: 'Soberano de Mitos',
      aggression: 0.82,
      disruptionBias: 0.65,
      protectBias: 0.35,
      switchDiscipline: 0.6,
      directiveSummary: 'Impone presión legendaria desde el arranque y reserva su carta final.',
    },
    socialLink: {
      bondTrack: 'legend',
      bondNote: 'Archivo Anime · Semifinal de Sinnoh',
    },
    dialogues: {
      onBattleStart: ['«Adelante, Ash. Muéstrame hasta dónde puede llegar tu determinación.»'],
      onFirstFoeKO: ['«Impresionante... nadie en todo Sinnoh había logrado derribar a mi primero.»'],
      onPlayerFaint: ['«La brecha sigue siendo demasiado grande.»'],
      onAceEntry: ['«Me obligaste a mostrar mi última carta. Qué combate inolvidable.»'],
      onDefeat: ['«...Ganaste de verdad. Esta semifinal pasará a la historia.»'],
    },
  },

  ash_ketchum: {
    id: 'ash_ketchum',
    name: 'Ash Ketchum',
    title: 'Retador de Pueblo Paleta · Sinnoh',
    bio: 'Entrenador incansable decidido a derribar lo imposible junto a Pikachu y sus compañeros de Sinnoh.',
    tacticalInsight: 'Improvisa bajo presión y jamás baja los brazos.',
    archetypeTag: 'Archivo · Protagonista',
    personality: {
      styleName: 'Impulso Imparable',
      aggression: 0.85,
      disruptionBias: 0.35,
      protectBias: 0.25,
      switchDiscipline: 0.45,
      directiveSummary: 'Presiona sin dudar confiando en la sinergia del equipo.',
    },
    dialogues: {},
  },
};

export function getNpcDefinition(charId: CharacterId): NpcDefinition {
  return NPC_REGISTRY[charId] ?? NPC_REGISTRY.assassin;
}

export function buildRivalProfileFromNpc(
  charId: CharacterId,
  fallback?: RivalProfile
): RivalProfile {
  const npc = NPC_REGISTRY[charId];
  if (!npc) {
    return (
      fallback ?? {
        name: 'Adversario',
        title: 'Combate Táctico',
        bio: '',
        tacticalInsight: '',
        archetypeTag: 'Combate',
      }
    );
  }
  return {
    name: fallback?.name || npc.name,
    title: fallback?.title || npc.title,
    bio: fallback?.bio || npc.bio,
    tacticalInsight: fallback?.tacticalInsight || npc.tacticalInsight,
    archetypeTag: fallback?.archetypeTag || npc.archetypeTag,
    personalityStyle: npc.personality.styleName,
    directiveSummary: npc.personality.directiveSummary,
    bondBadge: npc.socialLink?.romanceable
      ? 'Rival · Vínculo Especial'
      : npc.socialLink?.canTagPartner
        ? 'Aliado Potencial'
        : undefined,
  };
}

export function getVariantsForChapterNpc(
  charId: CharacterId,
  chapterId: string
): NpcTeamVariant[] {
  const npc = NPC_REGISTRY[charId];
  return npc?.chapterVariants?.[chapterId] ?? [];
}

/**
 * Applies selected BattleDifficultyMode ('standard' | 'kaizo' | 'nightmare')
 * and optional NPC team variant (or random run pick) cleanly onto a ResolvedBattleConfig.
 */
export function applyNpcRunModifiers(
  baseConfig: ResolvedBattleConfig,
  difficulty: BattleDifficultyMode,
  variantId = 'canonical'
): ResolvedBattleConfig {
  const npc = getNpcDefinition(baseConfig.rivalCharId);
  const variants = getVariantsForChapterNpc(
    baseConfig.rivalCharId,
    baseConfig.chapterId
  );

  let chosenVariant: NpcTeamVariant | undefined;
  if (variantId === 'random' && variants.length > 0) {
    chosenVariant = variants[Math.floor(Math.random() * variants.length)];
  } else if (variantId && variantId !== 'canonical') {
    chosenVariant = variants.find((v) => v.id === variantId);
  } else {
    chosenVariant = variants[0];
  }

  let rivalPaste = chosenVariant?.rivalShowdownPaste ?? baseConfig.rivalShowdownPaste;
  const isOfficialFixedCap =
    baseConfig.formatId === 'gen9vgc2024regg' ||
    baseConfig.formatId === 'gen9monotype' ||
    baseConfig.formatId === 'gen91v1';

  // Difficulty level adjustment (safe for customgame formats; preserves official VGC/Monotype/1v1 caps!)
  if (!isOfficialFixedCap && difficulty !== 'kaizo') {
    const sets = Teams.import(rivalPaste);
    if (sets && sets.length > 0) {
      const delta = difficulty === 'standard' ? -4 : 4;
      const scaled = sets.map((s) => {
        const curLvl = s.level || 100;
        // Keep Little Cup small delta (-1 / +1)
        const adjustedDelta = curLvl <= 10 ? (difficulty === 'standard' ? -1 : 1) : delta;
        return {
          ...s,
          level: Math.max(1, curLvl + adjustedDelta),
        };
      });
      rivalPaste = Teams.export(scaled).trim();
    }
  }

  // Scale NPC AI personality directives according to difficulty
  const basePers: NpcAiPersonality = baseConfig.npcPersonality ?? npc.personality;
  const scaledPersonality: NpcAiPersonality = {
    ...basePers,
    aggression: Math.max(
      0.1,
      Math.min(
        1,
        basePers.aggression +
          (difficulty === 'nightmare' ? 0.14 : difficulty === 'standard' ? -0.14 : 0)
      )
    ),
    disruptionBias: Math.max(
      0.1,
      Math.min(
        1,
        basePers.disruptionBias +
          (difficulty === 'nightmare' ? 0.12 : difficulty === 'standard' ? -0.15 : 0)
      )
    ),
    protectBias: Math.max(
      0.05,
      Math.min(
        1,
        basePers.protectBias +
          (difficulty === 'nightmare' ? 0.1 : difficulty === 'standard' ? -0.1 : 0)
      )
    ),
  };

  return {
    ...baseConfig,
    rivalShowdownPaste: rivalPaste,
    reserveAsLastAceSpecies:
      chosenVariant?.reserveAsLastAceSpecies ?? baseConfig.reserveAsLastAceSpecies,
    rivalProfile: buildRivalProfileFromNpc(
      baseConfig.rivalCharId,
      baseConfig.rivalProfile
    ),
    npcPersonality: scaledPersonality,
    npcDialogues: baseConfig.npcDialogues ?? npc.dialogues,
    difficultyMode: difficulty,
    selectedVariantId: chosenVariant?.id ?? 'canonical',
    selectedVariantLabel: chosenVariant?.label,
  };
}
