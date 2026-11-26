VAR bond_tone = "student"

-> encuentro_maestra

=== encuentro_maestra ===
Un mirador vacío al borde del acantilado permanece envuelto en niebla marina. Cuando cruzas el arco de piedra, la Campeona de Galar ya está ahí sin su capa ceremonial, mirando el horizonte con los brazos cruzados y la misma calma con la que te corregía la postura hace diez años. # bg: royal-training-ground # speaker: Narrador # char: champion # side: right # pokemon: none # mood: serious
«Sigues cargando el peso en el pie izquierdo cuando entras a una habitación que no conoces.» Gira hacia ti con una sonrisa tenue y melancólica. «Creí que te había quitado esa costumbre cuando tenías seis años.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: dragapult # mood: confident
«Todo el palacio dijo que te quedaste sirviendo al Consejo.» Sientes un nudo en la garganta al mirarla de frente. «Necesito saber de qué lado estás.» # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: arcanine # mood: serious
Ella da un paso hasta quedar a un brazo de distancia y desliza un manual sellado de la Doctrina Real y una llave dorada en tu palma. Por encima de las nubes, una sombra esmeralda gigantesca cruza un instante el cielo rasgando la bruma —su Mega-Rayquaza vigilando la costa en silencio. «Si hubiera renunciado la noche del golpe de tu hermano bastardo, la CRU habría tomado toda la flota y nunca habrías salido vivo de Wyndon. Estoy sosteniendo la puerta desde adentro para darte tiempo de volverte imparable.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: rayquazamega # mood: serious

* [«No vuelvas a cargar con todo sola. Cuando regrese a Galar, los derribaremos juntos.»]
    ~ bond_tone = "together"
    Sus ojos brillan un instante y apoya suavemente la palma contra tu hombro. «Hace mucho que dejaste de ser el niño del jardín, Alteza. Estudia la Doctrina Real: tutorías de movimientos sin costo y fondos de emergencia en tu base. Quiero verte superar incluso a tu hermano... para que luego te midas conmigo.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: volcarona # mood: confident
    -> cierre_champ_r1
* [«Entonces no tengas piedad conmigo cuando nos volvamos a medir en la arena.»]
    ~ bond_tone = "rival"
    Una risa cálida rompe la tensión de la niebla. «¿Piedad? Jamás te la tuve con un Growlithe nivel cinco y menos te la tendré cuando baje a Mega-Rayquaza del cielo. Toma la Doctrina Real y sobrevive al exilio; quiero enfrentarme a un verdadero soberano.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: rayquazamega # mood: confident
    -> cierre_champ_r1

=== cierre_champ_r1 ===
Antes de desaparecer entre la bruma, deja en tus manos la Doctrina Real de la Campeona. [Rango 1 alcanzado · Doctrina Real: Tutoría GRATIS de Slots de Movimiento (0 PC) + +30% PokéCoronas + 1 Curación Total gratuita tras cada combate.] # bg: royal-training-ground # speaker: Narrador # char: champion # side: right # pokemon: none # mood: confident
-> END
