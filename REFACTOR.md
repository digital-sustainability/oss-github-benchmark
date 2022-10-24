# Collection of refactoring ideas

## Skript Stand 3ae57184

Das Data Gathering Skript started auf Zeile 410. Im Moment iteriert es durch die Github Repos welche aus der Collection TodoInstititutions geladen werden. Es gibt keine Methode welche die TodoInstitutions ausliest. Das Skript iteriert durch jeden Sector und jede Institution und speichert den Zwischenstand nach jeder Instituion in der Collection Progress. Die Operation wird mit einem Upsert gemacht, der letzte Zwischenstand geht verloren.

Der Datenaustausch erfolgt über einige globale Variablen. Diese werden auf Zeile 442 - 444 definiert. Einige get-Funktionen greifen auf diese globalen Variablen zurück.

Die einzelnen Institutionen werden mit der Funktion CrawlInstitution gecrawlt, dabei wird über alle definierten Organisationen iteriert und die Informationen werden über die Github API gesammelt. Am Ende der Iterationen werden die Informationen der Institutionen aggregiert im Objekt Institutions gespeichert.

### Verbesserungsvorschläge Crawler

Der Crawler sollte in Typescript neu implementiert werden, dabei ist vor allem auf eine saubere Typendefinition zu achten welche anschliessend auch in einem Datenmodel abgeglichen wird. Die Typendefinition ermöglicht es die Daten einfacher zu verwalten und sogar im Frontend einzusetzen.

Schritte um Crawler zu verbessern:

- Definition der Datenobjekte
  - Welche Informationen enthalten die Institutionen
  - Welche Informationen enthalten die Organisationen
  - Welche Informationen enthalten die Repositories
- Ermittlung Speicher
  - Was soll wo gespeichert werden?
    - Repositories 1:1
    - Organisationen, spezifische Infos und Aggregierte Repositories
    - Institutionen, aggregierte Organisationen
- Crawler in Typescript implementieren
  - Klasse um Institutionen zu crawlen und Verbindung zur DB
  - Klasse um die Institutionscrawler zu managen und ein Monitoring sicherzustellen
  - Datenobjekt definieren welche den aktuellen Crawler Zustand speichert und ein Debugging ermöglicht.

### Thesaurus

#### Datenmodell

- Institutionen (OSS-Benchmark Kontext)
  - Organisationen (Github Organisationen)
    - Repositories

> Example
>
> - Adfinis (Institution)
>   - "adfinis-sygroup" (Organisation)
>   - "adfinis-forks" (Organisation)
>   - "projectcaluma (Organisation)

#### Institution

Institution, eine Institution ist ein Set von Github Organisationen welche sich auf dieselbe physische Institution bezieht. Zum Beispiel hat die Institution Adfinis 3 verschiedene Github Organisationen.

#### Organisation

Eine Organisation gehört im Kontext des OSS Github Benchmark zu einer Institut und wird im Github mit einer Organisation abgebildet. Die Information für eine Organisation kann über die Github API abgefragt werden.

#### Repository

Das Repository gehört im Github Kontext zu einer Github Organisation und beinhaltet ein konkretes Repository mit Code. Informationen können über die API abgefragt werden.
