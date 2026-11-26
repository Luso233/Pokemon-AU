VAR mines_lead = "arcanine"
VAR wave1_alive = 4

-> tunel_entrada

=== tunel_entrada ===
Minas de Galar, Nivel Profundo 4. Las lámparas de gas parpadean entre el polvo de carbón mientras una barricada de barriles explosivos sella el túnel de fuga. # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: arcanine # mood: serious
"¡Alto ahí, Alteza! Somos los Zapadores Rebeldes. Si no podemos atraparte, derrumbaremos toda la galería contigo dentro." # bg: galar-mines # speaker: Jefe Zapador Rebelde # char: mine_sapper # side: right # pokemon: golem # mood: confident
"¡Y escucha bien! Nuestro Golem con Baya Chiri tiene órdenes de detonar Explosión en cuanto caiga por debajo del 35% de PS o quede solo en pie. ¡Si sobrevives al derrumbe, la Guardia Corrupta te espera al otro lado sin tiempo para curarte!" # bg: galar-mines # speaker: Jefe Zapador Rebelde # char: mine_sapper # side: right # pokemon: golem # mood: confident
"Dos combates seguidos sin Centro Pokémon ni pociones... Todo el daño, estado y PP que gaste contra los Zapadores se arrastrará contra el Capitán de la Guardia. Debo guardar a Dragapult (Fantasma) o usar Protección cuando salga Golem." # bg: galar-mines # speaker: Príncipe Heredero # char: prince # side: left # pokemon: dragapult # mood: serious

* [Abrir con Arcanine (Intimidación + Protección para baitear Explosión)]
    ~ mines_lead = "arcanine"
    "Arcanine, encabeza la fuga y controla el ataque físico de los Zapadores." # bg: galar-mines # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: confident
    -> oleada_uno
* [Abrir con Corviknight (Muralla Acero resistente a Roca y Explosión)]
    ~ mines_lead = "corviknight"
    "Corviknight, tu armadura de Acero amortiguará tanto las rocas como cualquier detonación." # bg: galar-mines # speaker: Príncipe Heredero # char: prince # side: left # pokemon: corviknight # mood: confident
    -> oleada_uno

=== oleada_uno ===
¡OLEADA 1: ZAPADORES REBELDES! Tu estado real de PS, PP y estados alterados se guardará al terminar para el Combate 2 sin curación. # bg: galar-mines # speaker: Sistema Táctico # char: mine_sapper # side: right # pokemon: excadrill # mood: serious # START_BATTLE: mines_wave1
-> humo_intermedio

=== humo_intermedio ===
El estruendo de los explosivos sacude las vigas de hierro. El humo gris se disipa lentamente por la galería mientras los Zapadores huyen hacia las vías laterales. # bg: galar-mines # speaker: Narrador # char: prince # side: left # pokemon: dragapult # mood: serious # clear: right
"Agh... no hay tiempo para curar al equipo. El desgaste, las heridas y los PP gastados siguen exactamente igual..." # bg: galar-mines # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: serious
Unas botas blindadas resuenan desde la boca del túnel. Del humo emerge el Capitán de la Guardia Corrupta con tres Pokémon completamente frescos. # bg: galar-mines # speaker: Narrador # char: corrupt_captain # side: right # pokemon: corviknight # mood: serious
"Buen trabajo despejando los escombros por mí, Príncipe. Mis hombres han recibido órdenes de no dejar testigos... y tu escuadrón ya está agotado." # bg: galar-mines # speaker: Capitán de la Guardia Corrupta # char: corrupt_captain # side: right # pokemon: bisharp # mood: confident
"¡Corviknight, Grimmsnarl, Bisharp — cierren la salida!" # bg: galar-mines # speaker: Capitán de la Guardia Corrupta # char: corrupt_captain # side: right # pokemon: grimmsnarl # mood: confident
¡OLEADA 2 (SIN CURACIÓN): CAPITÁN DE LA GUARDIA CORRUPTA! BattlePersistenceManager inyecta tus PS, estados, bajas y PP exactos heredados de la Oleada 1. # bg: galar-mines # speaker: Sistema Táctico # char: corrupt_captain # side: right # pokemon: bisharp # mood: serious # START_BATTLE: mines_wave2 --persist=true
-> END
