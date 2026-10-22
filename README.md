# Translation keys for the SimpleLocalize Chrome extension

The [SimpleLocalize Chrome extension](https://simplelocalize.io/docs/integrations/chrome-extension/) finds a
translation most reliably by its `data-translation-key` attribute. This mode adds that attribute to every
translated element on the site.

## Setup

Copy `SimpleLocalize.tsx` and `translation-keys.ts` to your app and put `<SimpleLocalize>` inside your
`<IntlProvider>`:

```tsx
import { SimpleLocalize } from "./SimpleLocalize";

<IntlProvider locale={locale} messages={messages}>
  <SimpleLocalize>
    <App/>
  </SimpleLocalize>
</IntlProvider>
```

Messages from `<FormattedMessage>` and `useIntl().formatMessage` get their keys; an `intl` object created outside
this tree (e.g. with `createIntl`) doesn't.

## Usage

- Turn on: open any page with `?i18n-keys=1`, e.g. `https://example.com/de/?i18n-keys=1`.
- It stays on in that browser tab while you navigate.
- Turn off: open any page with `?i18n-keys=0`, or close the tab.

Without the flag the site works exactly as before.

## How it works

1. `SimpleLocalize.tsx` wraps `intl.formatMessage`: each message gets an invisible marker
   (zero-width characters) that encodes its key.
2. React renders the text together with the marker.
3. A `MutationObserver` (`translation-keys.ts`) finds the markers in text and in attributes (`alt`, `title`,
   `placeholder`, ...), removes them, and sets `data-translation-key` on the element.

```html
<h1 data-translation-key="page.home.hero.title">Das All-in-One</h1>
```

## Limitations

- For translators only: while the mode is on, strings are a few invisible characters longer.
- An element with several messages gets the key of the last one.
