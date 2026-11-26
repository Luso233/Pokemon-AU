VAR chase_route = "main_alley"
VAR sabotage_plan = "no_trap"
VAR prince_prep = "palace_standard"
VAR mind_game = "cold_silence"

-> persecucion_inicio

=== persecucion_inicio ===
Lluvia helada sobre los callejones traseros de Wyndon. Las sirenas del palacio quedaron atrás hace diez minutos. # bg: wyndon-alleys # speaker: Narrador # pokemon: none # mood: tense
Tu capa azul real está rasgada y manchada de barro. Solo llevas contigo tu Equipo de Vida Diaria: Arcanine, Gardevoir, Milotic, Corviknight, Sylveon y Rotom. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: tense
"Maldición... si hubiera alcanzado el maletín de Zacian antes de salir del salón... Arcanine, ¿lo sientes cerca?" # bg: wyndon-alleys # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: tense
Arcanine gruñe hacia las sombras del callejón. Un destello metálico corta la niebla a treinta metros detrás de ti. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: tense
Pasos pausados resuenan sobre el adoquín mojado. Una figura de cabello carmesí y armadura oscura emerge de entre el vapor, haciendo girar una Poké Ball marcada en rojo sangre. # bg: wyndon-alleys # speaker: Narrador # char: assassin # side: right # pokemon: grafaiai # mood: ominous
"No corras tan rápido, Alteza. Estudié cada registro del Servicio Secreto durante seis meses. Sé exactamente qué seis Pokémon llevas encima esta noche." # bg: wyndon-alleys # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: grafaiai # mood: smug
"Intimidación, pantallas de Gardevoir, Recuperación de Milotic, Vozarrón de Sylveon... Traje un equipo diseñado pieza por pieza para anular tu escolta de niño rico." # bg: wyndon-alleys # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: kingambit # mood: smug
Gardevoir te transmite un escalofrío telepático: no está mintiendo. Si peleas en sus términos sin ventaja, su equipo es un counter quirúrgico contra el tuyo. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious
El callejón se bifurca en tres direcciones antes de la Torre del Reloj. Solo tienes segundos para decidir tu ruta de escape. # bg: wyndon-alleys # speaker: Príncipe Heredero # char: prince # side: left # pokemon: corviknight # mood: serious

* [Subir por los tejados con Corviknight para observarlo desde arriba (Ventaja: +Inteligencia 4/6 y rompe su lead Grafaiai+Kingambit)]
    ~ chase_route = "rooftops"
    -> ruta_tejados
* [Bajar a los acueductos inundados con Milotic y Rotom (Ventaja: Milotic+Rotom lideran para evitar el Defiant de Kingambit + 3/6 especies)]
    ~ chase_route = "aqueducts"
    -> ruta_acueductos
* [Correr directo hacia la plaza sin mirar atrás (Sin ventaja: te acorrala de frente con su lead counter perfecto, solo 2/6 especies)]
    ~ chase_route = "main_alley"
    -> ruta_callejon

=== ruta_tejados ===
Corviknight extiende sus alas metálicas y te eleva silenciosamente sobre las cornisas mojadas de Wyndon. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: corviknight # mood: confident
Desde las alturas ves al Asesino desplegar exploradores para rastrearte: identificas cuatro de sus seis especies y logras obligarlo a enviar primero a su retaguardia pesada en vez de su dupla de apertura. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: heatran # mood: serious
"Buen ojo desde los tejados, Príncipe... pero tarde o temprano tendrás que bajar al suelo." # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: heatran # mood: smug
-> decision_sabotaje

=== ruta_acueductos ===
Saltas por la rejilla hacia los viejos acueductos reales. El agua hasta los tobillos ahoga tus pasos mientras Rotom ilumina el túnel con chispas azules. # bg: aqueduct-tunnels # speaker: Narrador # char: prince # side: left # pokemon: rotom # mood: serious
"Aquí Arcanine perdería terreno... Milotic, Rotom, ustedes abrirán al frente. Si ese asesino trae algo que castigue Intimidación, no le daremos el gusto en el turno uno." # bg: aqueduct-tunnels # speaker: Príncipe Heredero # char: prince # side: left # pokemon: milotic # mood: confident
En el eco del túnel alcanzas a distinguir tres siluetas en su cinturón antes de que corte la salida del puente. # bg: aqueduct-tunnels # speaker: Narrador # char: assassin # side: right # pokemon: rillaboom # mood: tense
-> decision_sabotaje

=== ruta_callejon ===
Aprietas los dientes y esprintas a toda velocidad por el callejón principal. Tus botas salpican agua contra los faroles rotos. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: tense
El Asesino te corta el paso aterrizando desde un balcón con una sonrisa helada. No lograste ver más que sus dos líderes iniciales. # bg: wyndon-alleys # speaker: Narrador # char: assassin # side: right # pokemon: grafaiai # mood: smug
"Predecible. Directo a la boca del lobo." # bg: wyndon-alleys # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: kingambit # mood: smug
-> decision_sabotaje

=== decision_sabotaje ===
Mientras cruzas el patio interior rumbo a las ruinas de la Torre del Reloj, divisas viejas válvulas de vapor y andamios inestables. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: rotom # mood: serious
Rotom crepita en tu hombro señalando las cajas de suministro del mercenario: podrías tenderle una trampa antes del enfrentamiento final para dañar su equipo. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: rotom # mood: serious

