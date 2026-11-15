# vintagelens

Eestikeelne staatiline veebirakendus, millega saab objektiivi nime järgi Flickr-ist näidisfotosid otsida.

Otsing kasutab Flickr-i avalikku JSONP-fotovoogu. Kõigepealt otsitakse kõigi sisestatud märksõnade ühist vastet. Kui täpseid vasteid ei ole, laiendatakse otsingut ning tulemused järjestatakse nime ja Flickr-i märksõnade kattuvuse järgi. Flickr-i avalik voog ei väljasta meeldimiste ega `interestingness` skoori, seega näitab rakendus parimaid otsinguvasteid, mitte populaarsuse edetabelit.

## Kohalik käivitamine

Ava `dist/index.html` veebibrauseris või serveeri `dist` kausta mistahes staatilise HTTP-serveriga. Rakendusel puuduvad ehitussamm ja paketisõltuvused.

## Fotoallikad

Kõik dünaamilised tulemused pärinevad Flickr-ist ja avanevad algsel Flickr-i fotolehel. Fotode õigused kuuluvad nende autoritele.
