VAR triad_ace = "charizard"

-> patio_juicio

=== patio_juicio ===
El acantilado helado del Estrecho Austral, en Cordelia, huele a viento salado, pomada de bigote y hierro recién aceitado. A lo lejos brillan las balizas de la base naval de Galar en las Islas Bruma. De la neblina desembarcan tres moles acorazadas marchando al unísono —y cuando se detienen en media luna, el contraste te deja sin palabras. # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: none # mood: serious
Los tres están ridículamente fornidos dentro de armaduras pesadas... pero traen bigotes tan orgullosos y expresivos que parecen hermanos de feria disfrazados de sus propios Pokémon: uno chaparro y ancho en rojo carmesí con lanza de justa, uno alto y recto en verde esmeralda con escudo dorado, y uno larguirucho y burlón en acero oscuro con alabarda. # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: none # mood: serious
«¡WAAAH-JAJA! ¡Aquí estamos, Alteza! ¡Sir Caín, el Toro Carmesí, el ariete imparable de la guarnición!» El caballero rojo golpea su pecho acorazado con tanto entusiasmo que casi le tira el yelmo al de al lado, haciendo vibrar la pluma roja exactamente igual que la cresta de un Escavalier. «¡Mi Escavalier y yo cargamos primero y preguntamos después! ¡Nadie frena una embestida frontal con este bigote!» # bg: triad-arena # speaker: Sir Caín # char: knight_cain # side: right # pokemon: escavalier # mood: confident
«Caín, por el amor de la Corona, mantén la línea media y deja de presumir la lanza antes de sonar la campana...» El paladín del centro —Sir Abel, el Muro Esmeralda— se alisa el bigote castaño impecable con un suspiro cansado y clava su espadón de Aegislash en la piedra. «Disculpe el espectáculo, Alteza. Somos los Tres Jinetes de la Guarnición. Si pretende cruzar hacia el Consejo, la ley marcial dicta que sostenga el centro con un solo campeón contra los tres a la vez.» # bg: triad-arena # speaker: Sir Abel # char: knight_abel # side: right # pokemon: aegislash # mood: serious
«¡Jejejeje! ¡Qué aburrido eres, Abelito! ¡Déjalo pasar y yo le corto el paso por la espalda!» El tercero, Sir Frey —delgado, altísimo, encorvado sobre su alabarda con un bigote puntiagudo retorcido hacia arriba y la sonrisa más mezquina del hemisferio sur— señala su Poké Ball negra con un gesto teatral. «Yo soy Sir Frey, la Hoja Siniestra. Mientras mi hermanito verde alza su escudito y el gordito rojo corre como loco, mi Bisharp y yo esperamos el segundo exacto en que bajes la guardia... ¡WAH!» # bg: triad-arena # speaker: Sir Frey # char: knight_frey # side: right # pokemon: bisharp # mood: smug
«¡¿A quién le dijiste gordito, palo de escoba con armadura?! ¡Es pura masa muscular!» # bg: triad-arena # speaker: Sir Caín # char: knight_cain # side: right # pokemon: escavalier # mood: fierce
«¡Suficiente los dos! ¡Firmes, formación en media luna!» Sir Abel golpea su escudo dorado contra el suelo marcando un compás marcial estricto —abre la guardia, resiste, respira un turno y vuelve a alzar el muro—. A su izquierda, Sir Frey ni siquiera da un paso al frente, con los dedos quietos sobre la empuñadura esperando a que tú lances el primer ataque. # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: none # mood: serious
«Solo un campeón al centro del círculo contra los tres, heredero.» Sir Abel inclina la cabeza con respeto serio, mientras Sir Caín ruge entusiasmado y Sir Frey se frota las manos. «Elija bien con quién nos va a enfrentar.» # bg: triad-arena # speaker: Sir Abel # char: knight_abel # side: right # pokemon: aegislash # mood: confident
Solo puedes elegir un compañero para ocupar el centro del círculo de piedra frente a Caín, Abel y Frey. # bg: triad-arena # speaker: Narrador # char: prince # side: left # pokemon: charizardmegay # mood: serious

* [Enviar a Charizard al centro y disputar el círculo con fuego y cielo]
    ~ triad_ace = "charizard"
    «Charizard, toma el centro. Caín cargará sin freno, Abel marcará el compás del escudo y Frey esperará para contraatacar: ¡que el fuego quiebre su formación!» # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: charizardmegay # mood: confident
    -> inicio_juicio
* [Enviar a Garchomp al centro y hacer temblar las losas bajo sus botas]
    ~ triad_ace = "garchomp"
    «Garchomp, al centro del patio. Si presumen tanta armadura pesada, hagamos que la piedra misma juegue en su contra.» # bg: triad-arena # speaker: Príncipe Heredero # char: prince # side: left # pokemon: garchomp # mood: confident
    -> inicio_juicio

=== inicio_juicio ===
«¡ESO ES! ¡POR EL BIGOTE Y LA LANZA!» — «¡En guardia, hermanos!» — «¡Jeje, ya verás cuando mi Bisharp te agarre descuidado!» Las tres armas descienden al unísono apuntando al centro de la arena. ¡El Juicio de Caín, Abel y Frey ha comenzado! # bg: triad-arena # speaker: Narrador # char: triad_knights # side: right # pokemon: none # mood: serious
-> END