* [Sobrecargar las válvulas de vapor con Rotom (Sabotea objetos: Grafaiai pierde Focus Sash y Gholdengo pierde Life Orb)]
    ~ sabotage_plan = "vapor_trap"
    Rotom posee el panel de presión y libera un chorro de vapor abrasador justo cuando el Asesino cruza el arco. Dos de sus cápsulas de objetos estallan en chispas. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: gholdengo # mood: angry
    "¡Tsk! Mis objetos de precisión... Buen truco para un niño de palacio." # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: gholdengo # mood: angry
    -> decision_preparacion
* [Derrumbar el andamio sobre su vanguardia física (Sabotea ataque: Kingambit pierde Black Glasses y Brick Break; Rillaboom pierde Miracle Seed)]
    ~ sabotage_plan = "rubble_decoy"
    Arcanine embiste los soportes del andamio. La caída fuerza a Kingambit y Rillaboom a absorber el impacto, destrozando su equipo ofensivo y agotando la técnica rompepantallas de Kingambit. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: kingambit # mood: angry
    "Así que sabes morder cuando te acorralan... Esto se pone interesante." # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: rillaboom # mood: serious
    -> decision_preparacion
* [No perder tiempo en trampas y conservar el aliento (Reto Puro: el Asesino llega con su equipo counter 100% intacto y Ace Nv. 103)]
    ~ sabotage_plan = "no_trap"
    Decides no arriesgar a tus Pokémon en escaramuzas previas. El Asesino llega intacto, con cada objeto y movimiento counter listo para ejecutarte. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: kingambit # mood: smug
    -> decision_preparacion

=== decision_preparacion ===
Finalmente quedas sin salida: el patio circular de la Torre del Reloj. La lluvia golpea las piedras antiguas mientras tomas tus seis Poké Balls. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious
"Si diseñó su equipo contra mis sets habituales de palacio, tengo un minuto para cambiar nuestras órdenes tácticas antes de que entre al círculo." # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: serious

* [Protocolo Anti-Mofa y Cobertura (Gardevoir lleva Mental Herb para burlar el Taunt Turno 1 + Arcanine usa Close Combat + Sylveon lleva Mystical Fire)]
    ~ prince_prep = "anti_taunt"
    Le entregas una Hierba Mental de emergencia a Gardevoir y das la señal ofensiva a Arcanine y Sylveon. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: sylveon # mood: confident
    "Que intente silenciar nuestras pantallas en el primer turno. Se llevará una sorpresa." # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: confident
    -> decision_psicologica
* [Reconfiguración Rompe-Acero (Arcanine con Close Combat, Gardevoir con Mystical Fire y Rotom con Shadow Ball)]
    ~ prince_prep = "anti_steel"
    Ajustas el rol de tus Pokémon hacia daño directo contra Acero y Fantasma. Menos soporte pasivo, más colmillo. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: fierce
    "Si espera que solo me defienda, voy a partirle la guardia." # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: fierce
    -> decision_psicologica
* [Mantener los sets exactos de palacio (Sin cambios: juegas con tus 6 sets base originales)]
    ~ prince_prep = "palace_standard"
    "Confío en el entrenamiento que me dio mi padre. Ganaremos con el equipo tal como está." # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: calm
    -> decision_psicologica

=== decision_psicologica ===
El Asesino Carmesí cruza el arco de piedra. Su capa negra ondea mientras saca dos Poké Balls al mismo tiempo. Combate Doble 2v2 a muerte. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: grafaiai # mood: ominous
"Se acabó la carrera, chico dorado. Nadie vendrá a salvarte aquí. Entrégame el sello real o tus mascotas pagarán el precio." # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: grafaiai # mood: smug
Lo observas a los ojos. Sabes que incluso el mejor estratega cae en hábitos predecibles si logras meterte en su cabeza... # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious

* [Provocar su orgullo: "¿Seis counters contra un equipo civil y aun así necesitas trucos sucios?"]
    ~ mind_game = "provoke"
    Su mandíbula se tensa bajo la cicatriz. Su orgullo herido lo volverá impulsivo: telegrafiará Mofa/Golpe Bajo y podrás engañar su IA. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: kingambit # mood: angry
    "¡Cierra la boca! ¡Voy a cerrar tu boca y tus pantallas desde el primer segundo!" # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: kingambit # mood: angry
    -> cierre_combate
* [Fingir pánico y retroceder un paso para atraerlo a una jugada codiciosa]
    ~ mind_game = "feign_panic"
    El Asesino sonríe creyéndote acorralado. En el primer turno irá codiciosamente a por tu Slot 1 con presión directa — un blanco perfecto para Protección o cambios a Rotom. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: rillaboom # mood: smug
    "Ahí está el miedo que quería ver. ¡Acaben primero con su guardaespaldas!" # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: rillaboom # mood: smug
    -> cierre_combate
* [Guardar silencio absoluto y alzar tus dos Poké Balls (IA Fría: el Asesino ejecuta su guion táctico óptimo sin bajar la guardia)]
    ~ mind_game = "cold_silence"
    El Asesino asiente con respeto helado. No cometerá errores emocionales: leerá tus pantallas y castigará cada descuido. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: grafaiai # mood: serious
    "Interesante... al menos tienes agallas. Veamos si sobrevives al primer turno." # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: grafaiai # mood: serious
    -> cierre_combate

=== cierre_combate ===
El relámpago ilumina el patio de la Torre del Reloj. El árbol de decisiones ha compilado ambos equipos 6v6 en formato Showdown y cargado el guion táctico del Asesino. # bg: clocktower-ruins # speaker: Sistema Táctico # char: prince # side: left # pokemon: none # mood: serious
-> END
