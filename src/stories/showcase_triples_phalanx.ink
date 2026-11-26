VAR phalanx_plan = "gardevoir_center"

-> campo_hammerlocke

=== campo_hammerlocke ===
El paso fronterizo entre Kalos y Paldea se extiende bajo un cielo plomizo donde los estandartes azul cobalto de la expedición imperial crujen con el viento de los Pirineos. Al otro lado de la calzada, el Duque de Hammerlocke alinea tres estandartes de combate al mismo tiempo para impedirte llegar a los puertos del Atlántico. # bg: hammerlocke-field # speaker: Narrador # char: hammerlocke_duke # side: right # pokemon: none # mood: confident
«En la corte la gente discute de a uno, Alteza, pero en la frontera el campo tiene tres frentes: izquierda, centro y derecha.» El Duque ajusta su guantelete mirando la extensión del patio. «Quien no entiende la distancia entre un flanco y la esquina opuesta termina perdiendo la línea entera.» # bg: hammerlocke-field # speaker: Duque de Hammerlocke # char: hammerlocke_duke # side: right # pokemon: none # mood: confident
A tu alrededor, Gardevoir sostiene en silencio la piedra brillante que guarda en el pecho, Hitmontop gira sobre las puntas midiendo el terreno y Talonflame bate las alas buscando altura sobre las murallas. # bg: hammerlocke-field # speaker: Narrador # char: prince # side: left # pokemon: gardevoirmega # mood: confident
Un cuerno grave resuena desde las almenas. Solo queda definir cómo se abrirán tus flancos antes de que choque la vanguardia. # bg: hammerlocke-field # speaker: Narrador # char: prince # side: left # pokemon: talonflame # mood: serious

* [Mantener la formación clásica: Hitmontop a la izquierda, Gardevoir al centro, Talonflame a la derecha]
    ~ phalanx_plan = "gardevoir_center"
    «Gardevoir comanda el centro; cubran ambos flancos y no pierdan de vista las esquinas.» # bg: hammerlocke-field # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoirmega # mood: confident
    -> cierre_triples
* [Invertir los flancos: Talonflame a la izquierda, Gardevoir al centro, Hitmontop a la derecha]
    ~ phalanx_plan = "flank_swap"
    «Cambiamos los extremos antes de sonar el cuerno. Vamos a descolocar su vanguardia desde el arranque.» # bg: hammerlocke-field # speaker: Príncipe Heredero # char: prince # side: left # pokemon: hitmontop # mood: confident
    -> cierre_triples

=== cierre_triples ===
El Duque levanta el brazo y tres destellos se abren al mismo tiempo sobre la explanada de Hammerlocke. # bg: hammerlocke-field # speaker: Narrador # char: prince # side: left # pokemon: none # mood: confident
-> END
