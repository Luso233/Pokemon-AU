VAR gen1_lead = "tauros"

-> camara_silph

=== camara_silph ===
Bóveda Subterránea del Archivo Real de Galar. Monitores de fósforo verde cargan un cartucho sellado con el emblema de Silph Co., fechado décadas antes de la era moderna. # bg: silph-archive # speaker: Narrador # char: royal_archivist # side: right # pokemon: mewtwo # mood: calm
"Bienvenido a la Reliquia de Silph Co., joven príncipe. He reconstruido una simulación exacta de la Era Antigua de Kanto (Generación 1): sin objetos equipados, sin habilidades, sin división Físico/Especial por movimiento y con Críticos ligados a la Velocidad." # bg: silph-archive # speaker: El Archivista Real # char: royal_archivist # side: right # pokemon: mew # mood: confident
"Enfrentarás la versión equilibrada de las dos anomalías genéticas originales — Mewtwo y Mew (sin Amnesia ni Recuperación) — acompañadas por el panteón clásico de Kanto. Tu arma será el equipo legendario de Smogon Gen 1 OU: Tauros, Chansey, Snorlax, Exeggutor, Starmie y Alakazam." # bg: silph-archive # speaker: El Archivista Real # char: royal_archivist # side: right # pokemon: tauros # mood: serious
"En Gen 1 la Parálisis, el Sueño y las Explosiones (que reducen a la mitad la Defensa rival al calcular daño) son el gran ecualizador frente al poder bruto de Mewtwo." # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: alakazam # mood: confident

* [Abrir con Alakazam (Psíquico + Onda Trueno veloz contra el lead rival)]
    ~ gen1_lead = "alakazam"
    "Alakazam abrirá para esparcir Onda Trueno y controlar el ritmo especial desde el Turno 1." # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: alakazam # mood: confident
    -> inicio_gen1
* [Abrir con Tauros (El Rey de Gen 1 OU: Golpe Cuerpo + Hiperrayo)]
    ~ gen1_lead = "tauros"
    "Tauros en punta para presionar desde el primer intercambio con Golpe Cuerpo y Ventisca." # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: tauros # mood: confident
    -> inicio_gen1
* [Abrir con Exeggutor (Somnífero inmediato + Explosión táctica)]
    ~ gen1_lead = "exeggutor"
    "Exeggutor entra primero para dormir a la amenaza inicial y preparar el tablero." # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: exeggutor # mood: confident
    -> inicio_gen1

=== inicio_gen1 ===
Archivo Histórico cargado en motor nativo gen1customgame (Reglas RBY: sin objetos ni habilidades). ¡Demuestra que el control clásico supera a Mew y Mewtwo! # bg: silph-archive # speaker: Sistema Táctico # char: royal_archivist # side: right # pokemon: mewtwo # mood: confident
-> END
