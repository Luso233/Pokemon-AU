VAR lc_lead = "larvesta"

-> recuerdo_inicio

=== recuerdo_inicio ===
Un recuerdo tibio de hace diez años. El Jardín de Entrenamiento del Palacio de Wyndon brilla bajo la luz ámbar de la tarde, con olor a pasto recién cortado y pétalos caídos sobre la arena blanca. # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: larvesta # mood: calm
Apenas tienes seis años y sostienes con ambas manos las seis Poké Balls nuevas de las crías que te regalaron esa mañana: pequeñas, inquietas y todavía acostumbrándose a tu voz. # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: growlithe # mood: calm
Al otro lado del círculo de arena, la Campeona de Galar sonríe con las manos detrás de la espalda, haciendo girar una Poké Ball dorada entre los dedos sin apartar los ojos de ti. # bg: royal-training-ground # speaker: Narrador # char: champion # side: right # pokemon: none # mood: confident
«¿Seguro que quieres una pelea de verdad, pequeño?» Su tono es cálido, pero su postura sobre la arena no tiene nada de juego. «Cuando crezcas, nadie allá afuera va a nivelar la balanza para que sea justa.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: confident
«Hoy mis compañeros tienen un par de meses más de entrenamiento que los tuyos... y mi favorita todavía más. Si aprendes a sostener la mirada cuando estás abajo, ningún trono te quedará grande.» # bg: royal-training-ground # speaker: La Campeona # char: champion # side: right # pokemon: none # mood: smug
La Campeona acomoda su primera Poké Ball en la palma; el polvo cerca de sus botas se mueve levemente, como si algo pesado y paciente esperara para sembrar el campo apenas toque el suelo. ¿Quién dará el primer paso? # bg: royal-training-ground # speaker: Narrador # char: prince # side: left # pokemon: ralts # mood: serious

* [Lanzar primero a Larvitar para responder golpe por golpe sobre la arena]
    ~ lc_lead = "larvitar"
    «¡Larvitar, ve tú primero! No dejemos que nos acorrale desde el principio.» # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: larvitar # mood: confident
    -> cierre_lc
* [Enviar primero a Rookidee para estorbar cualquier truco desde el aire]
    ~ lc_lead = "rookidee"
    «¡Rookidee, sal rápido y no le des respiro para acomodarse!» # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: rookidee # mood: confident
    -> cierre_lc
* [Abrir con Larvesta confiando en su temple frente a rivales más grandes]
    ~ lc_lead = "larvesta"
    «¡Larvesta, vamos al frente! Demostrémosle que no tenemos miedo.» # bg: royal-training-ground # speaker: Príncipe Heredero # char: prince # side: left # pokemon: larvesta # mood: confident
    -> cierre_lc

=== cierre_lc ===
La Campeona asiente con un brillo genuino en los ojos y lanza su primera Poké Ball bajo el sol de la tarde. # bg: royal-training-ground # speaker: Narrador # char: champion # side: right # pokemon: none # mood: confident
-> END
