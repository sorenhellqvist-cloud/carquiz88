# carquiz88 🚗
Bilquiz - En interaktiv frågesport om bilar

## Beskrivning
En modern och visuell quiz-applikation där användare kan testa sina kunskaper om olika bilmärken och bilmodeller. Applikationen hämtar frågor och bilder från en Supabase-databas och presenterar dem i ett användarvänligt gränssnitt.

## Funktioner
- ✨ Interaktiv quiz med bilder av bilar
- 📊 Progressbar som visar framsteg
- 🎯 Omedelbar feedback på svar
- 📱 Responsiv design för mobila enheter
- 🔄 Slumpmässig ordning på frågor och svar
- 🏆 Poängsammanfattning i slutet

## Tekniker
- HTML5
- CSS3 (med gradients och animationer)
- Vanilla JavaScript
- Supabase (databas och backend)
- Fetch API för datainhämtning

## Installation och Användning

### Krav
- En webbläsare (Chrome, Firefox, Safari, Edge)
- Tillgång till internet (för att ansluta till Supabase)

### Lokal Testning
1. Öppna `carquiz.html` i en webbläsare
2. Klicka på "Starta Quiz" för att börja
3. Välj svar på frågorna
4. Se ditt resultat i slutet

### Publicering
För att publicera på https://timede.se/carquiz.html:
1. Ladda upp `carquiz.html` till webbservern
2. Se till att filen är tillgänglig på rätt URL

## Databasupplägg
Se [DATABASE_SETUP.md](DATABASE_SETUP.md) för instruktioner om hur man konfigurerar Supabase-databasen med frågor och bilder.

## Projektstruktur
```
carquiz88/
├── carquiz.html          # Huvudapplikationen
├── demo.html             # Demo-version med testdata
├── DATABASE_SETUP.md     # Databasinstruktioner
└── README.md             # Denna fil
```

## Bidra
Pull requests välkomnas! För större ändringar, öppna först en issue för att diskutera vad du vill ändra.

## Licens
Detta projekt är öppen källkod.
Bilfrågesport med timer

[![Deploy to GitHub Pages](https://github.com/sorenhellqvist-cloud/carquiz88/actions/workflows/deploy.yml/badge.svg)](https://github.com/sorenhellqvist-cloud/carquiz88/actions/workflows/deploy.yml)

## Beskrivning
En interaktiv bilfrågesport där du har 60 sekunder på dig att svara på så många frågor som möjligt om bilar. Testa dina kunskaper om bilmärken, historia, och tekniska detaljer!

**Live demo:** [https://timede.se](https://timede.se)

## Funktioner
- **Tidsbegränsad quiz**: 60 sekunder att svara på så många frågor som möjligt
- **Slumpmässiga frågor**: Frågorna presenteras i slumpmässig ordning
- **Omedelbar feedback**: Se direkt om ditt svar är rätt eller fel
- **Poängräkning**: Håll koll på hur många rätt svar du får
- **Responsiv design**: Fungerar på både desktop och mobila enheter

## Hur man använder
1. Besök [https://timede.se](https://timede.se) eller öppna `index.html` lokalt
2. Klicka på "Starta quiz"
3. Svara på frågorna så snabbt du kan innan tiden tar slut!
4. Se din slutpoäng och spela igen

## Deployment
Applikationen är konfigurerad för automatisk deployment till GitHub Pages med custom domain (timede.se).

Se [DEPLOYMENT.md](DEPLOYMENT.md) för detaljerade instruktioner om hur du konfigurerar deployment och DNS.

## Teknisk information
- Ren HTML, CSS och JavaScript
- Inga externa beroenden
- Fungerar offline
- 15 olika frågor om bilar
- Automatisk deployment via GitHub Actions
