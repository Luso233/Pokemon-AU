VAR puzzle2_lead = "dragapult_farigiraf"

-> camara_sellada

=== camara_sellada ===
Las puertas rúnicas de la cámara subterránea se abren con un estruendo grave que suelta polvo centenario del techo. En la oscuridad helada, seis puntos de luz se encienden uno tras otro y el suelo entero retumba con un solo paso. # bg: titan-sanctum # speaker: Narrador # char: prince # side: left # pokemon: none
Al centro del santuario se alza Regigigas. No parece adormecido ni lento: las marcas antiguas en su torso ya palpitan a pleno ritmo, envueltas en un velo traslúcido, anillos de agua y raíces luminosas que beben directamente de la piedra. # bg: titan-sanctum # speaker: Narrador # char: colossus_keeper # side: right # pokemon: regigigas
«Llegaste tarde, heredero.» El Custodio inclina la capucha desde el altar superior mientras cinco siluetas menores se arrodillan en círculo alrededor del coloso. «El despertar ya terminó. Ahora la cámara entera respira para mantenerlo en pie.» # bg: titan-sanctum # speaker: Custodio del Coloso # char: colossus_keeper # side: right # pokemon: regigigas
El aire vibra con una presión casi física. Golpear a ciegas a un titán así solo servirá para ver cómo sus heridas se cierran una y otra vez. # bg: titan-sanctum # speaker: Narrador # char: prince # side: left # pokemon: dragapult
Miras tus seis Poké Balls. Cada compañero del escuadrón domina un recurso distinto para desarmar el ritual; solo queda elegir quién cruza primero el umbral. # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: farigiraf

* [Entrar con Dragapult y Farigiraf para cortar el pulso del santuario desde el inicio]
    ~ puzzle2_lead = "dragapult_farigiraf"
    «Dragapult, Farigiraf, conmigo al frente. No dejemos que el ritmo de la cámara nos envuelva.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: dragapult
    -> inicio_puzzle

* [Entrar con Murkrow y Weavile para deshacer los velos que cubren al coloso]
    ~ puzzle2_lead = "murkrow_weavile"
    «Murkrow, Weavile, abran paso. Primero desmontemos las capas que lo protegen.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: murkrow
    -> inicio_puzzle

* [Entrar con Urshifu y Farigiraf buscando quebrar su guardia a fuerza pura]
    ~ puzzle2_lead = "urshifu_farigiraf"
    «Urshifu, Farigiraf, al frente. Si un muro se niega a ceder, buscaremos la grieta directa.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: urshifu
    -> inicio_puzzle

=== inicio_puzzle ===
El Custodio levanta el báculo de piedra y el rugido mecánico de Regigigas sacude las columnas del templo. # bg: titan-sanctum # speaker: Narrador # char: colossus_keeper # side: right # pokemon: regigigas
-> END
