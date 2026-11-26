VAR rival_read = "ironcrown"

-> salon_duelo

=== salon_duelo ===
Las puertas de roble de la Sala de Juicio se cierran con un eco largo que recorre el mármol. El protocolo de la corte es antiguo y seco: tres Poké Balls sobre el terciopelo, pero solo una tocará la arena. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: gallade # mood: serious
Sin relevos, sin banca, sin segundas oportunidades. Cuando suene la campana, el primero que caiga pierde el reclamo ante el consejo. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: metagross # mood: serious
Frente a ti, el Duelista de la Corte acomoda sus tres cápsulas con precisión ensayada y levanta la barbilla con serenidad aristocrática. # bg: honor-duel-hall # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: smug
«Tres cartas sobre la mesa, Alteza, y una sola jugada. Si parpadeas antes de la campana, el juicio habrá terminado antes del segundo respiro.» # bg: honor-duel-hall # speaker: Duelista de la Corte # char: assassin # side: right # pokemon: none # mood: smug
Apenas quedan unos segundos de silencio. Sus dedos rozan apenas el borde del cinturón, traicionando una mínima preferencia en su postura. ¿En qué gesto decides fijar tu atención? # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: primarina # mood: serious

* [Observar el brillo frío que oculta cerca de su mano derecha]
    ~ rival_read = "ironcrown"
    Un reflejo metálico casi imperceptible se escapa entre sus dedos enguantados; no busca aguantar, sino acelerar el pulso desde el primer segundo. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: metagross # mood: confident
    «Entiendo... apuesta por la frialdad del metal.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: metagross # mood: confident
    -> cierre_1v1
* [Escuchar la calma pesada de su respiración al centro del círculo]
    ~ rival_read = "skeledirge"
    Su peso descansa sobre los talones, sin prisa alguna; la postura de alguien que planea quedarse quieto y ver cómo te desgastas contra su muro. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: primarina # mood: confident
    «Quiere que nos desesperemos contra su resistencia. No le daremos ese gusto.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: primarina # mood: confident
    -> cierre_1v1
* [Vigilar la inclinación tensa de su hombro izquierdo hacia adelante]
    ~ rival_read = "urshifu"
    Aprieta la mandíbula y apoya el peso en la punta de los pies, listo para lanzarse de cabeza a romper cualquier defensa de un solo golpe seco. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: gallade # mood: confident
    «Fuerza bruta sin rodeos... si acierta el primer golpe, se acaba.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gallade # mood: confident
    -> cierre_1v1

=== cierre_1v1 ===
La campana de bronce resuena en la bóveda. Ambos contendientes toman su decisión final con la vista fija en el contrario. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious
-> END
