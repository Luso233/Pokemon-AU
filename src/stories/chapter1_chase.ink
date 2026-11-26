VAR chase_route = "main_alley"
VAR sabotage_plan = "no_trap"
VAR prince_prep = "palace_standard"
VAR mind_game = "cold_silence"

-> persecucion_inicio

=== persecucion_inicio ===
La lluvia azota los callejones traseros de Wyndon como agujas heladas. Las sirenas del palacio se apagan poco a poco detrás de los tejados de pizarra, ahogadas por el ruido del agua cayendo por las canaletas. # bg: wyndon-alleys # speaker: Narrador # pokemon: none # mood: tense
Tu capa azul real pesa el doble de lo normal, empapada y salpicada de barro hasta los hombros. Al salir por la puerta de servicio no alcanzaste la armería: en tu cinturón solo descansan los seis compañeros de tu rutina diaria. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: tense
«Maldita sea... si tan solo hubiera llegado al salón de armas antes de que cortaran las luces.» Apoyas la mano en el lomo húmedo de Arcanine. «¿Todavía nos sigue?» # bg: wyndon-alleys # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: tense
Arcanine no ladra; solo deja escapar un gruñido bajo que te vibra en la palma. A treinta metros, entre el vapor de las alcantarillas, el reflejo de un farol roto corta una silueta quieta. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: tense
Los pasos llegan sin prisa, marcando un compás seco sobre los adoquines. Un hombre de cabello carmesí y abrigo oscuro sale de la neblina haciendo girar entre los dedos una Poké Ball sin insignia. # bg: wyndon-alleys # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: ominous
«No hace falta correr tanto, Alteza. El suelo está resbaloso y la noche es larga.» Su voz suena demasiado tranquila para una persecución. «Pasé seis meses revisando tus horarios de palacio, tus paseos, tus entrenamientos en el patio... Sé quién camina contigo cuando no esperas una guerra.» # bg: wyndon-alleys # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: smug
Gardevoir roza tu mente con una punzada fría. No está fanfarroneando: cada gesto de ese hombre tiene la calma de alguien que ya ensayó este encuentro docenas de veces. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious
Frente a ti el callejón se abre en tres direcciones antes de la vieja Torre del Reloj. El agua corre a tus pies y el cazador apenas afloja el paso. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: corviknight # mood: serious

* [Ganar altura por los tejados con Corviknight para no perderlo de vista]
    ~ chase_route = "rooftops"
    -> ruta_tejados
* [Bajar por la rejilla hacia los acueductos inundados junto a Milotic y Rotom]
    ~ chase_route = "aqueducts"
    -> ruta_acueductos
* [Apretar el paso de frente por el callejón principal rumbo a la plaza]
    ~ chase_route = "main_alley"
    -> ruta_callejon

=== ruta_tejados ===
Corviknight despliega las alas de acero con un chasquido seco y te arranca del suelo mojado antes de que el mercenario alcance la esquina. El viento de altura corta la lluvia en ráfagas heladas. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: corviknight # mood: confident
Desde las cornisas ves moverse su sombra entre los patios inferiores. Sin darse cuenta de tu posición exacta, suelta varias siluetas oscuras para rastrear los accesos altos; el desvío lo obliga a reorganizar su paso antes de llegar a la torre. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: serious
«Buen truco, Príncipe...» Su mirada sube por fin hacia el borde del tejado, sin perder la sonrisa. «Pero allá arriba no hay salida. Tarde o temprano vas a tener que tocar piedra.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: smug
-> decision_sabotaje

=== ruta_acueductos ===
Levantas la rejilla oxidada y te dejas caer hacia los antiguos canales subterráneos de Wyndon. El agua helada te golpea hasta los tobillos mientras Rotom tiñe las paredes de piedra con un resplandor azul nervioso. # bg: aqueduct-tunnels # speaker: Narrador # char: prince # side: left # pokemon: rotom # mood: serious
«Aquí el fuego nos estorbaría más de lo que ayuda... Milotic, Rotom, quédense al frente conmigo.» El eco devuelve el murmullo de pasos apresurados por el puente superior; a través de la bruma alcanzas a distinguir parte de las cápsulas que el mercenario prepara en su cinturón. # bg: aqueduct-tunnels # speaker: Príncipe Heredero # char: prince # side: left # pokemon: milotic # mood: confident
Al salir por la compuerta vieja, el cazador ya te espera bajo el arco empapado, sacudiéndose el agua de la manga. # bg: aqueduct-tunnels # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: tense
-> decision_sabotaje

=== ruta_callejon ===
Decides no regalarle tiempo rodeando y corres de frente por la avenida angosta. Tus botas levantan chispas de agua turbia contra los muros cerrados mientras los latidos te golpean los oídos. # bg: wyndon-alleys # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: tense
Apenas doblas hacia la plaza, una sombra cae desde un balcón y bloquea el paso con un golpe sordo. El mercenario se endereza despacio, con el cinturón intacto y la respiración perfectamente medida. # bg: wyndon-alleys # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: smug
«Predecible. Directo al único lugar donde no tienes espacio para maniobrar.» # bg: wyndon-alleys # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: smug
-> decision_sabotaje

=== decision_sabotaje ===
El camino desemboca en un patio de servicio abandonado junto a la Torre del Reloj. Viejas tuberías de caldera silban bajo presión a tu izquierda, y un andamio carcomido por el óxido cruje sobre el arco de entrada. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: rotom # mood: serious
Rotom chispea inquieto mirando los manómetros y luego las cajas de equipo que el mercenario dejó listas cerca del umbral. Todavía hay unos segundos antes de que cruce el arco. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: rotom # mood: serious

