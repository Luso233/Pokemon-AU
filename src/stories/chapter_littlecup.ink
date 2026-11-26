VAR lc_lead = "larvesta"

-> recuerdo_inicio

=== recuerdo_inicio ===
Un recuerdo de hace diez años. El Jardín de Entrenamiento del Palacio de Wyndon resplandece bajo el sol dorado de la tarde. # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: larvesta # mood: calm
Solo tienes seis años y sostienes con ambas manos las Poké Balls de las crías que algún día serán tu escolta real: Larvesta, Growlithe, Rookidee, Larvitar, Gible y Ralts. # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: growlithe # mood: calm
Frente a ti sonríe La Campeona de Galar, haciendo girar una Poké Ball dorada entre sus dedos con aire regio y divertido. # bg: royal-training-ground # speaker: Narrador # char: champion # side: right # pokemon: vullaby # mood: confident
"¿Seguro que quieres una batalla real, pequeño príncipe? Tus crías son Nivel 5... pero el mundo allá afuera nunca pelea en igualdad de condiciones." # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: onix # mood: confident
"Así que hoy mis pequeños estarán al Nivel 6... y mi Vullaby al Nivel 7. En Little Cup, uno o dos niveles extra son un abismo. Si puedes vencerme así, ningún conspirador podrá doblegarte jamás." # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: vullaby # mood: smug
Recuerdas que Onix siempre abre con Trampa Rocas en el primer turno para romper Bandas Focus... ¿con cuál de tus crías abrirás el combate? # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: ralts # mood: serious

* [Abrir con Larvitar (Rompe Robustez y Zumo de Baya de Onix con Pedrada)]
    ~ lc_lead = "larvitar"
    "¡Larvitar, tú vas primero! Si rompemos a Onix antes de que haga daño, Ralts conservará su Banda Focus para Vullaby." # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: larvitar # mood: confident
    -> cierre_lc
* [Abrir con Rookidee (Bloquea Trampa Rocas en Turno 1 con Mofa)]
    ~ lc_lead = "rookidee"
    "¡Rookidee, Mofa en el primer turno! No dejaremos que ponga rocas en el campo." # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: rookidee # mood: confident
    -> cierre_lc
* [Abrir con Larvesta (Formación clásica anti-Mienfoo y Pawniard)]
    ~ lc_lead = "larvesta"
    "¡Larvesta, sal al frente! Aguantaremos su presión física con Cuerpo Llama." # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: larvesta # mood: confident
    -> cierre_lc

=== cierre_lc ===
La Campeona aplaude suavemente y lanza su primera Poké Ball. Combate Little Cup con cap roto (Nv. 5 vs Nv. 6–7) inicializado en gen9customgame. # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: onix # mood: confident
-> END
