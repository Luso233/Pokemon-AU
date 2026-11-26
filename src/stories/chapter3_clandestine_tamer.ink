VAR tamer_ally = "rescued_ursaring"
VAR scout_intel = "listen"

-> descenso

=== descenso ===
Bajo los adoquines del Distrito Industrial de Wyndon, una escalera de hierro desciende hacia un foso clandestino iluminado por antorchas rojas. # bg: underground-ring # speaker: Narrador # char: prince # side: left # pokemon: none
«Este lugar apesta a crueldad. Los informes de la guardia eran ciertos: nobles caídos entrenan Pokémon rompiendo su espíritu a propósito.» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: archaludon
«¿Un cachorro de la Corona en mi foso? Admira la pureza de la eficacia, Alteza. El afecto ablanda a las bestias; el rencor absoluto desata Frustration a 102 de potencia base.» # bg: underground-ring # speaker: Lord Vexen (Domador Clandestino) # char: clandestine_tamer # side: right # pokemon: kangaskhan
«Incluso tus preciados fantasmas caen ante una Kangaskhan con Intrépido (Scrappy) y Pañuelo Seda. Nadie sale de este foso intercambiando golpes físicos.» # bg: underground-ring # speaker: Lord Vexen (Domador Clandestino) # char: clandestine_tamer # side: right # pokemon: kangaskhan

* [Escuchar sus órdenes para anotar su patrón de apertura]
    ~ scout_intel = "listen"
    «(Su Kangaskhan siempre abre con Sorpresa para romper Bandas Focus antes de desatar Frustration al 100%...)» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gholdengo
    -> jaulas

* [Exigir que libere a los Pokémon de inmediato]
    ~ scout_intel = "confront"
    «¡Ja! Si los quieres, gánamelos sobre la arena. Que su odio decida quién tiene la razón.» # bg: underground-ring # speaker: Lord Vexen (Domador Clandestino) # char: clandestine_tamer # side: right # pokemon: lopunny
    -> jaulas

=== jaulas ===
A un costado del cuadrilátero, un Ursaring malherido golpea los barrotes con furia contenida. Aún conserva la marca del vínculo roto (Felicidad: 0), pero te mira buscando revancha contra su captor. # bg: underground-ring # speaker: Narrador # char: prince # side: left # pokemon: ursaring

* [Abrir su jaula y liderar con el Ursaring rescatado (Felicidad: 0 · Frustration 102 BP)]
    ~ tamer_ally = "rescued_ursaring"
    «Ven conmigo, amigo. Hoy usarás esa rabia por última vez para cerrar este foso... y después sanaremos ese vínculo juntos.» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: ursaring
    -> combate

* [Mantener a Ursaring a salvo y liderar con Corviknight (Casco Dentado + Defensa Férrea)]
    ~ tamer_ally = "royal_corviknight"
    «Quédate detrás de mí, ya sufriste demasiado. Corviknight, castiga cada golpe físico suyo con Casco Dentado y Plancha Corporal.» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: corviknight
    -> combate

=== combate ===
«¡Que comience el espectáculo! ¡Kangaskhan, demuéstrale al Príncipe cuánto duele un vínculo roto!» # bg: underground-ring # speaker: Lord Vexen (Domador Clandestino) # char: clandestine_tamer # side: right # pokemon: kangaskhan
-> END
