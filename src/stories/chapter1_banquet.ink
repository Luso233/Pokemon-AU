VAR team_mode = "daily"
VAR mixed_role = "physical"
VAR assassin_plan = "sabotage"

-> salon

=== salon ===
Las lámparas de cristal del Salón de Estado parpadean dos veces, sueltan un chasquido seco y dejan el banquete sumido en penumbra. El tintineo de copas rotas se mezcla con los gritos de los enviados diplomáticos buscando las salidas. # bg: banquet-hall # speaker: Narrador # mood: tense
Un humo violeta y espeso se derrama desde las rejillas superiores, envolviendo las mesas largas hasta borrar las esquinas del salón. # bg: banquet-hall # speaker: Narrador # mood: tense
A través de la bruma avanza un hombre de guantes raídos y máscara lisa. No lleva insignias ni protocolo; en su mano descansan dos Poké Balls gastadas por mil peleas callejeras. # bg: banquet-hall # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: serious
«Órdenes simples, Alteza. Sin guardias, sin rescates, sin cortesías de salón. Esta cena termina aquí.» # bg: banquet-hall # speaker: Sicario de la Corte # char: assassin # side: right # pokemon: none # mood: smug
Tu comunicador vibra contra tu muñeca: el protocolo de cierre blindado sella las compuertas en dos segundos. Todavía alcanzas a mandar una señal a palacio... o responder con lo que ya llevas encima. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # mood: serious

* [Mantener la compostura y resistir con tu escolta habitual de palacio]
    ~ team_mode = "daily"
    «No voy a convertir una cena de Estado en un campo de guerra delante de embajadores. Arcanine, Gardevoir, cubran el frente.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: fierce
    -> elegir_set_mixto
* [Activar el Código Corona y pedir el enlace inmediato a la armería real]
    ~ team_mode = "combat"
    «Gardevoir, abre el enlace al maletín de guerra ahora mismo. Si vinieron a probar el filo de la Corona, que lo conozcan completo.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: zacian-crowned # mood: fierce
    -> elegir_set_mixto

=== elegir_set_mixto ===
{ team_mode == "combat": El aire crepita y Dragapult se desliza bajo el techo abovedado esperando tu primera seña. Su postura puede volcarse al impacto directo o a desgarrar la distancia desde las sombras. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # pokemon: dragapult # mood: serious }
{ team_mode == "daily": Arcanine planta las patas frente a ti entre el humo, midiendo la distancia hacia el intruso. Puede lanzarse al choque directo o barrer el salón con oleadas de calor desde atrás. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious }

* [Cerrar la distancia con presión directa]
    ~ mixed_role = "physical"
    «No le demos aire para pensar. Golpeemos de frente antes de que se acomode en la oscuridad.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # mood: confident
    -> confrontacion_politica
* [Mantener espacio y castigar a distancia]
    ~ mixed_role = "special"
    «Cuidado con acercarse de más entre este humo. Mantengan la distancia y limpien el salón desde lejos.» # bg: banquet-hall # speaker: Príncipe Heredero # char: prince # side: left # mood: confident
    -> confrontacion_politica

=== confrontacion_politica ===
El infiltrado deja escapar una risa ahogada detrás de la máscara y palmea un segundo cinturón oculto bajo la chaqueta. # bg: banquet-hall # speaker: Sicario de la Corte # char: assassin # side: right # pokemon: none # mood: smug
«¿Sabes qué es lo más gracioso de pelear contra sangre azul? Que se acostumbran tanto a los tronos que se olvidan de cómo muerde la calle.» # bg: banquet-hall # speaker: Sicario de la Corte # char: assassin # side: right # pokemon: none # mood: smug

* [Guardar silencio y observar cada movimiento de sus manos]
    ~ assassin_plan = "sabotage"
    El sicario inclina la cabeza, satisfecho con el mutismo, y elige las cápsulas más desgastadas de su flanco derecho. # bg: banquet-hall # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: tense
    -> fin_escena
* [Lanzar al aire los nombres de quienes financian este atentado]
    ~ assassin_plan = "mirror"
    Por una fracción de segundo sus hombros se endurecen. Cambia de mano con brusquedad y toma una cápsula distinta de la parte trasera de su cinturón. «Hablas de más, muchacho. Entonces te vas a ver en un espejo.» # bg: banquet-hall # speaker: Sicario de la Corte # char: assassin # side: right # pokemon: none # mood: angry
    -> fin_escena

=== fin_escena ===
Las puertas blindadas caen con un golpe metálico que hace temblar la vajilla. Ya no entra ni sale nadie del Salón de Estado. # bg: banquet-hall # speaker: Narrador # char: prince # side: left # mood: serious
-> END
