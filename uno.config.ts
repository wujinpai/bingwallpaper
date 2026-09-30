import { defineConfig, presetIcons, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      primary: '#8B3DFF',
      'primary-dark': '#7634D9',
      secondary: '#595D69',
      ink: '#191A1F',
      light: '#F7F8F9',
      danger: '#D6293E',
      warning: '#F7C32E',
      success: '#0CBC87',
      info: '#4F9EF8',
    },
  },
  shortcuts: [
    ['container-page', 'mx-auto w-full max-w-1300px px-3 md:px-4'],
    ['card-round', 'relative of-hidden rounded-[11.2px]'],
    ['section-block', 'container-page mt-8 md:mt-12'],
    ['section-title', 'text-[26px] text-ink font-bold leading-tight md:text-[30px]'],
    ['section-subtitle', 'mt-1 text-[15px] text-secondary'],
    ['meta-text', 'text-[12.75px] text-secondary'],
    ['btn-pill', 'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium leading-none transition-all duration-200'],
    ['btn-soft', 'inline-flex items-center gap-1 rounded bg-secondary:10 px-4 py-2 text-sm text-secondary transition-colors duration-200 hover:bg-secondary:20'],
    ['icon-btn', 'grid h-9 w-9 place-items-center rounded-full border-1 border-black:10 text-lg text-secondary transition-colors duration-200 hover:(border-primary bg-primary text-white)'],
  ],
  presets: [
    presetUno({ dark: 'class' }),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})