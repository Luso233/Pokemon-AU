VAR puzzle2_lead = "dragapult_farigiraf"

-> camara_sellada

=== camara_sellada ===
Las puertas rúnicas de la cámara subterránea se abren con un estruendo grave que suelta polvo milenario del techo. En la penumbra helada, seis puntos de luz se encienden uno tras otro... y una segunda silueta, casi igual de inmensa, da un paso hacia adelante. # bg: titan-sanctum # speaker: Narrador # char: prince # side: left # pokemon: none
No es un humano. Es un ente colosal, pálido como el mármol antiguo, cubierto de musgo vivo, runas incandescentes grabadas en la piel y hombreras de piedra incrustadas con las mismas gemas del titán. Sus ojos dorados te observan con una lucidez serena y abrumadora. # bg: titan-sanctum # speaker: Narrador # char: colossus_keeper # side: right # pokemon: none
En su mano derecha gira suspendida una llave rúnica radiante; en la izquierda descansa un martillo de piedra capaz de quebrar columnas. Detrás de él, Regigigas ya está de pie, libre de su sopor ancestral, envuelto en anillos de agua, raíces vivas y un velo traslúcido que late al ritmo de la cámara. # bg: titan-sanctum # speaker: Narrador # char: colossus_keeper # side: right # pokemon: regigigas
«Llegas tarde, hijo de reyes.» Su voz no suena a furia ni a locura, sino a la calma pesada de las montañas que vieron nacer los continentes. «He girado la llave. Las ataduras que adormecían al Coloso ya no existen.» # bg: titan-sanctum # speaker: Guardián del Coloso # char: colossus_keeper # side: right # pokemon: regigigas
Cinco presencias menores flotan en silencio alrededor del santuario, respondiendo a un leve movimiento de los dedos del Guardián. «No te subestimo, mortal. Si tu mente es tan afilada como presumen las coronas, desarma cada capa de mi obra antes de que el peso del titán te aplaste.» # bg: titan-sanctum # speaker: Guardián del Coloso # char: colossus_keeper # side: right # pokemon: regigigas
El aire vibra con una presión casi física. Golpear a ciegas a una fortaleza así solo servirá para ver cómo sus heridas se cierran una y otra vez. Miras tus seis Poké Balls: solo queda decidir quién cruza primero el umbral. # bg: titan-sanctum # speaker: Narrador # char: prince # side: left # pokemon: dragapult

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
El Guardián alza la llave rúnica hacia la bóveda; las cadenas ancestrales se deshacen en polvo luminoso y el rugido de Regigigas sacude todo el santuario. # bg: titan-sanctum # speaker: Narrador # char: colossus_keeper # side: right # pokemon: regigigas
-> END
