# 🎚️ PostCSS TypeScaler

A PostCSS plugin that simplifies **typographic scale generation** using **CSS custom properties**. Define your desired scale once, and `postcss-typescaler` automatically outputs CSS variables for various font sizes and line heights based on a modular scale. This helps maintain a consistent and harmonious typography in your project.

## 🚀 Installation

```bash
npm install postcss-typescaler
```

```bash
pnpm add postcss-typescaler
```

## 🔧 Setup

Integrate the plugin into your PostCSS configuration:

```javascript
// postcss.config.js
import typescaler from "postcss-typescaler";

export default {
  plugins: [typescaler(/* options */)],
};
```

Or use directly in your JavaScript code:

```javascript
import { postcss } from "postcss";
import typescaler from "postcss-typescaler";

const processor = postcss([typescaler(/* options */)]).process(cssInput);
const result = processor.css;
```

## 📖 Usage (CSS)

### Define Scales with @typescaler

Use the @typescaler at-rule to define global options and individual type steps in CSS.

```css
/*
  The @typescaler at-rule will be replaced by generated CSS custom properties.
  Options defined here override those in postcss.config.js.
*/
@typescaler {
  /* Global options for the scale */
  scale: 1.2; /* Override the default scale */
  font-size: 18px; /* New base font size (can be px, rem, em, or unitless) */
  line-height: 1.6;
  prefix: "typescale"; /* Custom prefix for your variables */
  preset: "default"; /* Use a built-in preset for initial steps */

  /*
    Define individual steps using a custom property.
    --[step-name]: [step-value] [line-height-value] [letter-spacing-value];
    values are space-separated
  */
  --sm: -1; /* step: -1, uses global line-height */
  --base: 0 1.5; /* step: 0, lineHeight: 1.5 */
  --lg: 1 1.2 0.05em; /* step: 1, lineHeight: 1.2, letterSpacing: 0.05em */
}

/* Example usage of the generated variables in your CSS */
.title {
  font-size: var(--typescale-lg);
  line-height: var(--typescale-lg--line-height);
  letter-spacing: var(--typescale-lg--letter-spacing);
}
```

### Alternative Syntax

Define steps with granular control using `--step`, `--font-size`, `--line-height`, and `--letter-spacing`:

```css
/* input.css */

@typescaler {
  /* ... Global options ... */

  --xs--step: -2; /* Equivalent to --xs: -2 */
  --xs--line-height: 1.3;

  --md--font-size: 1rem; /* Explicit font size overrides the scale calculation */
  --md--line-height: calc(2 / 1.5);
  --md--letter-spacing: -0.01em;
}
```

### Output Example

Input:

```css
@typescaler {
  scale: 1.25;
  font-size: 16px;

  --base: 0 1.6;
  --lg: 1;
}
```

Output:

```css
:root {
  --typescale-base: 1rem; /* 16px */
  --typescale-base--line-height: 1.6;
  --typescale-lg: 1.25rem; /* 20px */
  --typescale-lg--line-height: 1.5;
}
```

### Option Resolution Order

The plugin resolves options using the following precedence (last wins):

1. **Default Options**: Internal defaults within the plugin.
2. **JavaScript Options**: Options passed directly to the plugin in `postcss.config.js`.
3. **CSS Options**: Options defined directly as declarations within the `@typescaler` at-rule in CSS (e.g., `scale: 1.2;`).

Steps are resolved in the following order (last wins):

1. **JavaScript Steps**: Individual steps defined in the `steps` property of the JavaScript plugin options.
2. **Preset Steps**: If a `preset` (e.g., `'tailwind'`, `'default'`) is specified.
3. **CSS Steps**: Steps defined as CSS custom properties within the `@typescaler` at-rule (e.g., `--md: 0 1.5;`).

## ⚙️ Options

You can configure `postcss-typescaler` by passing an options object to the plugin.

