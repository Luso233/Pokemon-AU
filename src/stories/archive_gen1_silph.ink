VAR gen1_lead = "tauros"

-> camara_silph

=== camara_silph ===
En el nivel más hondo del Archivo Real de Galar, el zumbido eléctrico de un viejo monitor de fósforo verde rompe la penumbra. Sobre la consola descansa una cinta magnética sellada con el emblema descolorido de Silph Co. # bg: silph-archive # speaker: Narrador # char: royal_archivist # side: right # pokemon: mewtwo # mood: calm
El Archivista Real ajusta un interruptor metálico; la pantalla parpadea con líneas monocromáticas y una silueta psíquica inmóvil llena el cristal. # bg: silph-archive # speaker: Narrador # char: royal_archivist # side: right # pokemon: mewtwo # mood: calm
«Bienvenido a un recuerdo anterior a todas nuestras reglas modernas, Alteza.» Su voz suena reverente entre el zumbido de las cintas. «Aquí no existen objetos equipados ni habilidades ocultas; cada golpe depende del pulso puro, la velocidad y el temple de la vieja Kanto.» # bg: silph-archive # speaker: El Archivista Real # char: royal_archivist # side: right # pokemon: mewtwo # mood: confident
«Del otro lado del registro aguarda la anomalía genética que Silph Co. intentó enterrar en sus bóvedas: Mewtwo, acompañado por los ecos de aquella era. Para responderle, el archivo te entrega seis veteranos clásicos de Kanto.» # bg: silph-archive # speaker: El Archivista Real # char: royal_archivist # side: right # pokemon: mewtwo # mood: serious
Observas los seis perfiles parpadeando en verde sobre el tablero antiguo. Tienes apenas un instante para decidir quién cruzará primero la estática. # bg: silph-archive # speaker: Narrador # char: prince # side: left # pokemon: tauros # mood: confident

* [Abrir con Alakazam para responder con velocidad y presión mental desde el inicio]
    ~ gen1_lead = "alakazam"
    «Si la vieja Kanto pertenece a la velocidad y la mente, Alakazam dará el primer paso.» # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: alakazam # mood: confident
    -> inicio_gen1
* [Abrir con Tauros confiando en el peso imparable del viejo rey del llano]
    ~ gen1_lead = "tauros"
    «Tauros al frente. Si algo define aquella época, es no ceder un centímetro de terreno.» # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: tauros # mood: confident
    -> inicio_gen1
* [Abrir con Exeggutor buscando quebrar el ritmo enemigo desde el primer intercambio]
    ~ gen1_lead = "exeggutor"
    «Exeggutor primero. En un campo sin atajos, quien controle el ritmo manda la partida.» # bg: silph-archive # speaker: Príncipe Heredero # char: prince # side: left # pokemon: exeggutor # mood: confident
    -> inicio_gen1

=== inicio_gen1 ===
El carrete magnético gira con un chasquido seco y la silueta de Mewtwo abre los ojos al otro lado de la pantalla. # bg: silph-archive # speaker: Narrador # char: royal_archivist # side: right # pokemon: mewtwo # mood: confident
-> END
