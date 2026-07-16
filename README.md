# Khmer Unicode Converter

[[View Demo]](https://khmer.floo.app)

Convert Khmer text between **legacy font encodings** (Limon, ABC, Truth,
Baidok, Khek, FK, Kaoh Kong, Rasmei, …) and **Khmer Unicode** — in both
directions. Zero runtime dependencies; works in Node (≥18) and browsers.

The implementation is a faithful TypeScript port of the amazing
[**olivierberten/KhmerConverter**](https://github.com/olivierberten/KhmerConverter)
(Khmer Software Initiative, www.khmeros.info), validated against its original
test suites. Font mappings are generated at build time from the original
`fontdata.xml`.

## Install

```shell
npm install khmer-unicode-converter
```

## Usage

```javascript
import { limon } from 'khmer-unicode-converter';

const result = limon("ភស្តុតាងអំពីពាក្យថា ខ្មែរ")

// => PsþútagGMBIBaküfa Exµr
```

### All fonts, both directions

```javascript
import {
  convertUnicodeToLegacy,
  convertLegacyToUnicode,
  convertUnicodeToLegacyBytes,
  listFontTypes,
} from 'khmer-unicode-converter';

// Unicode -> legacy (font may be a type, real font name, or alias)
convertUnicodeToLegacy('កខគ', 'abc')        // => 'kxK'
convertUnicodeToLegacy('ខ្មែរ', 'Limon S1')  // => 'Exµr'
convertUnicodeToLegacyBytes('កខគ', 'abc')   // => Uint8Array (cp1252 bytes for files)

// legacy -> Unicode
convertLegacyToUnicode('kxK', 'abc')        // => 'កខគ'
convertLegacyToUnicode(bytesFromLegacyFile, 'limon') // Uint8Array input

listFontTypes()
// => ['abc', 'abc-zwsp', 'abc2', 'abc3', 'baidok', 'fk',
//     'kaohkong', 'khek', 'limon', 'rasmei', 'truth']
```

Legacy text is byte-based (cp1252). String inputs/outputs on the legacy side
are cp1252-decoded display text — what you paste into or copy from an
application using a legacy font. Use the `Bytes` variants when reading or
writing legacy files.

`limon(text)` is the same API as version 0.0.8 and keeps its exact behavior
(including `,` passthrough and `ឲ`/`៕` handling).

## Development

```shell
npm test               # vitest; includes the translated original test suites
npm run build          # library -> dist/
npm run gen:fontdata   # regenerate src/generated/fontdata.ts from fontdata/fontdata.xml
```

## License

`GPL-2.0-or-later` — this package is a derivative of the GPL-licensed
KhmerConverter, copyright © 2006–2008 Khmer Software Initiative
(www.khmeros.info), developed by Hok Kakada, Keo Sophon, San Titvirak, and
Seth Chanratha.