| Option Name  | Type                        | Default     | Description                                                                                                                                                                                                                                                                                                                                        |
| :----------- | :-------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scale`      | `number`                    | `1.125`     | The base value used for calculating font sizes on the modular scale. A larger `scale` results in more pronounced size differences between steps.                                                                                                                                                                                                   |
| `fontSize`   | `number` or `string`        | `16`        | The fundamental font size in pixels, serving as the base for all calculations. Unitless numbers are treated as pixels (e.g., `16` is `16px`).                                                                                                                                                                                                      |
| `lineHeight` | `number` or `string`        | `"1.5"`     | The default line height applied to all steps unless overridden. Can be a unitless number (e.g., `1.5`), a pixel value (`"24px"`), or a `rem` value (`"1.5rem"`).                                                                                                                                                                                   |
| `prefix`     | `string`                    | `"text"`    | A string prefix for generated CSS variables (e.g., `--typescale-xl` if prefix is "typescale").                                                                                                                                                                                                                                                     |
| `rounded`    | `boolean`                   | `true`      | If `true`, calculated pixel font sizes will be rounded to the nearest whole number.                                                                                                                                                                                                                                                                |
| `stepOffset` | `number`                    | `0`         | Adjusts all font size steps by this offset, including those from `steps` and `preset`. Positive values increase, negative values decrease the scale.                                                                                                                                                                                               |
| `preset`     | `"default"` or `"tailwind"` | `undefined` | A preset name to use for the default step configurations. Available presets: `"default"`, `"tailwind"`.                                                                                                                                                                                                                                            |
| `steps`      | `object`                    | `undefined` | A map of custom step names (e.g., `'sm'`, `'base'`, `'xl'`) to their configuration options. Step values can be provided as a direct number shorthand (e.g., `sm: -1`) or a detailed object (e.g., `base: { step: 0, lineHeight: 1.5 }`). These settings serve as defaults or fallbacks if no corresponding steps are defined directly in your CSS. |

### Type Step Configuration (`TypeStep`)

Individual type steps can be configured within the `steps` option (in JavaScript) or via nested at-rules/shorthand declarations (in CSS).

| Option Name     | Type                 | Description                                                                                                                                                                                                 |
| :-------------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `step`          | `number`             | The step value on the modular scale. A positive number for larger text, a negative number for smaller text. If `fontSize` is provided for this step, `step` is ignored.                                     |
| `fontSize`      | `string` or `number` | An explicit font size (e.g., `"16px"`, `"1rem"`) that overrides the modular scale calculation for this specific step. Unitless numbers are treated as pixels. If provided, `step` is ignored for this step. |
| `lineHeight`    | `string` or `number` | The line height for this step. Can be a unitless number (e.g., `1.5`), a pixel value (e.g., `"24px"`), or a `rem` value.                                                                                    |
| `letterSpacing` | `string`             | The letter spacing for this step. Accepts any valid CSS `letter-spacing` value.                                                                                                                             |

## 🎨 Presets

`postcss-typescaler` comes with two built-in presets to help you quickly establish a typographic system:

- **`"default"`** – A modular scale preset based on uniform `step` values. It includes a sensible set of typographic steps (`xs`, `sm`, `base`, `md`, `lg`, `xl`, `2xl`, ..., `9xl`) with predefined `lineHeight` values, making it a solid foundation for most projects.

- **`"tailwind"`** – This preset mimics Tailwind CSS’s default typography scale, which is not based on a consistent modular ratio. Instead, it uses hand-tuned, nonuniform step values to replicate Tailwind’s sizing. Use this only if you want
  👉 **Note**: For an exact match with Tailwind's font sizes, use the default plugin options:

  ```ts
  { scale: 1.125, rounded: true, }
  ```

**Example using a preset in your CSS:**

```css
@typescaler {
  preset: "default"; /* Apply the Default preset */

  /* You can still override individual steps from the preset */
  --base--font-size: 1.125rem; /* Override the 'base' font size from the Default preset */
  }
}
```

These presets provide a great starting point and can be customized further via overrides in your CSS.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request with ideas, improvements, or fixes.