* [Dejar que Rotom sobrecargue las válvulas de vapor justo cuando cruce el umbral]
    ~ sabotage_plan = "vapor_trap"
    Rotom se funde con el tablero oxidado. Cuando la silueta carmesí atraviesa el arco, un chorro blanco y ardiente estalla a media altura; el mercenario se cubre el rostro mientras el estuche metálico de su costado chilla y suelta chispas. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: angry
    «Tsk...» Se sacude el abrigo humeante y arroja dos cápsulas carbonizadas al charco. «Nada mal para alguien que creció entre alfombras.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: angry
    -> decision_preparacion
* [Ordenar a Arcanine que embista los soportes del andamio sobre el pasaje]
    ~ sabotage_plan = "rubble_decoy"
    Arcanine arranca con un rugido y golpea la base podrida de madera. La estructura entera se desploma entre hierro y tablones justo delante del cazador; dos sombras pesadas emergen de sus cápsulas para frenar el derrumbe a fuerza bruta antes de que lo aplaste. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: angry
    El polvo húmedo se asienta sobre el patio. El mercenario observa los restos quebrados con los ojos entrecerrados. «Así que sabes morder cuando te acorralan... Esto se pone interesante.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: serious
    -> decision_preparacion
* [No gastar fuerzas en escaramuzas y asegurar posición en el centro del patio]
    ~ sabotage_plan = "no_trap"
    Dejas intactos los tubos y el andamio. Si vas a salir vivo de aquí, prefieres hacerlo con tu equipo entero y sin darle excusas para alargar la cacería. El mercenario cruza el arco sin un solo rasguño. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: smug
    -> decision_preparacion

=== decision_preparacion ===
El patio circular de la Torre del Reloj no tiene otra salida. La lluvia rebota contra las losas agrietadas mientras sostienes tus seis Poké Balls. Un minuto escaso te separa del choque. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: serious
«Si estudió cómo entrenamos en palacio, espera que pelea exactamente igual que siempre.» Observas a tus compañeros bajo el aguacero. «Podemos cambiar el ritmo antes de que empiece.» # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: serious

* [Improvisar medidas de emergencia para proteger tu guardia y cubrir ángulos cerrados]
    ~ prince_prep = "anti_taunt"
    Rebuscas en el forro de tu capa y le entregas a Gardevoir una hierba seca de reserva, mientras le marcas con un gesto breve un cambio de postura a Arcanine y Sylveon. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: sylveon # mood: confident
    «Que intente silenciarnos desde el primer instante. No vamos a regalarle el ritmo.» # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: confident
    -> decision_psicologica
* [Abandonar la postura defensiva de escolta y preparar a tu equipo para romper armaduras]
    ~ prince_prep = "anti_steel"
    Intercambias miradas cortas con Arcanine, Gardevoir y Rotom. Nada de esperar tras muros corteses esta noche: si intenta cerrarte el paso con peso bruto, responderás con colmillo directo. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: fierce
    «Si viene esperando a un príncipe que solo se defiende, se va a equivocar de noche.» # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: fierce
    -> decision_psicologica
* [Confiar en el entrenamiento exacto de palacio sin tocar un solo hábito]
    ~ prince_prep = "palace_standard"
    Respiras hondo y cierras la mano sobre las Poké Balls. «No voy a improvisar en medio de una tormenta. Ganaremos siendo exactamente quienes somos.» # bg: clocktower-ruins # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: calm
    -> decision_psicologica

=== decision_psicologica ===
El Asesino Carmesí entra por fin en el círculo de piedra. La lluvia resbala por el borde de su abrigo mientras desenfunda dos Poké Balls a la vez, una en cada palma. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: ominous
«Se acabó la carrera, Alteza. Nadie de la guardia llegará a tiempo hasta la torre. Entrégame el sello real o deja que tus acompañantes paguen tu terquedad.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: smug
Lo miras directo a los ojos a través de la cortina de agua. Incluso los profesionales más metódicos tienen grietas debajo de la máscara. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious

* [Herir su orgullo: «Seis meses planeando una emboscada contra un equipo de paseo... qué oficio tan pequeño.»]
    ~ mind_game = "provoke"
    Un músculo se tensa bajo la cicatriz de su mejilla. La sonrisa profesional desaparece por un segundo y sus dedos aprietan las Poké Balls con demasiada fuerza. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: angry
    «Cuida esa lengua, niño. Voy a cerrarte la boca desde el primer segundo.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: angry
    -> cierre_combate
* [Dar un paso vacilante hacia atrás y fingir que el miedo te gana]
    ~ mind_game = "feign_panic"
    Bajas apenas los hombros y miras el muro cerrado detrás de ti. La boca del cazador se curva con una satisfacción ansiosa; inclina el cuerpo hacia adelante, convencido de que ya tiene la presa vencida. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: smug
    «Ahí está el temblor que esperaba ver. Vamos a terminar esto rápido.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: smug
    -> cierre_combate
* [No decir una palabra y alzar tus dos Poké Balls bajo la tormenta]
    ~ mind_game = "cold_silence"
    El silencio entre ambos solo se rompe con el golpe de la lluvia sobre la piedra. El cazador asiente despacio, con una cortesía helada, y adopta su postura más cerrada. # bg: clocktower-ruins # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: serious
    «Bien. Al menos no suplicas. Veamos cuánto aguantas de pie.» # bg: clocktower-ruins # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: none # mood: serious
    -> cierre_combate

=== cierre_combate ===
Un relámpago parte el cielo sobre las agujas de la Torre del Reloj. Las Poké Balls se abren al mismo tiempo entre el agua y el barro. # bg: clocktower-ruins # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious
-> END
