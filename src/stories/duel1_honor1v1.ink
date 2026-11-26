VAR rival_read = "ironcrown"

-> salon_duelo

=== salon_duelo ===
Las puertas de la Sala de Juicio por Combate se cierran tras de ti. El protocolo aristocrático de Galar es absoluto: formato 1v1 a muerte súbita. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: gallade # mood: serious
Ambos contendientes muestran tres Pokémon en el Team Preview, pero solo pueden enviar UNO al círculo. No existen cambios ni segundas oportunidades. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: metagross # mood: serious
Tu adversario, el Duelista Carmesí de la nobleza rival, exhibe tres Poké Balls de élite: Iron Crown, Skeledirge y Urshifu. # bg: honor-duel-hall # speaker: Narrador # char: assassin # side: right # pokemon: ironcrown # mood: smug
"Tres Pokémon, una sola elección, Alteza. Piedra, papel o tijera a vida o muerte. Si lees mal el Team Preview, caerás en el primer turno." # bg: honor-duel-hall # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: urshifu # mood: smug
Observas el movimiento sutil de sus dedos sobre su cinturón antes de que suene la campana. ¿Qué detalle decides vigilar? # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: primarina # mood: serious

* [Vigilar la cápsula de Energía Potenciadora (Pista: abrirá con Iron Crown — vulnerabilidad a Metagross Weakness Policy)]
    ~ rival_read = "ironcrown"
    Un destello metálico delata su mano derecha: está a punto de elegir a Iron Crown con Booster Energy. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: metagross # mood: confident
    "Bien. Si saca a Iron Crown, Metagross con Seguro Debilidad puede darle la vuelta al duelo." # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: metagross # mood: confident
    -> cierre_1v1
* [Escuchar el eco de su Spray Bucal (Pista: abrirá con Skeledirge Unaware — vulnerabilidad a Primarina Choice Specs)]
    ~ rival_read = "skeledirge"
    Detectas la postura defensiva de su flanco central: apostará por el aguante de Skeledirge con Ignorante y Canto Ardiente. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: primarina # mood: confident
    "Skeledirge... Primarina con Gafas Elegidas e Hidrocañón lo borrará del mapa." # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: primarina # mood: confident
    -> cierre_1v1
* [Observar su postura agresiva de Cinta Elegida (Pista: abrirá con Urshifu Golpe Brusco — vulnerabilidad a Gallade o Primarina)]
    ~ rival_read = "urshifu"
    Inclina el hombro hacia delante: irá a matar de un solo golpe con Urshifu Cinta Elegida y Golpe Oscuro. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: gallade # mood: confident
    "Fuerza bruta sin rodeos. Gallade con Cortante o Primarina pueden castigar esa codicia." # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gallade # mood: confident
    -> cierre_1v1

=== cierre_1v1 ===
La campana resuena en la sala. Formato oficial gen91v1 inicializado: elige 1 de tus 3 Pokémon en el Team Preview interactivo. # bg: honor-duel-hall # speaker: Sistema Táctico # char: prince # side: left # pokemon: none # mood: serious
-> END
