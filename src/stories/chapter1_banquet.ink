VAR team_mode = "daily"
VAR mixed_role = "physical"
VAR assassin_plan = "sabotage"

-> salon

=== salon ===
Las lámparas de cristal del Salón de Estado parpadean dos veces, sueltan un chasquido seco y dejan el banquete sumido en penumbra. El tintineo de copas rotas se mezcla con los gritos de los enviados diplomáticos buscando las salidas. # bg: banquet-hall # speaker: Narrador # mood: tense
Un humo violeta y acre se derrama desde las rejillas de ventilación, borrando las mesas largas hasta dejar solo sombras. Algo se arrastra rápido entre los candelabros caídos, acompañado por una risita aguda y nerviosa. # bg: banquet-hall # speaker: Narrador # mood: tense
De la bruma sale un sujeto encorvado de sonrisa torcida, medallas robadas en la solapa, ballesta en la mano y una máscara de Zoroark sobre una melena despeinada. Su cola de rata roza la alfombra mientras hace girar una Poké Ball llena de grietas. # bg: banquet-hall # speaker: Narrador # char: rat_saboteur # side: right # pokemon: none # mood: serious
«¡Jejeje! ¿Esperabas a un caballero elegante, Alteza? Qué pena. Aquí abajo no usamos reglas de liga, ni límites decentes, ni peleas justas. Esta noche vas a conocer lo que duele un truco sucio de verdad.» # bg: banquet-hall # speaker: El Hombre Rata # char: rat_saboteur # side: right # pokemon: none # mood: smug
Tu comunicador vibra contra tu muñeca: el cierre blindado sella las compuertas del salón en dos segundos. Todavía alcanzas a pedir el enlace con la armería real... o responder con lo que ya llevas encima. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # mood: serious

* [Mantener la compostura y resistir con tu escolta habitual de palacio]
    ~ team_mode = "daily"
    «No voy a destruir el salón delante de los embajadores por una rata de cloaca. Arcanine, Gardevoir, cubran el frente.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: fierce
    -> elegir_set_mixto
* [Activar el Código Corona y pedir el enlace inmediato a la armería real]
    ~ team_mode = "combat"
    «Gardevoir, abre el enlace al maletín de guerra ahora mismo. Si trajo trucos sin reglas a nuestra mesa, los vamos a barrer de raíz.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: zacian-crowned # mood: fierce
    -> elegir_set_mixto

=== elegir_set_mixto ===
{ team_mode == "combat": El aire crepita y Dragapult se desliza bajo el techo abovedado esperando tu primera seña. Su postura puede volcarse al impacto directo o a desgarrar la distancia desde las sombras. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # pokemon: dragapult # mood: serious }
{ team_mode == "daily": Arcanine planta las patas frente a ti entre el humo, midiendo la distancia hacia el intruso. Puede lanzarse al choque directo o barrer el salón con oleadas de calor desde atrás. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious }

* [Cerrar la distancia con presión directa]
    ~ mixed_role = "physical"
    «No le demos aire para montar su circo. Golpeemos de frente antes de que se esconda entre el humo.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # mood: confident
    -> confrontacion_politica
* [Mantener espacio y castigar a distancia]
    ~ mixed_role = "special"
    «Cuidado con morder sus anzuelos de cerca. Mantengan la distancia y limpien el salón desde lejos.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # mood: confident
    -> confrontacion_politica

=== confrontacion_politica ===
El Hombre Rata se rasca debajo de la máscara con los dedos llenos de anillos robados y acaricia las cuchillas de su cinturón. # bg: banquet-hall # speaker: El Hombre Rata # char: rat_saboteur # side: right # pokemon: none # mood: smug
«¿Sabes qué es lo más divertido de pelear contra sangre azul? Que traen cañones gigantes, pero se vuelven locos adivinando cuál silueta es real y cuál es uno de mis dos zorros Nv. 130... justo antes de comerse una Cinta Elegida con Truco y quedar encerrados con Sombra Trampa.» # bg: banquet-hall # speaker: El Hombre Rata # char: rat_saboteur # side: right # pokemon: none # mood: smug

* [Guardar silencio y observar cada movimiento de sus manos]
    ~ assassin_plan = "sabotage"
    El intruso suelta una risotada chillona, encantado con tu cautela, y prepara sus trampas más desesperantes del costado derecho. # bg: banquet-hall # speaker: Narrador # char: rat_saboteur # side: right # pokemon: none # mood: tense
    -> fin_escena
* [Lanzar al aire los nombres de quienes le pagaron para colarse al palacio]
    ~ assassin_plan = "mirror"
    Sus orejas se tensan de golpe y su sonrisa se agrieta. Arroja una daga al suelo y saca otra cápsula manchada de la parte trasera del cinturón. «Hablas de más, principito... entonces vas a pelear contra tus propios reflejos y pesadillas.» # bg: banquet-hall # speaker: El Hombre Rata # char: rat_saboteur # side: right # pokemon: none # mood: angry
    -> fin_escena

=== fin_escena ===
Las puertas blindadas caen con un golpe metálico que hace temblar la vajilla. El Hombre Rata suelta una carcajada entre el humo violeta mientras arroja sus dos primeras cápsulas. # bg: banquet-hall # speaker: Narrador # char: rat_saboteur # side: right # mood: serious
-> END
