VAR selected_player = "luca"
VAR rival_plan = "game1"

-> archivo_real

=== archivo_real ===
Las paredes oscuras de la Sala de Simulación se disuelven en luz azul hasta reconstruir el rugido lejano de Honolulu. Miles de espectadores holográficos rodean la plataforma central donde dos sillas aguardan frente a frente. # bg: vgc-worlds-stage # speaker: Narrador # char: champion # side: right # pokemon: none # mood: confident
«Si quieres entender cómo se respira cuando el mundo entero te mira, Alteza, estudia esta final.» La Campeona se detiene junto al proyector. «Luca Ceribelli contra Yuta Ishigaki. Reglas oficiales de torneo: hojas abiertas, cuatro elegidos de seis y ni un segundo de margen para el titubeo.» # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: confident
«Antes de encender el reloj del estadio, dime: ¿desde qué silla quieres vivir esta final?» # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: serious

* [Tomar el lugar de Luca Ceribelli — La tormenta eléctrica de Italia]
    ~ selected_player = "luca"
    «Buena elección. Siente el pulso de la final desde el lado de Miraidon y decide cómo responder ante la muralla japonesa.» # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: miraidon # mood: confident
    -> elegir_plan_yuta
* [Tomar el lugar de Yuta Ishigaki — El frío implacable de Japón]
    ~ selected_player = "yuta"
    «Un reto digno. Toma el mando de Calyrex y mide cada turno contra la velocidad desbordada del campeón.» # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: calyrexice # mood: confident
    -> elegir_plan_luca

=== elegir_plan_yuta ===
«El archivo conserva los dos enfrentamientos de aquella serie. ¿Contra cuál de los dos planteamientos de Yuta quieres medirte?» # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: serious

* [Revivir el Juego 1 de la Final]
    ~ rival_plan = "game1"
    «Juego 1 en marcha. El reloj corre y el estadio espera el primer movimiento.» # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: confident
    -> cierre_vgc
* [Revivir el Juego 2 de la Final]
    ~ rival_plan = "game2"
    «Juego 2 cargado. Aquí las respuestas se vuelven aún más estrechas.» # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: serious
    -> cierre_vgc

=== elegir_plan_luca ===
«El archivo conserva ambas lecturas de Luca durante la serie. ¿Cuál prefieres enfrentar?» # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: none # mood: serious

* [Revivir el Juego 1 de la Final]
    ~ rival_plan = "game1"
    «Juego 1 en marcha. Demuestra si puedes frenar el vendaval antes de que cierre el estadio.» # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: none # mood: confident
    -> cierre_vgc
* [Revivir el Juego 2 de la Final]
    ~ rival_plan = "game2"
    «Juego 2 cargado. Un solo paso en falso decide el campeonato.» # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: none # mood: serious
    -> cierre_vgc

=== cierre_vgc ===
Las luces del escenario bajan sobre las dos sillas holográficas. El rugido de Honolulu estalla cuando aparece la pantalla de selección de equipo. # bg: vgc-worlds-stage # speaker: Narrador # char: prince # side: left # pokemon: none # mood: confident
-> END
