VAR mines_lead = "arcanine"
VAR wave1_alive = 4

-> tunel_entrada

=== tunel_entrada ===
Minas de Galar, Nivel Profundo 4. Las lámparas de gas tiemblan colgadas de vigas viejas mientras el polvo de carbón flota espeso bajo la bóveda de roca. Más adelante, una barricada improvisada de barriles y vagonetas volcadas sella el túnel de escape. # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious
Entre las sombras del andén surgen cascos tiznados y mechas encendidas chisporroteando en el suelo. El jefe de los zapadores apoya la bota sobre un cajón marcado con pólvora y silba hacia el fondo del corredor. # bg: galar-mines # speaker: Narrador # char: mine_sapper # side: right # pokemon: none # mood: confident
«Hasta aquí llegó su paseo subterráneo, Alteza. Si no logra pasar por encima de nosotros, derrumbaremos el túnel entero sobre sus cabezas.» # bg: galar-mines # speaker: Jefe Zapador Rebelde # char: mine_sapper # side: right # pokemon: none # mood: confident
Al fondo de la galería, más allá del polvo, se distinguen linternas disciplinadas y el golpe acompasado de botas militares acercándose por la boca de salida. Si rompes esta barricada, no habrá un segundo para detenerse ni curar heridas antes del siguiente choque. # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: dragapult # mood: serious
Uno de los zapadores acaricia una Poké Ball pesada con una sonrisa demente, revisando el cable de detonación en su cinturón. ¿Con quién rompes primero el bloqueo? # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious

* [Abrir paso con Arcanine para imponer presencia en el corredor estrecho]
    ~ mines_lead = "arcanine"
    «Arcanine, al frente. Abre brecha rápido y no te regales si ves que se acorralan.» # bg: galar-mines # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: confident
    -> oleada_uno
* [Abrir paso con Corviknight confiando en su coraza entre las rocas]
    ~ mines_lead = "corviknight"
    «Corviknight, tú primero. Aguanta la lluvia de escombros y guarda fuerzas para lo que espera afuera.» # bg: galar-mines # speaker: Príncipe Heredero # char: prince # side: left # pokemon: corviknight # mood: confident
    -> oleada_uno

=== oleada_uno ===
Los zapadores arrojan sus cápsulas entre chispas de pólvora y el eco de la mina se cierra detrás de ti. # bg: galar-mines # speaker: Narrador # char: mine_sapper # side: right # pokemon: none # mood: serious # START_BATTLE: mines_wave1
-> humo_intermedio

=== humo_intermedio ===
Un estruendo seco sacude las vigas del techo y deja caer una cortina de grava fina sobre los rieles. El humo gris se arrastra lento por la galería mientras los zapadores huyen hacia los túneles laterales. # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: dragapult # mood: serious # clear: right
Tu escuadrón respira agitado entre la ceniza. Las heridas, el cansancio y el desgaste del choque anterior siguen intactos sobre cada uno de tus compañeros, y no queda ni un frasco de medicina en el bolsillo. # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious
Desde la boca del túnel avanzan pasos lentos y firmes. Las linternas cortan el humo revelando la capa oscura del Capitán de la Guardia Corrupta, impecable y con su cinturón intacto. # bg: galar-mines # speaker: Narrador # char: corrupt_captain # side: right # pokemon: none # mood: serious
«Gracias por quitarme de encima el polvo, Alteza.» El Capitán desenfunda su primera Poké Ball con calma helada. «Recibí órdenes de que nadie salga vivo de este nivel... y veo que ya vienen sin aliento.» # bg: galar-mines # speaker: Capitán de la Guardia Corrupta # char: corrupt_captain # side: right # pokemon: none # mood: confident
El humo se cierra de nuevo sobre los rieles mientras el segundo cerco avanza sin darte tregua. # bg: galar-mines # speaker: Narrador # char: corrupt_captain # side: right # pokemon: none # mood: serious # START_BATTLE: mines_wave2 --persist=true
-> END
