VAR steel_doctrine = "scarf_gholdengo"

-> campo_estandartes

=== campo_estandartes ===
El viento de las tierras altas hace restallar los estandartes de acero dorado frente a los pendones negros de la Casa Rebelde. Ningún tambor suena: en el viejo protocolo de Galar, los duelos entre linajes se libran bajo el silencio del cielo gris. # bg: banner-battlefield # speaker: Narrador # char: prince # side: left # pokemon: corviknight # mood: serious
El decreto antiguo no admite excepciones. Cada casa debe responder únicamente con Pokémon que compartan el linaje de su insignia: Acero por la Corona, Siniestro por la rebelión. # bg: banner-battlefield # speaker: Narrador # char: dark_commander # side: right # pokemon: none # mood: ominous
Al otro lado del llano, el Comandante Siniestro ajusta sus anteojos con guantes negros y apoya el peso en su bastón de cráneo, estudiando tu línea con cortesía glacial. # bg: banner-battlefield # speaker: Narrador # char: dark_commander # side: right # pokemon: none # mood: smug
«Acero real contra estandarte negro, Alteza. Veamos si su armadura reluciente sigue pesando igual cuando el terreno empiece a morderles los talones.» # bg: banner-battlefield # speaker: Comandante Siniestro # char: dark_commander # side: right # pokemon: none # mood: smug
Corviknight abre ligeramente las alas detrás de ti mientras Heatran respira brasas lentas contra la neblina. El frío del páramo te obliga a decidir el pulso con el que abrirá tu casa antes de mostrar los seis estandartes. # bg: banner-battlefield # speaker: Narrador # char: prince # side: left # pokemon: gholdengo # mood: serious

* [Apostar por la iniciativa rápida y golpes cortantes antes de que se organicen]
    ~ steel_doctrine = "scarf_gholdengo"
    «No les dejemos dictar el ritmo del llano. Si nos movemos primero, sus trucos se quedan a mitad del gesto.» # bg: banner-battlefield # speaker: Príncipe Heredero # char: prince # side: left # pokemon: scizor # mood: confident
    -> cierre_monotype
* [Cerrar filas con peso defensivo y desgastarlos hasta que se rompan solos]
    ~ steel_doctrine = "bulky_steel"
    «El acero no se dobla en la primera carga. Aguantemos su ímpetu y dejemos que se estrellen contra nuestra muralla.» # bg: banner-battlefield # speaker: Príncipe Heredero # char: prince # side: left # pokemon: heatran # mood: confident
    -> cierre_monotype

=== cierre_monotype ===
El heraldo deja caer el pañuelo blanco. Los seis representantes de cada casa quedan a la vista sobre el páramo, esperando tu señal para elegir quién dará el primer paso. # bg: banner-battlefield # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious
-> END
