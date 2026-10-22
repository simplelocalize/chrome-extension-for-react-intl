// Translator mode for the SimpleLocalize Chrome extension: put <SimpleLocalize> inside your <IntlProvider>. With
// ?i18n-keys=1 every message from formatMessage (and <FormattedMessage>, which uses it) carries an invisible marker
// with its key, and translation-keys.ts turns the markers into data-translation-key on the elements showing them.
// Without the flag it renders its children unchanged.

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type IntlShape, RawIntlProvider, useIntl } from "react-intl";
import { isTranslationKeysModeEnabled, markTranslationKey, observeTranslationKeys } from "./translation-keys";

type FormatMessage = IntlShape["formatMessage"];

const withTranslationKeys = (intl: IntlShape): IntlShape => {
  const formatMessage = ((descriptor, values, options) => {
    const message = intl.formatMessage(descriptor, values, options);
    if (descriptor.id === undefined || descriptor.id === "") {
      return message;
    }
    const marker = markTranslationKey(String(descriptor.id));
    // rich text messages (with tags or React values) come back as an array of parts
    if (Array.isArray(message)) {
      return [...message, marker];
    }
    return typeof message === "string" ? message + marker : [message, marker];
  }) as FormatMessage;
  return { ...intl, formatMessage, $t: formatMessage };
};

export const SimpleLocalize = ({ children }: { children: ReactNode }) => {
  const intl = useIntl();
  // read after mounting, so server-rendered and hydrated markup match
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isTranslationKeysModeEnabled(window.location.search));
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return observeTranslationKeys(document.documentElement);
  }, [enabled]);

  const value = useMemo(() => (enabled ? withTranslationKeys(intl) : intl), [enabled, intl]);
  return <RawIntlProvider value={value}>{children}</RawIntlProvider>;
};
