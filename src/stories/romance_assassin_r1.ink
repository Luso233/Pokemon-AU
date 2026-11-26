VAR bond_tone = "trust"

-> encuentro_lluvia

=== encuentro_lluvia ===
Un almacén abandonado en los suburbios de Ciudad Ryme gotea bajo la llovizna tibia. Sobre una caja de madera arde una lámpara de queroseno y un terminal portátil lleno de perfiles tácticos robados a la CRU; sentado en el marco de la ventana, el Pelirrojo gira una Poké Ball abollada entre los dedos. # bg: wyndon-alleys # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: serious
«Tardaste más de la cuenta, Alteza. Y sigues trayendo exactamente la misma cobertura defensiva de siempre; ya había armado tres counters distintos antes de que cruzarás la puerta.» Te arroja una tableta encriptada con expedientes marcados en rojo. # bg: wyndon-alleys # speaker: El Pelirrojo # char: assassin # side: right # pokemon: kingambit # mood: smug
«¿Por qué me entregas informes del Consejo ahora?» Sostienes el terminal sin bajar la guardia. «Hasta ayer cobrabas por cazarme.» # bg: wyndon-alleys # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: serious
Él gira despacio la vista hacia la lluvia y su sonrisa burlona se borra por primera vez. «Porque tu hermano bastardo y la CRU mandaron purgar también a los mercenarios que sabíamos demasiado sobre Isla Æos y el Último Ditto. A mí me quieren igual de muerto que a ti... y si vas a sobrevivir a lo que preparan, necesitas saber qué objetos ocultos trae cada jefe antes de entrar.» # bg: wyndon-alleys # speaker: El Pelirrojo # char: assassin # side: right # pokemon: none # mood: serious

* [«Entonces deja los rodeos y conecta tu red de inteligencia a mi campamento.»]
    ~ bond_tone = "direct"
    El Pelirrojo suelta una risa corta, baja de la ventana y apoya dos dedos en la visera imaginaria. «Vaya forma de reclutar a un rival, Alteza. Trato hecho: mientras sigas vivo, mi Red de Inteligencia te avisará de cada trampa Diablo antes del combate.» # bg: wyndon-alleys # speaker: El Pelirrojo # char: assassin # side: right # pokemon: ceruledge # mood: confident
    -> cierre_r1
* [«No olvido la emboscada en Wyndon, pero tu información vale oro.»]
    ~ bond_tone = "guarded"
    «Justo como debe ser. Si me hubieras creído a la primera habría dudado de que sobrevivas al exilio.» Te guiña un ojo con media sonrisa. «Revisa tu Teambuilder antes del próximo jefe; te ahorré un golpe letal.» # bg: wyndon-alleys # speaker: El Pelirrojo # char: assassin # side: right # pokemon: kingambit # mood: smug
    -> cierre_r1

=== cierre_r1 ===
Gardevoir baja lentamente los hombros al notar que, por primera vez desde Wyndon, la rivalidad deja paso a una complicidad táctica inesperada. [Rango 1 alcanzado · Red de Inteligencia: Scouting Anti-Diablo activo en Teambuilder + 1 parcela extra.] # bg: wyndon-alleys # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: confident
-> END
