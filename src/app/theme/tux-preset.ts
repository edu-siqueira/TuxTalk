import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Campos de formulário do TuxTalk: fundo escuro, sem borda própria e sem anel de foco.
// Borda/foco/erro ficam a cargo do wrapper `.field` de cada tela (ver login.scss).
// Os valores vêm das variáveis --tux-* definidas em styles.scss.
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

export const TuxPreset = definePreset(Aura, {
  semantic: {
    formField: {
      paddingX: '0.5rem',
      paddingY: '0.5rem',
      borderRadius: '8px',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: 'none',
      },
    },
    colorScheme: {
      light: { formField: formFieldColors },
      dark: { formField: formFieldColors },
    },
  },
  components: {
    checkbox: {
      root: {
        borderColor: 'var(--tux-border)',
        hoverBorderColor: 'var(--tux-text-muted)',
        focusBorderColor: 'var(--tux-border)',
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
