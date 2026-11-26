VAR triad_ace = "charizard"

-> patio_juicio

=== patio_juicio ===
El acantilado helado del Estrecho Austral, en Cordelia, huele a viento austral y hierro aceitado. A lo lejos se distinguen las luces de la base naval de Galar en las Islas Bruma. Tres caballeros acorazados desembarcados de esa guarnición avanzan al mismo compás hasta formar una media luna cerrada frente a ti. # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: none # mood: serious
«Somos la Tríada del Duque.» Su voz retumba metálica debajo de los yelmos. «Quien pretenda sentarse en el Consejo de Guerra debe sostener el centro del círculo con un solo representante frente a los tres a la vez.» # bg: triad-arena # speaker: Tríada de Élite # char: triad_knights # side: right # pokemon: none # mood: confident
Antes de que empiece el juicio, observas el lenguaje silencioso de su formación: el caballero del centro golpea su escudo ancho contra el suelo marcando un compás marcial —abre la guardia, resiste, respira un tiempo y vuelve a alzarla—, mientras el guerrero del flanco izquierdo ni siquiera da un paso al frente, con la mano quieta sobre la empuñadura esperando a que tú des el primer golpe. # bg: triad-arena # speaker: Narrador # char: prince # side: left # pokemon: charizardmegay # mood: serious
Solo puedes elegir un compañero para ocupar el centro del círculo de piedra. # bg: triad-arena # speaker: Narrador # char: prince # side: left # pokemon: garchomp # mood: serious

* [Enviar a Charizard al centro y disputar el círculo con fuego y cielo]
    ~ triad_ace = "charizard"
    «Charizard, toma el centro. Si quieren cerrarse en escudo, encontraremos cuándo bajan los brazos.» # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: charizardmegay # mood: confident
    -> inicio_juicio
* [Enviar a Garchomp al centro y hacer temblar las losas bajo sus botas]
    ~ triad_ace = "garchomp"
    «Garchomp, al centro del patio. Que el peso de sus armaduras juegue en su contra.» # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: garchomp # mood: confident
    -> inicio_juicio

=== inicio_juicio ===
Tres lanzas descienden al unísono apuntando al centro de la arena. El Juicio de los Tres Caballeros ha comenzado. # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: none # mood: serious
-> END
