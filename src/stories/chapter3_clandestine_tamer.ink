VAR tamer_ally = "rescued_ursaring"
VAR scout_intel = "listen"

-> descenso

=== descenso ===
# BG: underground-ring
# SPEAKER: Narrador
Bajo los adoquines del Distrito Industrial de Wyndon, una escalera de hierro desciende hacia un foso clandestino iluminado por antorchas rojas.
# SPEAKER: Príncipe Heredero
# CHAR: prince
Este lugar apesta a crueldad. Los informes de la guardia eran ciertos: nobles caídos entrenan Pokémon rompiendo su espíritu a propósito.
# SPEAKER: Lord Vexen (Domador Clandestino)
# CHAR: clandestine_tamer
¿Un cachorro de la Corona en mi foso? Admira la pureza de la eficacia, Alteza. El afecto ablanda a las bestias; el rencor absoluto desata Frustration a 102 de potencia base.
# SPEAKER: Lord Vexen (Domador Clandestino)
# CHAR: clandestine_tamer
Incluso tus preciados fantasmas caen ante una Kangaskhan con Intrépido (Scrappy) y Pañuelo Seda. Nadie sale de este foso intercambiando golpes físicos.

* [Escuchar sus órdenes para anotar su patrón de apertura]
    ~ scout_intel = "listen"
    # SPEAKER: Príncipe Heredero
    # CHAR: prince
    (Su Kangaskhan siempre abre con Sorpresa para romper Bandas Focus antes de desatar Frustration al 100%...)
    -> jaulas

* [Exigir que libere a los Pokémon de inmediato]
    ~ scout_intel = "confront"
    # SPEAKER: Lord Vexen (Domador Clandestino)
    # CHAR: clandestine_tamer
    ¡Ja! Si los quieres, gánamelos sobre la arena. Que su odio decida quién tiene la razón.
    -> jaulas

=== jaulas ===
# SPEAKER: Narrador
A un costado del cuadrilátero, un Ursaring malherido golpea los barrotes con furia contenida. Aún conserva la marca del vínculo roto (Felicidad: 0), pero te mira buscando revancha contra su captor.

* [Abrir su jaula y liderar con el Ursaring rescatado (Felicidad: 0 · Frustration 102 BP)]
    ~ tamer_ally = "rescued_ursaring"
    # SPEAKER: Príncipe Heredero
    # CHAR: prince
    Ven conmigo, amigo. Hoy usarás esa rabia por última vez para cerrar este foso... y después sanaremos ese vínculo juntos.
    -> combate

* [Mantener a Ursaring a salvo y liderar con Corviknight (Casco Dentado + Defensa Férrea)]
    ~ tamer_ally = "royal_corviknight"
    # SPEAKER: Príncipe Heredero
    # CHAR: prince
    Quédate detrás de mí, ya sufriste demasiado. Corviknight, castiga cada golpe físico suyo con Casco Dentado y Plancha Corporal.
    -> combate

=== combate ===
# SPEAKER: Lord Vexen (Domador Clandestino)
# CHAR: clandestine_tamer
¡Que comience el espectáculo! ¡Kangaskhan, demuéstrale al Príncipe cuánto duele un vínculo roto!
-> END
