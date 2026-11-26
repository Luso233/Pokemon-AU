VAR triad_ace = "charizard"

-> patio_juicio

=== patio_juicio ===
Círculo de piedra interior del Castillo de Hammerlocke. Tres caballeros acorazados — Escavalier, Aegislash y Bisharp — cierran formación en media luna frente al centro de la arena. # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: aegislash # mood: serious
"Somos la Tríada de Élite del Duque. Ningún comandante entra en el Consejo de Guerra sin superar el Juicio de los Tres Caballeros con un solo Pokémon en el centro." # bg: triad-arena # speaker: Tríada de Élite del Duque # char: triad_knights # side: right # pokemon: escavalier # mood: confident
"¡Formación Escudo! Aegislash alzará Vastaguardia (Wide Guard) en los Turnos 1 y 3 para anular cualquier ataque de área mientras Escavalier y Bisharp te rodean." # bg: triad-arena # speaker: Tríada de Élite del Duque # char: triad_knights # side: right # pokemon: bisharp # mood: confident
"Si Aegislash levanta Vastaguardia en Turno 1 y Turno 3, tirar Onda Ígnea o Avalancha en esos turnos rebotará por completo. Tendré que castigarlos con ataques individuales esos turnos y desatar el área en los turnos pares." # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: charizardmegay # mood: serious

* [Elegir a Mega Charizard Y (Sequía · Heat Wave, Solar Beam, Air Slash, Protect)]
    ~ triad_ace = "charizard"
    "Mega Charizard Y ocupará el Centro: Tajo Aéreo y Rayo Solar atraviesan Vastaguardia en Turnos 1 y 3, y Onda Ígnea bajo el Sol calcinará a los tres en Turno 2." # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: charizardmegay # mood: confident
    -> inicio_juicio
* [Elegir a Garchomp @ Life Orb (Earthquake, Rock Slide, Dragon Claw, Protect)]
    ~ triad_ace = "garchomp"
    "Garchomp al Centro: Garra Dragón castiga en los turnos de Vastaguardia, y Terremoto + Avalancha rompen la línea cuando bajen el escudo." # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: garchomp # mood: confident
    -> inicio_juicio

=== inicio_juicio ===
Desafío 1 vs. 3 en Triples (gen6triplescustomgame). Tu As ocupa la posición Central con alcance total frente a Escavalier, Aegislash (Wide Guard T1 y T3) y Bisharp. # bg: triad-arena # speaker: Sistema Táctico # char: triad_knights # side: right # pokemon: aegislash # mood: serious
-> END
