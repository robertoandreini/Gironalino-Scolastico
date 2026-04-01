// ==========================================
// 1. DATABASE (GOOGLE TSV)
// ==========================================
// Il tuo link corretto è già inserito qui sotto
const LINK_FOGLIO_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRASYXdTiYb2GodAywGw78-8eLZs0aJJ9yywaFa8yP5OFvak1ZJH6Bm-K94Vz7eKWduCV0ZKxsb6Dx/pub?gid=0&single=true&output=tsv';
const LINK_GALLERIA_TSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRASYXdTiYb2GodAywGw78-8eLZs0aJJ9yywaFa8yP5OFvak1ZJH6Bm-K94Vz7eKWduCV0ZKxsb6Dx/pub?gid=943529233&single=true&output=tsv"; 

// ==========================================
// 2. GESTIONE MENU LATERALE
// ==========================================
const btnMenu = document.getElementById('btn-menu');
const btnChiudi = document.getElementById('btn-chiudi');
const menuLaterale = document.getElementById('menu-laterale');

if (btnMenu && btnChiudi && menuLaterale) {
    btnMenu.addEventListener('click', () => menuLaterale.classList.add('aperto'));
    btnChiudi.addEventListener('click', () => menuLaterale.classList.remove('aperto'));
}

// ==========================================
// 3. RECUPERO DATI (MOTORE ANTIPROIETTILE)
// ==========================================
function convertiTsvInJson(tsv) {
    // TRUCCO PRO: Se qualcuno va a capo nel foglio, Google mette il testo tra virgolette.
    // Questo algoritmo legge tutto e trasforma gli "a capo" accidentali nel nostro codice "||".
    let inQuotes = false;
    let tsvAggiustato = "";

    for (let i = 0; i < tsv.length; i++) {
        let char = tsv[i];
        if (char === '"') inQuotes = !inQuotes;
        
        // Se c'è un a capo DENTRO le virgolette (errore del redattore), lo salviamo come "||"
        if (char === '\n' && inQuotes) {
            tsvAggiustato += "||";
        } else if (char === '\r' && inQuotes) {
            // Ignoriamo i ritorni a capo di Windows
        } else {
            tsvAggiustato += char;
        }
    }

    const righe = tsvAggiustato.split('\n');
    if (righe.length < 2) return []; 

    // Puliamo le intestazioni togliendo eventuali virgolette residue
    const intestazioni = righe[0].split('\t').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const risultato = [];

    for (let i = 1; i < righe.length; i++) {
        if (!righe[i].trim()) continue; // Salta le righe vuote

        const oggetto = {};
        const rigaAttuale = righe[i].split('\t');

        for (let j = 0; j < intestazioni.length; j++) {
            // Puliamo il testo finale da spazi vuoti e virgolette Google
            let valore = rigaAttuale[j] ? rigaAttuale[j].trim().replace(/^"|"$/g, '') : '';
            oggetto[intestazioni[j]] = valore;
        }
        risultato.push(oggetto);
    }
    return risultato;
}

// ==========================================
// 4. AVVIO DEL SITO (Velocità Luce)
// ==========================================
async function avviaSito() {
    try {
        if(LINK_FOGLIO_TSV.includes('INCOLLA_QUI')) {
            throw new Error("⚠️ Devi incollare il link del tuo foglio TSV nel file app.js!");
        }

        // 1. CARICAMENTO ISTANTANEO (dalla memoria locale)
        const datiSalvati = localStorage.getItem('database_giornalino');
        if (datiSalvati) {
            const articoliVeloci = convertiTsvInJson(datiSalvati);
            if (window.location.pathname.includes('articolo.html')) {
                stampaSingoloArticolo(articoliVeloci);
            } else {
                stampaListaArticoli(articoliVeloci);
            }
        }

        // 2. AGGIORNAMENTO SILENZIOSO (in background)
        const urlAntiCache = LINK_FOGLIO_TSV + '&t=' + new Date().getTime();
        const risposta = await fetch(urlAntiCache);
        if (!risposta.ok) throw new Error("Link del foglio non valido.");
        
        const datiTestoNuovi = await risposta.text();
        
        // Se i dati sono cambiati (o è la prima volta in assoluto), salviamo e aggiorniamo la grafica
        if (datiTestoNuovi !== datiSalvati) {
            localStorage.setItem('database_giornalino', datiTestoNuovi);
            const articoliAggiornati = convertiTsvInJson(datiTestoNuovi);
            
            // Aggiorna lo schermo con i dati freschi appena arrivati
            if (window.location.pathname.includes('articolo.html')) {
                stampaSingoloArticolo(articoliAggiornati);
            } else {
                stampaListaArticoli(articoliAggiornati);
            }
        }
    } catch (errore) {
        console.error(errore);
        // Mostra l'errore rosso solo se il sito è completamente vuoto
        if (!localStorage.getItem('database_giornalino')) {
            const contenitore = document.getElementById('lista-articoli');
            if(contenitore) {
                contenitore.innerHTML = `
                    <div style="background:#ffde59; border:3px solid #000; padding:2rem; text-align:center; box-shadow:6px 6px 0 #000; border-radius:8px;">
                        <h2>SISTEMA BLOCCATO</h2>
                        <p style="margin-top:1rem;"><strong>${errore.message}</strong></p>
                    </div>
                `;
            }
        }
    }
}

