import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Seletor do modo escuro do PrimeNG. Deve ser repassado em app.config.ts:
//   providePrimeNG({ theme: { preset: TuxPreset, options: { darkModeSelector: TUX_DARK_MODE_SELECTOR } } })
// O TemaService define `data-theme` ("dark" | "light") no <html>.
export const TUX_DARK_MODE_SELECTOR = '[data-theme="dark"]';

// Paleta azul (Breeze) derivada de #3daee9, que é o `--tux-primary` do tema escuro.
// O 700 é o `--tux-primary` do tema claro (#1a699b).
const primaryPalette = {
  50: '#edf7fd',
  100: '#d6eefa',
  200: '#adddf6',
  300: '#76c6ef',
  400: '#3daee9',
  500: '#1999dc',
  600: '#1686c0',
  700: '#1a699b',
  800: '#0f5c85',
  900: '#0b4665',
  950: '#072d40',
};

// Campos de formulário do TuxTalk: fundo da "view", sem borda própria e sem anel de foco.
// Borda/foco/erro ficam a cargo do wrapper `.field` de cada tela (ver login.scss).
// Os valores vêm das variáveis --tux-* definidas em styles.scss, que já mudam com o tema
// (`[data-theme="light"]`), então o mesmo objeto serve para os dois esquemas.
const formFieldColors = {
  background: 'var(--tux-bg)',
  disabledBackground: 'var(--tux-bg)',
  filledBackground: 'var(--tux-bg)',
  filledHoverBackground: 'var(--tux-bg)',
  filledFocusBackground: 'var(--tux-bg)',
  borderColor: 'transparent',
  hoverBorderColor: 'transparent',
  focusBorderColor: 'transparent',
  invalidBorderColor: 'transparent',
  color: 'var(--tux-text-muted)',
  disabledColor: 'var(--tux-text-muted)',
  placeholderColor: 'var(--tux-text-muted)',
  invalidPlaceholderColor: 'var(--tux-text-muted)',
  iconColor: 'var(--tux-text-muted)',
  shadow: 'none',
};

// Cor primária de ação: os tokens do tema (escuro/claro) em vez de um tom fixo da paleta.
const primaryColors = {
  color: 'var(--tux-primary)',
  contrastColor: 'var(--tux-primary-text)',
  hoverColor: 'var(--tux-primary)',
  activeColor: 'var(--tux-primary)',
};

export const TuxPreset = definePreset(Aura, {
  semantic: {
    primary: primaryPalette,
    formField: {
      paddingX: '0.5rem',
      paddingY: '0.5rem',
      borderRadius: 'var(--tux-radius-lg)',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: 'none',
      },
    },
    colorScheme: {
      light: { primary: primaryColors, formField: formFieldColors },
      dark: { primary: primaryColors, formField: formFieldColors },
    },
  },
  components: {
    checkbox: {
      root: {
        borderRadius: 'var(--tux-radius-sm)',
        borderColor: 'var(--tux-border)',
        hoverBorderColor: 'var(--tux-text-muted)',
        focusBorderColor: 'var(--tux-primary)',
        checkedBackground: 'var(--tux-primary)',
        checkedHoverBackground: 'var(--tux-primary)',
        checkedBorderColor: 'var(--tux-primary)',
        checkedHoverBorderColor: 'var(--tux-primary)',
        checkedFocusBorderColor: 'var(--tux-primary)',
      },
      icon: {
        checkedColor: 'var(--tux-primary-text)',
        checkedHoverColor: 'var(--tux-primary-text)',
      },
    },
    divider: {
      root: { borderColor: 'var(--tux-border-subtle)' },
      content: { background: 'var(--tux-surface)', color: 'var(--tux-text-muted)' },
    },
  },
});
