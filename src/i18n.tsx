import React, { createContext, useContext } from 'react';
import strings from '../i18n/en.json';

type Strings = typeof strings;

const I18nContext = createContext<Strings>(strings);

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <I18nContext.Provider value={strings}>{children}</I18nContext.Provider>
);

export function useI18n() {
  return useContext(I18nContext);
}
