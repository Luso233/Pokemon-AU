VAR phalanx_plan = "gardevoir_center"

-> campo_hammerlocke

=== campo_hammerlocke ===
Explanada militar frente a las murallas de Hammerlocke. Estandartes azul cobalto ondean mientras la Caballería del Duque de Hammerlocke despliega tres líneas simultáneas. # bg: hammerlocke-field # speaker: Narrador # char: hammerlocke_duke # side: right # pokemon: kangaskhanmega # mood: confident
"En una guerra de casas nobles no se combate de uno en uno, Alteza. Se combate en Falange Triple: Flanco Izquierdo, Vanguardia Central y Flanco Derecho." # bg: hammerlocke-field # speaker: Duque de Hammerlocke # char: hammerlocke_duke # side: right # pokemon: aegislash # mood: confident
"Recuerda las leyes de la Batalla Triple (Gen 6): tu Pokémon del Centro alcanza a los tres rivales, mientras que las Esquinas solo golpean al frente y al centro — salvo ataques voladores o de pulso como Pájaro Osado o Tajo Aéreo, que cruzan todo el campo." # bg: hammerlocke-field # speaker: Duque de Hammerlocke # char: hammerlocke_duke # side: right # pokemon: togekiss # mood: serious
"Hitmontop cubrirá el Flanco Izquierdo con Sorpresa y Vastaguardia, Mega Gardevoir comandará el Centro con Vozarrón, y Talonflame en el Flanco Derecho podrá cruzar todo el tablero con Pájaro Osado." # bg: hammerlocke-field # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoirmega # mood: confident

* [Formación Clásica: Hitmontop (Izq) · Mega Gardevoir (Centro) · Talonflame (Der)]
    ~ phalanx_plan = "gardevoir_center"
    "Vanguardia central con Mega Gardevoir. ¡Activa la Megaevolución desde el panel de comandos cuando estés listo!" # bg: hammerlocke-field # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoirmega # mood: confident
    -> cierre_triples
* [Formación Flanqueo Veloz: Talonflame (Izq) · Mega Gardevoir (Centro) · Hitmontop (Der)]
    ~ phalanx_plan = "flank_swap"
    "Invertimos los flancos para alinear a Hitmontop frente a la Mega Kangaskhan del Duque." # bg: hammerlocke-field # speaker: Príncipe Heredero # char: prince # side: left # pokemon: hitmontop # mood: confident
    -> cierre_triples

=== cierre_triples ===
Showcase oficial de Batalla Triple 6v6 (gen6triplescustomgame · Megaevolución habilitada). 3 Pokémon activos por bando con alcance posicional real. # bg: hammerlocke-field # speaker: Sistema Táctico # char: prince # side: left # pokemon: talonflame # mood: confident
-> END
