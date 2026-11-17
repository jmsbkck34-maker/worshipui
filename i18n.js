/* WorshipUI interface language: English (as written) or Spanish.
   Translates interface text in place and restores it when switching back. Slide content, item titles,
   lyrics, Scripture and anything typed into fields are never translated. */
(function(root){
 const es={
  // Header, service list and editor
  'WorshipUI · Service workspace':'WorshipUI · Espacio del servicio','SUNDAY WORKSPACE':'ESPACIO DEL DOMINGO','Saved on this device':'Guardado en este equipo',
  'Settings':'Configuración','Export':'Exportar','Import':'Importar','↗ Audience':'↗ Audiencia','↗ Stage':'↗ Escenario',
  'SETLIST CALENDAR':'CALENDARIO DE SERVICIOS','Open date':'Abrir fecha','Copy to date':'Copiar a fecha','Undated service':'Servicio sin fecha',
  'YOUR SERVICE':'TU SERVICIO','A little preparation. A peaceful Sunday.':'Un poco de preparación. Un domingo en paz.','ORDER OF SERVICE':'ORDEN DEL SERVICIO',
  '＋ Add service item':'＋ Agregar elemento','Local workspace · works offline':'Espacio local · funciona sin conexión','Keep a backup with Export.':'Guarda una copia con Exportar.',
  'PREPARE & PRESENT':'PREPARAR Y PRESENTAR','Edit item':'Editar elemento','Choose a slide, then take it live':'Elige una diapositiva y luego ponla en vivo',
  'Edit slide template':'Editar plantilla de diapositivas','Background and text for this item':'Fondo y texto de este elemento','Set selected slide section':'Asignar sección a la diapositiva',
  'Selected slide shows on':'La diapositiva seleccionada se muestra en','All screens':'Todas las pantallas','Screen 1 only':'Solo pantalla 1','Screen 2 only':'Solo pantalla 2',
  'Use for every slide in this item':'Usar en todas las diapositivas de este elemento','Room to focus on worship.':'Espacio para concentrarse en la adoración.',
  'Arrow keys move the preview. Double-click a slide or press Space to take it live; Space then advances the live slide. B blacks out the screen.':'Las flechas mueven la vista previa. Haz doble clic en una diapositiva o pulsa Espacio para ponerla en vivo; Espacio luego avanza la diapositiva en vivo. B oscurece la pantalla.',
  'PREVIEW':'VISTA PREVIA','NOT ON SCREEN':'NO EN PANTALLA','Take live':'Poner en vivo','Space →':'Espacio →','LIVE OUTPUT':'SALIDA EN VIVO','READY':'LISTO','ON SCREEN':'EN PANTALLA','BLACKOUT':'PANTALLA NEGRA','TEXT CLEARED':'TEXTO BORRADO',
  '← Previous':'← Anterior','Next →':'Siguiente →','Clear lyrics':'Borrar letra','Blackout':'Pantalla negra','Audience screens':'Pantallas de audiencia','Screen 1':'Pantalla 1','Screen 2':'Pantalla 2',
  'Both languages':'Ambos idiomas','First language':'Primer idioma','Second language':'Segundo idioma','Open':'Abrir',
  'With two projectors, show English on one and Spanish on the other. Slides can also be sent to one screen only.':'Con dos proyectores, muestra inglés en uno y español en el otro. También puedes enviar diapositivas a una sola pantalla.',
  'Before you begin':'Antes de comenzar','Open Audience, move that window to your projector, then enter fullscreen. Open Stage for current and next text.':'Abre Audiencia, mueve esa ventana al proyector y activa pantalla completa. Abre Escenario para ver el texto actual y el siguiente.',
  'Build your service':'Arma tu servicio','Start with a song or welcome':'Comienza con un canto o una bienvenida','Your service is empty. Add an item to begin.':'Tu servicio está vacío. Agrega un elemento para comenzar.',
  'Main language':'Idioma principal','Service title':'Título del servicio','Service order':'Orden del servicio','Previous slide':'Diapositiva anterior','Screen 1 shows':'La pantalla 1 muestra','Screen 2 shows':'La pantalla 2 muestra',
  'End of item':'Fin del elemento','Not saved — use Back up':'No guardado: usa Copia de seguridad','Storage unavailable. Use Back up to keep a copy.':'Almacenamiento no disponible. Usa Copia de seguridad para guardar una copia.',
  'Song':'Canto','Scripture':'Escritura','Announcement':'Anuncio','Sermon':'Sermón','New service':'Nuevo servicio',
  // Slide template dialog
  'SLIDE APPEARANCE':'APARIENCIA DE LAS DIAPOSITIVAS','Applies to all slides in this item. Your live screen changes only when you choose Take live.':'Se aplica a todas las diapositivas de este elemento. La pantalla en vivo solo cambia al elegir Poner en vivo.',
  'Motion backgrounds':'Fondos en movimiento','Animate background':'Animar fondo','Gentle built-in loops · work offline. Reduced-motion settings keep them still.':'Bucles suaves incluidos · funcionan sin conexión. La opción de movimiento reducido los mantiene quietos.',
  'Background':'Fondo','Color wheel':'Rueda de color','⌖ Pick screen color':'⌖ Tomar color de la pantalla','Import image':'Importar imagen','Remove image':'Quitar imagen',
  'PNG, JPEG or WebP · saved with your service for offline use.':'PNG, JPEG o WebP · se guarda con tu servicio para usar sin conexión.','Text':'Texto','Font':'Fuente','Font size':'Tamaño de fuente',
  'Size is measured on a 1920-pixel-wide slide and scales with your screen. Fonts marked “included” are bundled for offline use. Other fonts use those installed on each computer.':'El tamaño se mide en una diapositiva de 1920 píxeles de ancho y se ajusta a tu pantalla. Las fuentes marcadas como “incluida” vienen con la app para usar sin conexión. Las demás usan las instaladas en cada equipo.',
  'Text position':'Posición del texto','Left – right':'Izquierda – derecha','Up – down':'Arriba – abajo','Box width':'Ancho del cuadro','Center text':'Centrar texto',
  'Drag the text on the preview, or use the sliders. Applies to every slide in this item.':'Arrastra el texto en la vista previa o usa los controles. Se aplica a todas las diapositivas de este elemento.',
  'Drag to move the text box':'Arrastra para mover el cuadro de texto','Verses':'Versículos','All verses on one slide':'Todos los versículos en una diapositiva','One verse per slide':'Un versículo por diapositiva','Done':'Listo',
  'Imported image':'Imagen importada','Gradient background':'Fondo degradado','Add an item to edit its template':'Agrega un elemento para editar su plantilla','Pick a color from your screen':'Toma un color de tu pantalla',
  'This passage was combined before verses could be split again. Re-add it to show one verse per slide.':'Este pasaje se combinó antes de que los versículos pudieran separarse. Agrégalo de nuevo para mostrar un versículo por diapositiva.',
  'This item has a single slide.':'Este elemento tiene una sola diapositiva.','Showing one verse per slide.':'Mostrando un versículo por diapositiva.',
  'The combined passage exceeds 20,000 characters. Keep one verse per slide.':'El pasaje combinado supera los 20.000 caracteres. Mantén un versículo por diapositiva.','Unable to change the verse layout.':'No se pudo cambiar la distribución de versículos.',
  'Choose a font size between 24 and 200.':'Elige un tamaño de fuente entre 24 y 200.','This service is too large. Use a smaller background image.':'Este servicio es demasiado grande. Usa una imagen de fondo más pequeña.',
  'Unable to save the template. Use Back up or use a smaller image.':'No se pudo guardar la plantilla. Usa Copia de seguridad o usa una imagen más pequeña.','Could not pick that color. Use the color picker instead.':'No se pudo tomar ese color. Usa el selector de color.',
  'Preparing image for offline use…':'Preparando la imagen para usar sin conexión…','Choose a PNG, JPEG or WebP image under 10 MB.':'Elige una imagen PNG, JPEG o WebP de menos de 10 MB.','Choose an image smaller than 50 megapixels.':'Elige una imagen de menos de 50 megapíxeles.',
  'That image is too detailed. Choose a smaller image.':'Esa imagen es demasiado detallada. Elige una más pequeña.','Image saved with the service for offline use.':'Imagen guardada con el servicio para usar sin conexión.','Image not saved.':'Imagen no guardada.',
  // Song sections
  'Song slide section':'Sección de la diapositiva','This label is for the editor only; it will not appear on the audience or stage display.':'Esta etiqueta es solo para el editor; no aparece en la pantalla de audiencia ni de escenario.',
  'Section':'Sección','No label':'Sin etiqueta','Verse':'Estrofa','Verse 1':'Estrofa 1','Verse 2':'Estrofa 2','Verse 3':'Estrofa 3','Verse 4':'Estrofa 4','Chorus':'Coro','Pre-Chorus':'Pre-coro','Bridge':'Puente',
  'Intro':'Introducción','Outro':'Final','Tag':'Tag','Instrumental':'Instrumental','Custom':'Personalizada','Custom section':'Sección personalizada','Cancel':'Cancelar','Save section':'Guardar sección',
  'The song slide is no longer available.':'La diapositiva del canto ya no está disponible.','Enter a section name of up to 50 characters.':'Escribe un nombre de sección de hasta 50 caracteres.',
  'Some section labels cannot be matched to the changed slides. Continue without those labels?':'Algunas etiquetas de sección no coinciden con las diapositivas cambiadas. ¿Continuar sin esas etiquetas?',
  // Settings
  'CHURCH & CONTENT SOURCES':'IGLESIA Y FUENTES DE CONTENIDO','Church branding':'Identidad de la iglesia',
  'Branding was changed on another computer while you had unsaved changes. Choose which to keep.':'La identidad se cambió en otro equipo mientras tenías cambios sin guardar. Elige cuál conservar.',
  'Use shared branding':'Usar la identidad compartida','Keep mine and share it':'Conservar la mía y compartirla','Church name':'Nombre de la iglesia','Address':'Dirección','No logo':'Sin logotipo',
  'Upload logo':'Subir logotipo','Remove logo':'Quitar logotipo','Show logo on the audience screen during blackout':'Mostrar el logotipo en la pantalla de audiencia durante la pantalla negra','Save branding':'Guardar identidad',
  'Shared with your other computers when signed in.':'Se comparte con tus otros equipos al iniciar sesión.','Grace Community Church':'Iglesia Comunidad de Gracia','Street, city, state':'Calle, ciudad, estado',
  'Second language':'Segundo idioma','Default second translation':'Segunda traducción predeterminada','Used for the second translation when choosing Scripture.':'Se usa para la segunda traducción al elegir la Escritura.',
  'Second language saved on this device.':'Segundo idioma guardado en este equipo.','Spanish is the main language, so the second language is English.':'El español es el idioma principal, así que el segundo idioma es inglés.',
  'Could not save the language setting on this device.':'No se pudo guardar el idioma en este equipo.',
  'SongSelect opens the CCLI service for lyrics. Bible text can be pasted or imported from a source you are authorized to use. WorshipUI does not sign in or fetch licensed text.':'SongSelect abre el servicio de letras de CCLI. El texto bíblico se puede pegar o importar de una fuente autorizada. WorshipUI no inicia sesión ni descarga textos con licencia.',
  'Lyrics':'Letras','Included with an active Church Copyright License':'Incluido con una Church Copyright License activa',
  'SongSelect provides lyrics to eligible CCLI license holders. Sign in at CCLI to search and retrieve songs; WorshipUI links there and does not import lyrics automatically.':'SongSelect ofrece letras a quienes tienen licencia CCLI. Inicia sesión en CCLI para buscar cantos; WorshipUI enlaza allí y no importa letras automáticamente.',
  'Open SongSelect':'Abrir SongSelect','Bible text providers':'Proveedores de texto bíblico','Free starter · licensed texts':'Plan inicial gratuito · textos con licencia',
  'Starter includes up to three licensed Bibles for non-commercial use and 5,000 calls per month. Commercial access and further use require the applicable license; its terms include storage and copy restrictions.':'El plan inicial incluye hasta tres Biblias con licencia para uso no comercial y 5.000 consultas al mes. El uso comercial o adicional requiere la licencia correspondiente; sus términos limitan el almacenamiento y la copia.',
  'Read API docs & terms':'Leer documentación y términos','Free non-commercial use':'Uso no comercial gratuito','Requires an API key and attribution. Local caching is limited to 500 verses; follow Crossway’s full terms.':'Requiere una clave de API y atribución. El almacenamiento local se limita a 500 versículos; sigue los términos completos de Crossway.',
  'Read ESV API terms':'Leer términos de la API ESV','Free downloads · rights vary':'Descargas gratuitas · los derechos varían','Offers downloadable Bible files in multiple formats. Check the rights and territory for the specific translation you import.':'Ofrece Biblias descargables en varios formatos. Revisa los derechos y el territorio de la traducción que importes.',
  'Browse Bible downloads':'Ver descargas de Biblias','CCLI license registrations':'Registros de licencias CCLI',
  'Store your church’s license numbers on this device. When set, the Church Copyright License number appears on Song slides; other numbers are not printed. Keep required song title, writer, and copyright notices with the lyrics.':'Guarda los números de licencia de tu iglesia en este equipo. Si está configurado, el número de la Church Copyright License aparece en las diapositivas de cantos; los demás números no se muestran. Conserva el título, los autores y los avisos de derechos con la letra.',
  'Church Copyright License number':'Número de Church Copyright License','Streaming License number':'Número de Streaming License','Streaming Plus License number':'Número de Streaming Plus License','Rehearsal License number':'Número de Rehearsal License',
  'Save CCLI numbers':'Guardar números CCLI','Saved on this device only; not included in service exports or sync.':'Solo se guarda en este equipo; no se incluye en exportaciones ni sincronización.',
  'Import Scripture':'Importar Escritura','The text must come from a source you are authorized to use. Paste it or import a text, CSV, USFM, or USX file; imported text is saved with this service.':'El texto debe venir de una fuente autorizada. Pégalo o importa un archivo de texto, CSV, USFM o USX; el texto importado se guarda con este servicio.',
  'Bible version':'Versión de la Biblia','Passage reference (optional)':'Referencia del pasaje (opcional)','Scripture text':'Texto de la Escritura','Or import a Scripture file':'O importa un archivo de Escritura',
  'English-only list: nine English entries from the ECPA 2025 bestseller top ten, with The Message in place of the Spanish Reina-Valera. This is not a strict sales ranking.':'Lista solo en inglés: nueve versiones del top diez de ventas ECPA 2025, con The Message en lugar de la Reina-Valera. No es una clasificación exacta de ventas.',
  'Slide layout':'Distribución de diapositivas','All verses on one slide · auto-fit text':'Todos los versículos en una diapositiva · texto ajustado',
  'Second translation / language (optional)':'Segunda traducción / idioma (opcional)','Second translation text':'Texto de la segunda traducción','Or import the second translation file':'O importa el archivo de la segunda traducción',
  'Optional: use blank lines to align each slide in both languages.':'Opcional: usa líneas en blanco para alinear cada diapositiva en ambos idiomas.','Choose a version, then paste or select a file.':'Elige una versión y luego pega o selecciona un archivo.',
  'Add Scripture to service':'Agregar Escritura al servicio','e.g. John 3:16–17':'p. ej. Juan 3:16–17','Paste authorized text here. Separate slides or verses with a blank line.':'Pega aquí texto autorizado. Separa diapositivas o versículos con una línea en blanco.',
  'e.g. Reina-Valera 1960':'p. ej. Reina-Valera 1960','Paste the same passage in the second language. Separate matching verses with blank lines.':'Pega el mismo pasaje en el segundo idioma. Separa los versículos correspondientes con líneas en blanco.',
  'License numbers must be 80 characters or fewer.':'Los números de licencia deben tener 80 caracteres o menos.','Enter both a second translation name and its text.':'Escribe el nombre de la segunda traducción y su texto.',
  'Reading Scripture file…':'Leyendo el archivo de Escritura…','Choose a text file under 5 MB.':'Elige un archivo de texto de menos de 5 MB.','Could not read that Scripture file.':'No se pudo leer ese archivo de Escritura.',
  'Reading second translation file…':'Leyendo el archivo de la segunda traducción…','Shorten the passage reference to 90 characters or fewer.':'Acorta la referencia del pasaje a 90 caracteres o menos.','Could not add that Scripture passage.':'No se pudo agregar ese pasaje.',
  'Keep the name under 100 characters and the address under 300.':'Usa menos de 100 caracteres para el nombre y 300 para la dirección.','Branding could not be saved on this device.':'No se pudo guardar la identidad en este equipo.',
  'Branding saved on this device. It is shared with your other computers when signed in.':'Identidad guardada en este equipo. Se comparte con tus otros equipos al iniciar sesión.','Choose a PNG, JPEG or WebP logo under 10 MB.':'Elige un logotipo PNG, JPEG o WebP de menos de 10 MB.',
  'That logo is too detailed. Choose a smaller image.':'Ese logotipo es demasiado detallado. Elige una imagen más pequeña.','Logo ready. Choose Save branding to keep it.':'Logotipo listo. Elige Guardar identidad para conservarlo.','Could not read that logo.':'No se pudo leer ese logotipo.',
  'Using the shared branding.':'Usando la identidad compartida.','Keeping your branding and sharing it.':'Conservando tu identidad y compartiéndola.','Branding changed on another computer · choose which to keep.':'La identidad cambió en otro equipo · elige cuál conservar.',
  'Logo removed. Choose Save branding to keep this change.':'Logotipo quitado. Elige Guardar identidad para conservar el cambio.','Could not save the screen setting on this device.':'No se pudo guardar la configuración de pantalla en este equipo.',
  'Spanish (Español)':'Español','French (Français)':'Francés (Français)','Portuguese (Português)':'Portugués (Português)','German (Deutsch)':'Alemán (Deutsch)','Chinese (中文)':'Chino (中文)','Korean (한국어)':'Coreano (한국어)',
  'Vietnamese (Tiếng Việt)':'Vietnamita (Tiếng Việt)','Tagalog':'Tagalo','Arabic (العربية)':'Árabe (العربية)','Russian (Русский)':'Ruso (Русский)','English':'Inglés',
  // Item dialog, songs and Scripture picker
  'Delete item':'Eliminar elemento','Save item':'Guardar elemento','SERVICE ITEM':'ELEMENTO DEL SERVICIO','Add to your service':'Agregar a tu servicio','Edit service item':'Editar elemento del servicio','Type':'Tipo',
  'Find a song or template':'Buscar un canto o plantilla','Search saved songs':'Buscar cantos guardados','Import a song file':'Importar archivo de canto','Open song folder':'Abrir carpeta de cantos',
  'Search saved songs, import an authorized file, or enter a new song below.':'Busca cantos guardados, importa un archivo autorizado o escribe un canto nuevo abajo.','Song title or lyrics':'Título o letra del canto',
  'Choose Scripture':'Elegir Escritura','Version':'Versión','Book':'Libro','Chapter':'Capítulo','First verse':'Primer versículo','Last verse':'Último versículo','YouVersion translation':'Traducción de YouVersion',
  'Open passage in YouVersion':'Abrir pasaje en YouVersion','Paste the verses copied from YouVersion':'Pega los versículos copiados de YouVersion',
  'Verse numbers in the pasted text give one slide per verse; without them the passage becomes one auto-fit slide. Check the translation’s copyright terms for projection and streaming.':'Con números de versículo, el texto pegado da una diapositiva por versículo; sin ellos, el pasaje queda en una sola diapositiva ajustada. Revisa los derechos de la traducción para proyección y transmisión.',
  'On bible.com, select the verses (include the verse numbers for one slide per verse), copy, then paste here.':'En bible.com, selecciona los versículos (incluye los números para una diapositiva por versículo), cópialos y pégalos aquí.',
  '+ Add second language':'+ Agregar segundo idioma','Add selected passage':'Agregar pasaje seleccionado','Add pasted passage':'Agregar pasaje pegado',
  'Choose a book, chapter and verse range. When editing, selection fills the item for review.':'Elige libro, capítulo y versículos. Al editar, la selección llena el elemento para revisarlo.',
  'Title':'Título','Title (optional)':'Título (opcional)','Slide text':'Texto de las diapositivas','Save song to library':'Guardar canto en la biblioteca','Primary translation / version':'Traducción / versión principal','Second translation / language':'Segunda traducción / idioma',
  'Both translations appear side by side. Leave the second translation blank for a single-language slide.':'Ambas traducciones aparecen lado a lado. Deja la segunda en blanco para una diapositiva en un solo idioma.',
  'Separate slides with a blank line. Use lyrics and Bible translations you have permission to display.':'Separa las diapositivas con una línea en blanco. Usa letras y traducciones que tengas permiso de mostrar.',
  'Enter lyrics or text. Separate slides with a blank line.':'Escribe la letra o el texto. Separa las diapositivas con una línea en blanco.','Separate matching verses with blank lines.':'Separa los versículos correspondientes con líneas en blanco.',
  'Saved song library is invalid.':'La biblioteca de cantos guardada no es válida.','Could not read the song library.':'No se pudo leer la biblioteca de cantos.','The song library has reached its limit or contains invalid songs.':'La biblioteca de cantos llegó a su límite o tiene cantos no válidos.',
  'Search by title or lyrics to find saved songs.':'Busca por título o letra para encontrar cantos guardados.','No saved songs match. Import a file or save a song below.':'Ningún canto guardado coincide. Importa un archivo o guarda un canto abajo.',
  'Enter a song title and slide text first.':'Primero escribe el título del canto y el texto.','Song saved to this device’s library.':'Canto guardado en la biblioteca de este equipo.','Could not save this song.':'No se pudo guardar este canto.',
  'Choose a song file under 5 MB.':'Elige un archivo de canto de menos de 5 MB.','The song library has reached its limit or the imported song is invalid.':'La biblioteca de cantos llegó a su límite o el canto importado no es válido.','Could not import that song.':'No se pudo importar ese canto.',
  'Save SongSelect downloads here, then import the file above.':'Guarda aquí las descargas de SongSelect y luego importa el archivo arriba.','Unknown Bible version.':'Versión de la Biblia desconocida.',
  'Each slide needs a verse reference such as “John 3:16 · KJV”. Choose the passage above to add one.':'Cada diapositiva necesita una referencia como “Juan 3:16 · RVR1909”. Elige el pasaje arriba para agregarla.',
  'Could not add the second language.':'No se pudo agregar el segundo idioma.','Copy the verses on bible.com (with verse numbers), then paste them below.':'Copia los versículos en bible.com (con números) y pégalos abajo.',
  'Could not open YouVersion.':'No se pudo abrir YouVersion.','Allow pop-ups to open YouVersion.':'Permite ventanas emergentes para abrir YouVersion.',
  'The combined passage exceeds 20,000 characters. Choose one verse per slide.':'El pasaje combinado supera los 20.000 caracteres. Elige un versículo por diapositiva.','Add this passage and discard the unsaved item text?':'¿Agregar este pasaje y descartar el texto sin guardar?',
  'Could not add that passage.':'No se pudo agregar ese pasaje.','The selected passage is unavailable.':'El pasaje seleccionado no está disponible.','Choose a valid verse range.':'Elige un rango de versículos válido.',
  'Paste the passage copied from YouVersion first.':'Primero pega el pasaje copiado de YouVersion.',
  'Enter a title (optional for Scripture) and 1–200 slides, with fewer than 20,000 characters per slide.':'Escribe un título (opcional para la Escritura) y de 1 a 200 diapositivas, con menos de 20.000 caracteres cada una.',
  'This service has reached the 200-item limit.':'Este servicio llegó al límite de 200 elementos.','Keep translation names under 80 characters.':'Usa menos de 80 caracteres para los nombres de las traducciones.',
  'Enter the primary and secondary translation names and both Scripture texts.':'Escribe los nombres de ambas traducciones y los dos textos.','Could not read the second translation.':'No se pudo leer la segunda traducción.',
  'Both translations must have the same number of slides.':'Ambas traducciones deben tener el mismo número de diapositivas.','Remove this item from the service? Your live output will stay unchanged.':'¿Quitar este elemento del servicio? Lo que está en vivo no cambiará.',
  'Replace the current service with this backup? Use Back up first if you want to keep it.':'¿Reemplazar el servicio actual con esta copia? Usa Copia de seguridad primero si quieres conservarlo.','Service imported':'Servicio importado',
  'Could not import. Choose a valid WorshipUI JSON backup under 5 MB.':'No se pudo importar. Elige una copia JSON válida de WorshipUI de menos de 5 MB.',
  'Could not save the selected setlist. Use Back up and check storage.':'No se pudo guardar el servicio seleccionado. Usa Copia de seguridad y revisa el almacenamiento.','The service can contain at most 200 items.':'El servicio puede tener como máximo 200 elementos.',
  'Imported content is invalid.':'El contenido importado no es válido.','Imported content exceeds the service limits.':'El contenido importado supera los límites del servicio.',
  'This service is too large to add the imported content. Use Back up or use smaller files.':'Este servicio es demasiado grande para agregar el contenido. Usa Copia de seguridad o usa archivos más pequeños.',
  'Cannot connect output windows: browser storage is unavailable.':'No se pueden conectar las ventanas de salida: el almacenamiento no está disponible.',
  'The live slide changed or is no longer in this service. Select a slide and choose Take live.':'La diapositiva en vivo cambió o ya no está en este servicio. Selecciona una y elige Poner en vivo.','Already at the end of the service.':'Ya estás al final del servicio.',
  'Saved CCLI settings are invalid. Re-enter the license numbers and save.':'La configuración CCLI guardada no es válida. Vuelve a escribir los números y guarda.','Could not read saved CCLI settings.':'No se pudo leer la configuración CCLI guardada.',
  // Shared service and sync
  'Shared service':'Servicio compartido','Local only · connect to share':'Solo local · conéctate para compartir','Connect':'Conectar','Sign out':'Cerrar sesión','Enter Live mode':'Entrar en modo en vivo','Live mode · updates held':'Modo en vivo · actualizaciones en espera',
  'Publish changes':'Publicar cambios','Review update':'Revisar actualización','Version history':'Historial de versiones','Download recovery':'Descargar recuperación','Preparing offline app…':'Preparando la app sin conexión…',
  'CONNECT YOUR TEAM':'CONECTA A TU EQUIPO','Same service. Wherever you prepare.':'El mismo servicio, dondequiera que prepares.',
  'Sign in to the same WorshipUI address at home and at church. Your local copy remains available offline.':'Inicia sesión en la misma dirección de WorshipUI en casa y en la iglesia. Tu copia local sigue disponible sin conexión.',
  'Username':'Usuario','Password':'Contraseña','Sign in':'Iniciar sesión','Signing in…':'Iniciando sesión…','REVIEW BEFORE APPLYING':'REVISA ANTES DE APLICAR','Service update':'Actualización del servicio',
  'Your local copy':'Tu copia local','Shared version':'Versión compartida','Your current projection stays unchanged. A recovery copy is saved before replacing your local service.':'Tu proyección actual no cambia. Se guarda una copia de recuperación antes de reemplazar tu servicio local.',
  'Later':'Más tarde','Keep local & publish':'Conservar local y publicar','Use shared version':'Usar la versión compartida','Restore local copy':'Restaurar copia local','VERSION HISTORY':'HISTORIAL DE VERSIONES','Earlier services':'Servicios anteriores',
  'Restore into your local workspace, then publish as a new revision. Existing history is preserved.':'Restaura en tu espacio local y luego publica como una nueva revisión. El historial se conserva.','Close':'Cerrar',
  'Resolve service changes':'Resolver cambios del servicio','Review service update':'Revisar actualización del servicio','No shared versions yet.':'Aún no hay versiones compartidas.',
  'Setlist metadata could not be saved':'No se pudieron guardar los datos del servicio','Sync paused: device storage is full. Use Back up.':'Sincronización en pausa: el almacenamiento está lleno. Usa Copia de seguridad.',
  'Shared server unavailable. Local service is ready.':'Servidor compartido no disponible. El servicio local está listo.','Sync request failed':'La sincronización falló',
  'Cannot save recovery copy. Use Back up before applying.':'No se puede guardar la copia de recuperación. Usa Copia de seguridad antes de aplicar.','Cannot save update on this device. Use Back up.':'No se puede guardar la actualización en este equipo. Usa Copia de seguridad.',
  'Server sent an invalid service. Local copy preserved.':'El servidor envió un servicio no válido. Se conservó la copia local.','Both copies changed · review to resolve':'Ambas copias cambiaron · revisa para resolver','Update waiting · review when ready':'Actualización en espera · revísala cuando estés listo',
  'Publishing changes…':'Publicando cambios…','New local edits waiting to publish':'Cambios locales nuevos esperando publicación','Another editor saved first · both copies preserved':'Otro editor guardó primero · se conservaron ambas copias',
  'Offline · local changes waiting to publish':'Sin conexión · cambios locales esperando publicación','Offline · downloaded service ready':'Sin conexión · servicio descargado listo','Offline · branding saved on this device':'Sin conexión · identidad guardada en este equipo',
  'Offline · dated setlists are saved on this device':'Sin conexión · los servicios con fecha están guardados en este equipo','Earlier version restored locally · publish when ready':'Versión anterior restaurada localmente · publícala cuando estés listo',
  'Live mode · incoming updates require review':'Modo en vivo · las actualizaciones requieren revisión','Preparation mode · checking for updates':'Modo de preparación · buscando actualizaciones',
  'Unable to sign out while offline. Retry when connected.':'No se puede cerrar sesión sin conexión. Inténtalo al conectarte.','Wait for the current sync to finish before changing dates.':'Espera a que termine la sincronización antes de cambiar de fecha.',
  'Leave Live mode before changing setlist dates.':'Sal del modo en vivo antes de cambiar de fecha.','Finish editing before changing setlist dates.':'Termina de editar antes de cambiar de fecha.',
  'Replace the local setlist for this date with a copy of the current service? The shared version may require review.':'¿Reemplazar el servicio local de esta fecha con una copia del actual? La versión compartida puede requerir revisión.',
  'Choose a valid date and check device storage.':'Elige una fecha válida y revisa el almacenamiento.','Opened undated service · checking for shared changes':'Servicio sin fecha abierto · buscando cambios compartidos','Choose a setlist date first.':'Primero elige una fecha.',
  'Local changes saved · waiting to publish':'Cambios locales guardados · esperando publicación','Offline or signed out · downloaded service ready':'Sin conexión o sin sesión · servicio descargado listo',
  'Installed app · service saved on this computer':'App instalada · servicio guardado en este equipo','✓ App downloaded · text service available offline':'✓ App descargada · servicio disponible sin conexión',
  'Offline download incomplete · keep this window open':'Descarga sin conexión incompleta · mantén esta ventana abierta','Offline app download unavailable · keep this window open':'Descarga sin conexión no disponible · mantén esta ventana abierta',
  'Offline reload unavailable in this browser · keep this window open':'Este navegador no puede recargar sin conexión · mantén esta ventana abierta','Sign in to sync. Your downloaded service remains available.':'Inicia sesión para sincronizar. Tu servicio descargado sigue disponible.',
  'Incorrect username or password':'Usuario o contraseña incorrectos','Signed out · downloaded service kept on this computer':'Sesión cerrada · el servicio descargado se conserva en este equipo',
  // Desktop connection dialog
  'Shared server':'Servidor compartido','CHURCH DESKTOP':'EQUIPO DE LA IGLESIA','Connect when you’re ready':'Conéctate cuando estés listo',
  'This installed app and its saved service run on this computer without internet. A shared server lets you receive edits made at home.':'Esta app instalada y su servicio guardado funcionan en este equipo sin internet. Un servidor compartido te permite recibir los cambios hechos en casa.',
  'Shared server HTTPS address':'Dirección HTTPS del servidor compartido','Save connection':'Guardar conexión',
  'Leave blank to use this computer independently. Changing servers keeps your local service and starts a new sync connection. Use Back up first if needed.':'Déjalo en blanco para usar este equipo de forma independiente. Cambiar de servidor conserva tu servicio local e inicia una nueva conexión. Usa Copia de seguridad primero si hace falta.',
  // Audience and stage windows
  'Back up':'Copia de seguridad','Restore backup':'Restaurar copia','Save a backup file of this service, or restore one.':'Guarda una copia de este servicio en un archivo, o restaura una.',
  'Save this service as a backup file':'Guardar este servicio como archivo de copia','Replace this service with a backup file':'Reemplazar este servicio con un archivo de copia',
  'Screens':'Pantallas','OUTPUT SCREENS':'PANTALLAS DE SALIDA','Screen setup':'Configurar pantallas','Display':'Monitor','Shows':'Muestra','Audience 1':'Audiencia 1','Audience 2':'Audiencia 2','Stage':'Escenario',
  'Choose the display for each output. Open places the window on that display in fullscreen.':'Elige el monitor para cada salida. Abrir coloca la ventana en ese monitor en pantalla completa.',
  'Current and next slide':'Diapositiva actual y siguiente','Identify displays':'Identificar monitores','Open all assigned screens':'Abrir todas las pantallas asignadas','Not assigned':'Sin asignar',
  'Drag the window to the projector':'Arrastra la ventana al proyector','Audience 1 display':'Monitor de audiencia 1','Audience 2 display':'Monitor de audiencia 2','Stage display':'Monitor del escenario',
  'Audience 1 shows':'La audiencia 1 muestra','Audience 2 shows':'La audiencia 2 muestra','That display is not connected.':'Ese monitor no está conectado.',
  'Only one display is connected. Connect the projector, then reopen Screen setup.':'Solo hay un monitor conectado. Conecta el proyector y vuelve a abrir Configurar pantallas.',
  'Display placement is available in the installed app. In a browser, drag each window to the projector and choose fullscreen.':'La ubicación por monitor está disponible en la app instalada. En un navegador, arrastra cada ventana al proyector y elige pantalla completa.',
  'Assign a display to at least one output first.':'Primero asigna un monitor a al menos una salida.',
  'On bible.com, select the verses and choose Copy.':'En bible.com, selecciona los versículos y elige Copiar.',
  'Come back here — the copied verses are picked up automatically.':'Regresa aquí: los versículos copiados se toman automáticamente.','Paste from clipboard':'Pegar del portapapeles',
  'Get verses from YouVersion':'Obtener versículos de YouVersion','Check the preview below, then add the passage.':'Revisa la vista previa abajo y luego agrega el pasaje.',
  'Verses ready. Check the preview, then add the passage.':'Versículos listos. Revisa la vista previa y agrega el pasaje.','Could not get the verses from YouVersion.':'No se pudieron obtener los versículos de YouVersion.',
  'YouVersion did not respond. Check the internet connection and try again.':'YouVersion no respondió. Revisa la conexión a internet e inténtalo de nuevo.',
  'No verses were found for that passage on YouVersion. Check the translation and try again.':'No se encontraron versículos para ese pasaje en YouVersion. Revisa la traducción e inténtalo de nuevo.',
  'In the bible.com window, go to the chapter and translation you want.':'En la ventana de bible.com, ve al capítulo y la traducción que quieras.','Use these verses':'Usar estos versículos',
  'brings in the verses chosen above from the bible.com window.':'trae los versículos elegidos arriba desde la ventana de bible.com.',
  'Or copy verses on bible.com and come back — they are picked up automatically.':'O copia versículos en bible.com y regresa: se toman automáticamente.',
  'In the bible.com window, choose the translation, then click Use these verses.':'En la ventana de bible.com, elige la traducción y haz clic en Usar estos versículos.',
  'Verses brought in from bible.com. Check the preview, then add the passage.':'Versículos traídos de bible.com. Revisa la vista previa y agrega el pasaje.',
  'Go to a Bible chapter in the bible.com window first.':'Primero ve a un capítulo de la Biblia en la ventana de bible.com.','Open the passage in bible.com first.':'Primero abre el pasaje en bible.com.',
  'No verses were found on that bible.com page. Wait for it to finish loading, then try again.':'No se encontraron versículos en esa página de bible.com. Espera a que termine de cargar e inténtalo de nuevo.',
  'Could not read the bible.com window.':'No se pudo leer la ventana de bible.com.',
  'Only the bible.com link was copied. On bible.com, click the verses to highlight them, then choose Copy.':'Solo se copió el enlace de bible.com. En bible.com, haz clic en los versículos para resaltarlos y elige Copiar.',
  'Copied verses':'Versículos copiados','The verses you copy on bible.com appear here. You can also paste them yourself.':'Los versículos que copies en bible.com aparecen aquí. También puedes pegarlos tú.',
  'Verse numbers in the copied text give one slide per verse; without them the passage becomes one auto-fit slide. Check the translation’s copyright terms for projection and streaming.':'Con números de versículo, el texto copiado da una diapositiva por versículo; sin ellos, el pasaje queda en una sola diapositiva ajustada. Revisa los derechos de la traducción para proyección y transmisión.',
  'Copy the verses on bible.com, then come back to WorshipUI.':'Copia los versículos en bible.com y regresa a WorshipUI.',
  'Copied verses picked up from YouVersion. Check the preview, then add the passage.':'Versículos tomados de YouVersion. Revisa la vista previa y agrega el pasaje.',
  'Copied verses added. Check the preview, then add the passage.':'Versículos copiados agregados. Revisa la vista previa y agrega el pasaje.',
  'The clipboard is empty. Copy the verses on bible.com first.':'El portapapeles está vacío. Primero copia los versículos en bible.com.',
  'Could not read the clipboard. Paste into the box instead (Ctrl+V).':'No se pudo leer el portapapeles. Pega en el cuadro (Ctrl+V).',
  'No verse numbers were copied, so the passage becomes one auto-fit slide.':'No se copiaron números de versículo, así que el pasaje queda en una sola diapositiva ajustada.',
  'Connected displays':'Monitores conectados','Detect displays':'Detectar monitores','Not used':'Sin usar','No displays detected.':'No se detectaron monitores.',
  'Display detection is available in the installed app.':'La detección de monitores está disponible en la app instalada.','Disconnected display':'Monitor desconectado',
  'A display was disconnected.':'Se desconectó un monitor.',
  'Your latest changes could not be saved on this computer. Use Back up first to keep them.':'Tus últimos cambios no se pudieron guardar en este equipo. Usa Copia de seguridad primero para conservarlos.',
  'This setlist has changes that are not on the shared server yet. They stay saved here and publish when you are connected.':'Este servicio tiene cambios que aún no están en el servidor compartido. Quedan guardados aquí y se publican cuando estés conectado.',
  'A shared update for this setlist is waiting for your review.':'Hay una actualización compartida de este servicio esperando tu revisión.','Switch setlists anyway?':'¿Cambiar de servicio de todos modos?',
  '◀ Move':'◀ Mover','Move ▶':'Mover ▶','Duplicate slide':'Duplicar diapositiva','Delete slide':'Eliminar diapositiva','Unable to change the slides.':'No se pudieron cambiar las diapositivas.',
  'An item can have at most 200 slides.':'Un elemento puede tener como máximo 200 diapositivas.','An item needs at least one slide.':'Un elemento necesita al menos una diapositiva.',
  'Delete this slide from the item? Your live output stays unchanged.':'¿Eliminar esta diapositiva del elemento? Lo que está en vivo no cambia.',
  'Arrow keys move the preview. Double-click a slide or press Space to take it live; Space then advances the live slide. B blacks out the screen. Drag slides to reorder them; Duplicate slide repeats the selected one (for example a chorus).':'Las flechas mueven la vista previa. Haz doble clic en una diapositiva o pulsa Espacio para ponerla en vivo; Espacio luego avanza la diapositiva en vivo. B oscurece la pantalla. Arrastra las diapositivas para reordenarlas; Duplicar diapositiva repite la seleccionada (por ejemplo, un coro).',
  'Licensed Bible versions':'Versiones bíblicas con licencia',
  'Add translations your church is licensed to use. The text is kept only on this computer — not in services, sync, backups or GitHub — and appears in the Scripture version list.':'Agrega traducciones que tu iglesia tiene licencia para usar. El texto se guarda solo en este equipo —no en servicios, sincronización, copias ni GitHub— y aparece en la lista de versiones de la Escritura.',
  'Abbreviation':'Abreviatura','Full name':'Nombre completo','Language':'Idioma','Choose Bible file':'Elegir archivo de la Biblia','NIV':'NIV','New International Version':'Nueva Versión Internacional',
  'Bible text file: one verse per line (“GEN 1:1 …”) or a Bible SuperSearch plain-text export.':'Archivo de texto bíblico: un versículo por línea (“GEN 1:1 …”) o una exportación de texto de Bible SuperSearch.',
  'Where to get licenses and Bible text':'Dónde obtener licencias y texto bíblico',
  'NIV · Biblica permissions':'NIV · permisos de Biblica','ESV · Crossway permissions':'ESV · permisos de Crossway','ESV API sign-up':'registro en la API de ESV','NLT · Tyndale permissions':'NLT · permisos de Tyndale',
  'NKJV, NIrV, CSB and others · HarperCollins Christian permissions':'NKJV, NIrV, CSB y otras · permisos de HarperCollins Christian','NASB, AMP · Lockman Foundation permissions':'NASB, AMP · permisos de la Fundación Lockman',
  'API.Bible · licensed texts through an API (sign up)':'API.Bible · textos con licencia mediante una API (registro)',
  'Licensed versions can be added in the installed app.':'Las versiones con licencia se agregan en la app instalada.','No licensed versions added yet.':'Aún no hay versiones con licencia.','Remove':'Quitar',
  'Enter the abbreviation (for example NIV) before choosing the file.':'Escribe la abreviatura (por ejemplo NIV) antes de elegir el archivo.','Enter the version name before choosing the file.':'Escribe el nombre de la versión antes de elegir el archivo.',
  'Could not add that Bible file.':'No se pudo agregar ese archivo bíblico.','That Bible version is not on this computer.':'Esa versión de la Biblia no está en este equipo.',
  'Use 2–12 capital letters or numbers for the abbreviation, different from KJV, WEB and RVR1909.':'Usa de 2 a 12 letras mayúsculas o números para la abreviatura, distinta de KJV, WEB y RVR1909.',
  'Enter the version name (up to 80 characters).':'Escribe el nombre de la versión (hasta 80 caracteres).','Choose the version language.':'Elige el idioma de la versión.','Choose a Bible text file under 20 MB.':'Elige un archivo bíblico de menos de 20 MB.',
  'The Bible data is incomplete or contains duplicate verses.':'Los datos bíblicos están incompletos o tienen versículos repetidos.','Bible data contains an invalid verse.':'Los datos bíblicos tienen un versículo no válido.',
  'Allow OBS on another computer on this network':'Permitir OBS en otro equipo de esta red','Make a new key':'Crear una clave nueva','Network overlay address':'Dirección de red de la capa',
  'In OBS on the streaming computer, use one of these addresses. The key at the end keeps other devices on the network out. If Windows asks about WorshipUI and the firewall, allow':'En OBS del equipo de transmisión, usa una de estas direcciones. La clave al final impide el acceso de otros dispositivos de la red. Si Windows pregunta por WorshipUI y el firewall, permite',
  'Private networks':'Redes privadas','Address copied. Paste it into the OBS Browser source on the streaming computer.':'Dirección copiada. Pégala en la fuente Browser de OBS del equipo de transmisión.',
  'Make a new key? OBS on the other computer will need the new address.':'¿Crear una clave nueva? OBS en el otro equipo necesitará la nueva dirección.',
  'Livestream (OBS)':'Transmisión en vivo (OBS)','Copy address':'Copiar dirección','Preview':'Vista previa','Layout':'Diseño','Lower third':'Tercio inferior','Full screen':'Pantalla completa',
  'Dark band behind text':'Franja oscura detrás del texto','Text only':'Solo texto','Text size':'Tamaño del texto','Livestream overlay address':'Dirección de la capa de transmisión',
  'Show the CCLI Streaming License number on song slides':'Mostrar el número de CCLI Streaming License en las diapositivas de cantos',
  'Show lyrics and Scripture over your camera on YouTube or Facebook Live. In OBS Studio, add a':'Muestra letras y Escritura sobre tu cámara en YouTube o Facebook Live. En OBS Studio, agrega una fuente',
  'Browser':'Navegador (Browser)','source with this address, width 1920 and height 1080. It follows whatever you take live.':'con esta dirección, ancho 1920 y alto 1080. Sigue lo que pongas en vivo.',
  'The livestream overlay is available in the installed app.':'La capa de transmisión está disponible en la app instalada.','Ready for OBS.':'Listo para OBS.',
  'Add your CCLI Streaming License number in Settings to show it on song slides.':'Agrega tu número de CCLI Streaming License en Configuración para mostrarlo en los cantos.',
  'Could not save the livestream settings on this device.':'No se pudo guardar la configuración de transmisión en este equipo.','Address copied. Paste it into the OBS Browser source.':'Dirección copiada. Pégala en la fuente Browser de OBS.',
  'Press Ctrl+C to copy the selected address.':'Pulsa Ctrl+C para copiar la dirección seleccionada.','Ports 48095–48099 are busy, so the livestream overlay is off.':'Los puertos 48095–48099 están ocupados, así que la capa de transmisión está apagada.',
  'Countdown':'Cuenta regresiva','Count down':'Contar','A length of time':'Una duración','To a clock time':'Hasta una hora','Minutes':'Minutos','Seconds':'Segundos','Clock time':'Hora',
  'Text above the timer':'Texto sobre el reloj','At zero':'Al llegar a cero','Stay on 0:00':'Quedarse en 0:00','Show a message':'Mostrar un mensaje','Go to the next item':'Pasar al siguiente elemento',
  'Message at zero':'Mensaje al llegar a cero','Service begins in':'El servicio comienza en','Welcome!':'¡Bienvenidos!',
  'Set a countdown between 1 second and 24 hours, or a clock time.':'Pon una cuenta regresiva entre 1 segundo y 24 horas, o una hora.',
  'Sign in the same way at home and at church to share setlists. Your local copy remains available offline.':'Inicia sesión de la misma forma en casa y en la iglesia para compartir servicios. Tu copia local sigue disponible sin conexión.',
  'Sign in with Google':'Iniciar sesión con Google','Or sign in to a WorshipUI server:':'O inicia sesión en un servidor de WorshipUI:',
  'Use the same Google account on each computer. WorshipUI keeps setlists in a private app area of that Google Drive.':'Usa la misma cuenta de Google en cada equipo. WorshipUI guarda los servicios en un área privada de la app en ese Google Drive.',
  'Google sign-in is not set up in this copy of WorshipUI yet (see GOOGLE-SETUP.md).':'El inicio de sesión con Google aún no está configurado en esta copia de WorshipUI (ver GOOGLE-SETUP.md).',
  'Finish signing in in your web browser…':'Termina de iniciar sesión en tu navegador…','Google sign-in did not finish.':'El inicio de sesión con Google no terminó.',
  'Signed out of Google · setlists kept on this computer':'Sesión de Google cerrada · los servicios se conservan en este equipo',
  'Google sign-in was cancelled.':'Se canceló el inicio de sesión con Google.','Google sign-in timed out. Try again.':'El inicio de sesión con Google tardó demasiado. Inténtalo de nuevo.',
  'Google sign-in expired. Sign in with Google again.':'La sesión de Google expiró. Inicia sesión con Google de nuevo.',
  'Google Drive is unavailable. Your setlists are still on this computer.':'Google Drive no está disponible. Tus servicios siguen en este equipo.',
  'This computer syncs with Google. Use Sign in with Google.':'Este equipo se sincroniza con Google. Usa Iniciar sesión con Google.',
  'Saved setlists':'Servicios guardados','Could not save a recovery copy, so the setlist was not deleted.':'No se pudo guardar una copia de recuperación, así que el servicio no se eliminó.',
  'Could not delete the setlist. Check device storage.':'No se pudo eliminar el servicio. Revisa el almacenamiento.',
  'Another version · YouVersion':'Otra versión · YouVersion','Invalid setlist library':'La lista de servicios no es válida',
  'Enter fullscreen':'Pantalla completa','CURRENT SLIDE':'DIAPOSITIVA ACTUAL','UP NEXT':'SIGUIENTE','AUDIENCE BLACKED OUT':'AUDIENCIA EN PANTALLA NEGRA','AUDIENCE LYRICS CLEARED':'LETRA BORRADA EN AUDIENCIA','Waiting for the first slide':'Esperando la primera diapositiva'
 };
 // Messages built from parts: [English pattern, Spanish replacement].
 const patterns=[
  [/^Loading the (.+)…$/,'Cargando $1…'],[/^Could not load the (.+)\.$/,'No se pudo cargar $1.'],
  [/^Selected (.+)\. Review it, then save the item\.$/,'Seleccionado: $1. Revísalo y guarda el elemento.'],
  [/^(\d+) saved songs? shown\.$/,(m,n)=>n+(n==='1'?' canto guardado':' cantos guardados')],
  [/^(.+) imported and loaded below\. Check title, writers and copyright notices before display\.$/,'$1 importado y cargado abajo. Revisa el título, los autores y los avisos de derechos antes de mostrarlo.'],
  [/^(\d+) songs imported and listed above\. Check titles, writers and copyright notices before display\.$/,'$1 cantos importados y listados arriba. Revisa títulos, autores y avisos de derechos antes de mostrarlos.'],
  [/^(.+) added to the service\.$/,'$1 agregado al servicio.'],[/^(.+) added to the service\. It has not been taken live\.$/,'$1 agregado al servicio. No se ha puesto en vivo.'],
  [/^(.+) added\. Review it, then save the item\.$/,'$1 agregada. Revísala y guarda el elemento.'],
  [/^Showing all (\d+) verses on one slide with auto-fit text\.$/,'Mostrando los $1 versículos en una diapositiva con texto ajustado.'],
  [/^\+ Add (.+) · (\S+)$/,(m,language,id)=>'+ Agregar '+(es[language]||language)+' · '+id],
  [/^✓ (.+) added · (\S+) \(click to remove\)$/,(m,language,id)=>'✓ '+(es[language]||language)+' agregado · '+id+' (clic para quitar)'],
  [/^Add (.+) · (.+) as second translation$/,(m,language,version)=>'Agregar '+(es[language]||language)+' · '+version+' como segunda traducción'],
  [/^(Song|Scripture|Announcement|Sermon) · (\d+) slides?$/,(m,type,n)=>es[type]+' · '+n+(n==='1'?' diapositiva':' diapositivas')],
  [/^(\d+) ITEMS?$/,(m,n)=>n+(n==='1'?' ELEMENTO':' ELEMENTOS')],
  [/^Preview slide (\d+)(.*)$/,'Vista previa de la diapositiva $1$2'],
  [/^All changes downloaded · revision (\d+)$/,'Todos los cambios descargados · revisión $1'],[/^Shared copy saved · revision (\d+)$/,'Copia compartida guardada · revisión $1'],
  [/^Offline or signed out · downloaded revision (\d+) ready$/,'Sin conexión o sin sesión · revisión $1 descargada lista'],
  [/^Setlist: (.+)$/,'Servicio: $1'],[/^Offline copy · (.+)$/,'Copia sin conexión · $1'],[/^Opened setlist (.+) · checking for shared changes$/,'Servicio $1 abierto · buscando cambios compartidos'],
  [/^Setlist (.+) has conflicting changes · open it to review$/,'El servicio $1 tiene cambios en conflicto · ábrelo para revisar'],
  [/^Restore revision (\d+)$/,'Restaurar revisión $1'],[/^Revision (\d+) · (.+)$/,'Revisión $1 · $2'],
  [/^Cannot save sync state for (.+)\. Use Back up\.$/,'No se puede guardar el estado de sincronización de $1. Usa Copia de seguridad.'],
  [/^Allow pop-up windows to open your (\w+) display\.$/,'Permite ventanas emergentes para abrir la pantalla.'],
  [/^Could not save CCLI settings: (.+)$/,'No se pudo guardar la configuración CCLI: $1'],
  [/^Main language: English · second language: (.+)$/,'Idioma principal: inglés · segundo idioma: $1'],[/^Idioma principal: Español · second language: English$/,'Idioma principal: español · segundo idioma: inglés'],
  [/^(.+) is not in the second translation\.$/,'$1 no está en la segunda traducción.'],[/^(.+) data is unavailable\.$/,'Los datos de $1 no están disponibles.']
 ];
 // Slide captions are built in steps ("SLIDE 01 · SELECTED", then a section label, then a screen), so the app may
 // append English to text already shown in Spanish. Translate each " · " part on its own.
 const captionParts={'SELECTED':'SELECCIONADA','Copyright':'Derechos','Verse':'Estrofa','Chorus':'Coro','Pre-Chorus':'Pre-coro','Bridge':'Puente','Intro':'Introducción','Outro':'Final','Ending':'Final','Refrain':'Estribillo','Interlude':'Interludio'};
 function captionPart(part){
  const slide=part.match(/^SLIDE (\d+)$/);if(slide)return 'DIAPOSITIVA '+slide[1];
  const screen=part.match(/^Screen ([12])$/);if(screen)return 'Pantalla '+screen[1];
  const label=part.match(/^([A-Za-z-]+)( \d+[a-z]?)?$/);if(label&&captionParts[label[1]])return captionParts[label[1]]+(label[2]||'');
  return part;
 }
 patterns.unshift([/^(?:SLIDE|DIAPOSITIVA) \d+( · .+)?$/,text=>text.split(' · ').map(captionPart).join(' · ')]);
 patterns.push([/^(\d+) items? · (\d+) slides? saved locally\. Check text size and your projector before starting\.$/,(m,items,slides)=>items+(items==='1'?' elemento':' elementos')+' · '+slides+(slides==='1'?' diapositiva guardada':' diapositivas guardadas')+' en este equipo. Revisa el tamaño del texto y el proyector antes de comenzar.']);
 patterns.push([/^(\d+) slides? · (.+) · (\S+)$/,(m,n,reference,version)=>n+(n==='1'?' diapositiva':' diapositivas')+' · '+reference+' · '+version],[/^\+ (\d+) more$/,'+ $1 más']);
 patterns.push([/^Display connected: Display (\d+) · (\S+)\. Open Screens to assign it\.$/,'Monitor conectado: monitor $1 · $2. Abre Pantallas para asignarlo.'],
  [/^Display (\d+) shows$/,'El monitor $1 muestra'],[/^(\d+×\d+) · main$/,'$1 · principal']);
 patterns.push([/^Delete setlist (\S+)$/,'Eliminar servicio $1'],[/^Setlist (\S+) deleted from this computer$/,'Servicio $1 eliminado de este equipo'],
  [/^Delete the setlist for (.+) from this computer\? A recovery copy is kept \(Download recovery\), and a copy already shared to the server stays there\.$/,'¿Eliminar el servicio del $1 de este equipo? Se guarda una copia de recuperación (Descargar recuperación) y la copia ya compartida en el servidor se conserva.']);
 patterns.push([/^Display (\d+) · (\S+)( \(main\))?$/,(m,n,size,main)=>'Monitor '+n+' · '+size+(main?' (principal)':'')],
  [/^(\d+) displays connected\.$/,'$1 monitores conectados.'],[/^(\d+) screens? opened\.$/,(m,n)=>n+(n==='1'?' pantalla abierta.':' pantallas abiertas.')]);
 patterns.push([/^Getting (.+) \((\S+)\) from YouVersion…$/,'Obteniendo $1 ($2) de YouVersion…'],
  [/^Checking (\S+)…$/,'Revisando $1…'],[/^(\S+) added\. Choose it under Version when adding Scripture\.$/,'$1 agregada. Elígela en Versión al agregar la Escritura.'],
  [/^(\S+) removed from this computer\.$/,'$1 se quitó de este equipo.'],
  [/^Remove (\S+) from this computer\? Slides already made with it stay in your services\.$/,'¿Quitar $1 de este equipo? Las diapositivas ya creadas con ella se conservan en tus servicios.'],
  [/^(\S+) · (.+) · (English|Spanish \(Español\))$/,(m,id,name,language)=>id+' · '+name+' · '+(language==='English'?'Inglés':'Español')],
  [/^Unexpected text in the Bible file near line (\d+)\.$/,'Texto inesperado en el archivo bíblico cerca de la línea $1.']);
 const SKIP='.screen, textarea, input, #order strong, #selectedTitle, #songResults, #versionList, #changeList, pre, #churchName[data-custom]';
 const originals=new WeakMap(),attributes=new WeakMap(),ATTRS=['placeholder','aria-label','title'];
 let language='en',observer=null,applying=false,translated=false;
 function translate(text){
  const key=text.replace(/\s+/g,' ').trim();if(!key)return null;
  if(Object.hasOwn(es,key))return es[key];
  for(const [pattern,replacement] of patterns)if(pattern.test(key)){const result=key.replace(pattern,replacement);return result===key?null:result}
  return null;
 }
 function skipped(node){const element=node.nodeType===1?node:node.parentElement;return !element||!!element.closest(SKIP)}
 function translateText(node){
  if(skipped(node))return;
  const english=originals.has(node)&&node.data===originals.get(node).shown?originals.get(node).english:node.data;
  const spanish=translate(english);
  if(spanish===null)return;
  const lead=english.match(/^\s*/)[0],trail=english.match(/\s*$/)[0],shown=lead+spanish+trail;
  originals.set(node,{english,shown});if(node.data!==shown)node.data=shown;
 }
 function translateAttributes(element){
  if(element.closest(SKIP)&&element.tagName!=='TEXTAREA'&&element.tagName!=='INPUT')return;
  // Options without a value use their text as the value; keep the English value so app logic is unchanged.
  if(element.tagName==='OPTION'&&!element.hasAttribute('value'))element.setAttribute('value',element.textContent);
  const saved=attributes.get(element)||{};
  for(const name of ATTRS){
   if(!element.hasAttribute(name))continue;
   const current=element.getAttribute(name),english=saved[name]&&current===saved[name].shown?saved[name].english:current,spanish=translate(english);
   if(spanish!==null){saved[name]={english,shown:spanish};if(current!==spanish)element.setAttribute(name,spanish)}
  }
  attributes.set(element,saved);
 }
 function walk(rootNode){
  if(rootNode.nodeType===3){translateText(rootNode);return}
  if(rootNode.nodeType!==1)return;
  translateAttributes(rootNode);
  const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  for(let node=walker.nextNode();node;node=walker.nextNode())node.nodeType===3?translateText(node):translateAttributes(node);
 }
 function restore(rootNode){
  const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  for(let node=walker.currentNode;node;node=walker.nextNode()){
   if(node.nodeType===3){const saved=originals.get(node);if(saved&&node.data===saved.shown)node.data=saved.english;originals.delete(node)}
   else if(node.nodeType===1){const saved=attributes.get(node);if(saved)for(const [name,value] of Object.entries(saved))if(node.getAttribute(name)===value.shown)node.setAttribute(name,value.english);attributes.delete(node)}
  }
 }
 function setLanguage(next){
  language=next==='es'?'es':'en';document.documentElement.lang=language;
  if(language==='es'){
   translated=true;applying=true;walk(document.documentElement);document.title=translate(document.title)||document.title;applying=false;
   if(!observer){
    observer=new MutationObserver(records=>{if(applying||language!=='es')return;applying=true;
     for(const record of records){
      if(record.type==='characterData')translateText(record.target);
      else if(record.type==='attributes')translateAttributes(record.target);
      else record.addedNodes.forEach(walk);
     }
     applying=false});
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
   }
  }else{
   observer?.disconnect();observer=null;if(!translated)return;restore(document.documentElement);
   if(document.title.startsWith('WorshipUI · Espacio'))document.title='WorshipUI · Service workspace';
  }
 }
 // Confirmation prompts are not part of the page, so translate them on the way out.
 const nativeConfirm=root.confirm?.bind(root);
 // Prompts can combine several paragraphs, so each paragraph is translated on its own.
 const translateMessage=message=>String(message).split('\n\n').map(part=>translate(part)||part).join('\n\n');
 if(nativeConfirm)root.confirm=message=>nativeConfirm(language==='es'?translateMessage(message):message);
 function savedLanguage(){try{return JSON.parse((root.worshipStorage||root.localStorage).getItem('worshipui.language.v1'))?.mainLanguage==='es'?'es':'en'}catch{return 'en'}}
 root.WorshipI18n={setLanguage,translate,language:()=>language};
 setLanguage(savedLanguage());
 // Audience and stage windows follow the main window's toggle.
 root.addEventListener('storage',event=>{if(event.key==='worshipui.language.v1')setLanguage(savedLanguage())});
})(window);