// ==========================================
// 5. STAMPA A SCHERMO
// ==========================================

// Stampa la Home Page
function stampaListaArticoli(articoli) {
    const contenitore = document.getElementById('lista-articoli');
    if (!contenitore) return; 
    
    contenitore.innerHTML = ''; 

    // Prendiamo i 7 articoli più recenti
    const articoliRecenti = articoli.reverse().slice(0, 7);

    articoliRecenti.forEach((articolo, index) => {
        if(!articolo.id || !articolo.titolo) return;

        const delayAnimazione = index * 0.1;

        const htmlArticolo = `
            <article class="card-articolo fade-in-up" style="animation-delay: ${delayAnimazione}s">
                <div class="immagine-articolo">
                    <img src="${articolo.immagine || 'https://via.placeholder.com/400x300'}" alt="${articolo.titolo}">
                </div>
                <div class="contenuto-articolo">
                    <h3 class="titolo-articolo">${articolo.titolo}</h3>
                    <p class="testo-articolo">${articolo.sottotitolo}</p>
                    <a href="articolo.html?id=${articolo.id}" class="leggi-tutto">LEGGI DI PIÙ</a>
                </div>
            </article>
        `;
        
        contenitore.innerHTML += htmlArticolo;
    });
}

function stampaSingoloArticolo(articoli) {
    const urlParams = new URLSearchParams(window.location.search);
    const idRichiesto = urlParams.get('id');

    const articoloTrovato = articoli.find(art => art.id === idRichiesto);

    if (articoloTrovato) {
        document.getElementById('titolo-singolo').innerText = articoloTrovato.titolo;
        document.getElementById('sottotitolo-singolo').innerText = articoloTrovato.sottotitolo;
        document.getElementById('immagine-singola').src = articoloTrovato.immagine || 'https://via.placeholder.com/1000x500';
        
        // Magia dell'impaginazione: formatta sia le doppie sbarre che i veri a capo
        const testoOriginale = articoloTrovato.testo || '';
        const testoFormattato = `<p>${testoOriginale.replace(/\|\|/g, '</p><p>')}</p>`;
        document.getElementById('testo-singolo').innerHTML = testoFormattato;
        
        document.title = articoloTrovato.titolo + " - Il Giornalino";
    } else {
        document.getElementById('titolo-singolo').innerText = "Errore 404";
        document.getElementById('testo-singolo').innerHTML = "<p>L'articolo che cerchi non esiste.</p>";
    }
}
// ==========================================
// MOTORE DELLA GALLERIA
// ==========================================
async function avviaGalleria() {
    try {
        const urlAntiCache = LINK_GALLERIA_TSV + '&t=' + new Date().getTime();
        const risposta = await fetch(urlAntiCache);
        if (!risposta.ok) throw new Error("Errore nel caricamento della galleria");
        
        const datiTesto = await risposta.text();
        fotoGalleria = convertiTsvInJson(datiTesto);

        // Se ci sono foto, mostra la prima
        if(fotoGalleria.length > 0) {
            mostraFoto(0);
        }

        // Attiviamo i bottoni
        document.getElementById('btn-prev').addEventListener('click', () => {
            indiceFotoCorrente--;
            // Se andiamo indietro dalla prima foto, ripartiamo dall'ultima (loop)
            if(indiceFotoCorrente < 0) indiceFotoCorrente = fotoGalleria.length - 1;
            mostraFoto(indiceFotoCorrente);
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            indiceFotoCorrente++;
            // Se andiamo avanti dopo l'ultima foto, ripartiamo dalla prima (loop)
            if(indiceFotoCorrente >= fotoGalleria.length) indiceFotoCorrente = 0;
            mostraFoto(indiceFotoCorrente);
        });

    } catch (errore) {
        console.error(errore);
        document.getElementById('didascalia-corrente').textContent = "⚠️ Impossibile caricare le foto.";
    }
}

function mostraFoto(indice) {
    const imgElement = document.getElementById('immagine-corrente');
    const didascaliaElement = document.getElementById('didascalia-corrente');

    // Cambia l'immagine e il testo con quelli estratti da Google Fogli
    imgElement.src = fotoGalleria[indice].immagine || 'https://placehold.co/800x500/eeeeee/000000.png?text=FOTO+MANCANTE';
    didascaliaElement.textContent = fotoGalleria[indice].didascalia || 'Nessuna descrizione';
}

// Controllo all'avvio: se siamo nella pagina galleria, fai partire il motore giusto
if (window.location.pathname.includes('galleria.html')) {
    avviaGalleria();
}

// Fa partire tutto il meccanismo
avviaSito();