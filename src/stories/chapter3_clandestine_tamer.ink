VAR tamer_ally = "rescued_ursaring"
VAR scout_intel = "listen"

-> descenso

=== descenso ===
Al otro lado del Atlántico, bajo los muelles sin ley de un puerto de Aztlán-Caribe donde los fugitivos compran pasaportes falsos, una escalera de hierro sudorosa desciende hacia una bóveda clandestina. El aire huele a salitre, hierro caliente y antorchas consumiéndose demasiado rápido. # bg: underground-ring # speaker: Narrador # char: prince # side: left # pokemon: none
Al fondo, entre jaulas estrechas y apuestas en voz baja que se apagan en cuanto cruzas el umbral, un hombre de abrigo raído y sonrisa delgada aplaude despacio desde el borde del cuadrilátero. # bg: underground-ring # speaker: Narrador # char: clandestine_tamer # side: right # pokemon: none
«Los informes de la guardia no exageraban.» Aprietas los puños al ver las marcas de golpes contra los barrotes. «Así que aquí es donde terminan los nobles que pierden el honor.» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: archaludon
«Honor...» Lord Vexen escupe la palabra contra la arena y golpea una jaula con su bastón; la bestia adentro ni siquiera retrocede, solo clava los ojos inyectados en sangre con un rencor mudo. «El cariño vuelve lentas a las criaturas, Alteza. El miedo y el odio puros, en cambio, hacen que un golpe ordinario parta hasta el acero... y atraviese incluso a las sombras.» # bg: underground-ring # speaker: Lord Vexen # char: clandestine_tamer # side: right # pokemon: none

* [Guardar silencio un instante y observar cómo da órdenes desde la orilla]
    ~ scout_intel = "listen"
    Notas cómo golpea dos veces el suelo con la punta del bastón antes de soltar una cápsula; su vanguardia responde al sonido tensando las garras para lanzar un golpe seco antes de que nadie reaccione. # bg: underground-ring # speaker: Narrador # char: prince # side: left # pokemon: gholdengo
    -> jaulas

* [Exigirle a gritos que suelte las cerraduras antes de que llegue la guardia]
    ~ scout_intel = "confront"
    Lord Vexen suelta una carcajada seca y apunta hacia el centro de la arena con el bastón. «¿Las llaves? Si tanto te duelen, ven a quitármelas sobre la tierra.» # bg: underground-ring # speaker: Lord Vexen # char: clandestine_tamer # side: right # pokemon: none
    -> jaulas

=== jaulas ===
A tu izquierda, un Ursaring lleno de cicatrices viejas apoya la frente contra los barrotes sin emitir sonido alguno. Cuando te acercas, sus ojos no muestran miedo ni afecto: solo una furia helada fija en el hombre del bastón. # bg: underground-ring # speaker: Narrador # char: prince # side: left # pokemon: ursaring
La cerradura de su jaula cede con un tirón. Tienes apenas un segundo para decidir si dejarlo entrar a cobrar su propia cuenta o apartarlo del ruido. # bg: underground-ring # speaker: Narrador # char: prince # side: left # pokemon: ursaring

* [Abrir la puerta de hierro y dejar que Ursaring entre primero contigo]
    ~ tamer_ally = "rescued_ursaring"
    La reja cruje al abrirse. Ursaring sale despacio, te mira un instante y luego gira hacia el cuadrilátero con el pelaje erizado. «Una última pelea bajo tus propios términos, amigo. Después nos vamos de este agujero.» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: ursaring
    -> combate

* [Indicarle que se quede atrás a salvo y abrir el duelo con Corviknight]
    ~ tamer_ally = "royal_corviknight"
    Apoyas una mano cautelosa en la reja para mantenerlo protegido a tu espalda. «Ya peleaste demasiado para él. Quédate atrás; Corviknight se hará cargo de este cuadrilátero.» # bg: underground-ring # speaker: Príncipe Heredero # char: prince # side: left # pokemon: corviknight
    -> combate

=== combate ===
Lord Vexen sonríe con crueldad y arroja su primera Poké Ball al centro de la tierra apisonada. Las antorchas chispean cuando el aire del foso se vuelve irrespirable. # bg: underground-ring # speaker: Narrador # char: clandestine_tamer # side: right # pokemon: none
-> END
