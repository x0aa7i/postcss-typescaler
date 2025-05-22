import postcss from "postcss";
import { describe, expect, it } from "vitest";

import typeScaler from "../index.js";
import { PluginOptions } from "../types.js";

const processCss = async (css: string, config?: PluginOptions) => {
  return postcss([typeScaler(config)]).process(css, { from: undefined });
};

describe("Configuration Options", () => {
  it("should return empty declarations if no preset or steps are defined", async () => {
    const css = /* css */ "@typescaler {}";
    const result = await processCss(css);
    expect(result.css).toBe("");
  });

  it("should use tailwind preset if provided", async () => {
    const css = /* css */ "@typescaler { preset: 'tailwind'; }";
    const result = await processCss(css);

    const rawSizes = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"];
    const expectedTextSizes = rawSizes.flatMap((size) => {
      const baseVar = `--text-${size}`;
      return [baseVar, `${baseVar}--line-height`];
    });

    for (const size of expectedTextSizes) {
      expect(result.css).toContain(size);
    }
  });

  it("should override plugin config with @typescaler rule settings", async () => {
    const css = /* css */ `
      @typescaler {
        font-size: 18;
        scale: 1.3;
        line-height: 1.5;
        prefix: "override";
        rounded: true;

        --md: 0;
        --lg: 1;
        --xl: 2;
      }
    `;

    const config = {
      fontSize: 16,
      scale: 1.2,
      lineHeight: 1.6,
      prefix: "text",
      rounded: true,
    };

    const result = await processCss(css, config);

    expect(result.css).toContain("--override-md: 1.125rem /* 18px */");
    expect(result.css).toContain("--override-lg: 1.438rem /* 23px */");
    expect(result.css).toContain("--override-xl: 1.875rem /* 30px */");
  });

  it("should use plugin configuration when no @typescaler rule is present", async () => {
    const css = "@typescaler {}";
    const config = {
      fontSize: 20,
      scale: 1.3,
      lineHeight: 1.8,
      prefix: "font",
      steps: {
        small: -1,
        regular: 0,
        large: 1,
      },
    };
    const result = await processCss(css, config);

    expect(result.css).toContain("--font-small:");
    expect(result.css).toContain("--font-regular:");
    expect(result.css).toContain("--font-large:");
    expect(result.css).not.toContain("--text-base:");
    expect(result.css).not.toContain("--text-lg:");
  });

  it("should handle different font-size units (px, rem, em)", async () => {
    // 'em' and 'rem' are relative to the base font size, which is 16px
    const cssRem = /* css */ `
        @typescaler {
          font-size: 1.5rem;
          scale: 1.2;
          rounded: false;
          --base: 0;
          --lg: 1;
        }
      `;

    const resultRem = await processCss(cssRem);
    expect(resultRem.css).toContain("--text-base: 1.5rem /* 24px */;");
    expect(resultRem.css).toContain("--text-lg: 1.8rem /* 28.8px */;"); // 24 * 1.2 = 28.8  -> 1.8rem

    const cssEm = /* css */ `
        @typescaler {
          font-size: 1.2em;
          scale: 1.2;
          --base: 0;
          --lg: 1;
        }
      `;
    const resultEm = await processCss(cssEm);
    expect(resultEm.css).toContain("--text-base: 1.188rem /* 19px */;"); // 19.2 * 1 = 19.2... rounded to 19px -> 1.188em
    expect(resultEm.css).toContain("--text-lg: 1.438rem /* 23px */;"); // 19.2 * 1.2 = 23.04... rounded to 23px -> 1.438em

    const cssPx = /* css */ `
        @typescaler {
          font-size: 16px;
          scale: 1.2;
          --sm: -1;
        }
      `;
    const resultPx = await processCss(cssPx);
    expect(resultPx.css).toContain("--text-sm: 0.813rem /* 13px */;"); // 16 * 1.2^-1 = 13.33... rounded to 13px -> 0.813rem

    const cssUnitless = /* css */ `
        @typescaler {
          font-size: 20;
          scale: 1.2;
          --base: 0;
        }
      `;
    const resultUnitless = await processCss(cssUnitless);
    expect(resultUnitless.css).toContain("--text-base: 1.25rem /* 20px */;"); // 20 * 1.2^0 = 20px -> 1.25rem
  });

  it("should handle different line-height units (unitless, rem, px)", async () => {
    const css = /* css */ `
         @typescaler {
           font-size: 16;
           scale: 1.2;
           line-height: 1.5; /* Unitless default */

           @sm {
             step: -1;
             line-height: 1.4rem; /* rem override */
           }
           --base: 0;
           --lg: 1 24px; /* px override using shorthand */
         }
       `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-sm--line-height: 1.4rem");
    expect(result.css).toContain("--text-base--line-height: 1.5"); // Default unitless applied
    expect(result.css).toContain("--text-lg--line-height: 24px"); // Should keep px unit if provided
  });

  it("should output px with decimal places when rounded is false", async () => {
    const css = /* css */ `
        @typescaler {
          font-size: 16;
          scale: 1.2;
          rounded: false;
          --lg: 1; /* 16 * 1.2^1 = 19.2 */
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-lg: 1.2rem /* 19.2px */;");
  });

  it("should round px to the nearest integer when rounded is true (default)", async () => {
    const css = /* css */ `
          @typescaler {
            font-size: 16;
            scale: 1.4;
            rounded: true; /* Explicitly true, but default */
            --lg: 1; /* 16 * 1.4^1 = 22.4, rounded to 22 */
          }
        `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-lg: 1.375rem /* 22px */;"); // 19px converted to rem
  });

  it("should generate CSS variables with a custom prefix", async () => {
    const css = /* css */ `
        @typescaler {
          prefix: "custom-text";
          --base: 0;
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--custom-text-base:");
    expect(result.css).not.toContain("--text-base:");
  });
});

describe("Breakpoint Syntax and Definitions", () => {
  it("should define steps using css custom properties", async () => {
    const css = /* css */ `
        @typescaler {
          font-size: 16px;
          --md: 0;
          --lg: 1;
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-md:");
    expect(result.css).toContain("--text-lg:");
    expect(result.css).not.toContain("--text-base:"); // Not explicitly defined
  });

  it("should define steps using @step { ... } block syntax", async () => {
    const css = /* css */ `
        @typescaler {
          @sm {
            step: -1;
          }
          @md {
            step: 0;
          }
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-sm:");
    expect(result.css).toContain("--text-md:");
    expect(result.css).toContain("--text-md--line-height: 1.5");
    expect(result.css).not.toContain("--text-base:"); // Not explicitly defined
  });

  it("should define steps using --[name] step line-height letter-spacing shorthand", async () => {
    const css = /* css */ `
        @typescaler {
          --xl: 2 1.8 -0.03em;
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-xl:");
    expect(result.css).toContain("--text-xl--line-height: 1.8");
    expect(result.css).toContain("--text-xl--letter-spacing: -0.03em");
  });

  it("should define steps using both css custom properties and @step { ... } block syntax", async () => {
    const css = /* css */ `
        @typescaler {
          --sm: -1;
          @md {
            step: 0;
            line-height: 1.5;
          }
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--text-sm:");
    expect(result.css).toContain("--text-md:");
    expect(result.css).toContain("--text-md--line-height: 1.5");
    expect(result.css).not.toContain("--text-base:"); // Not explicitly defined
  });

  it("should remove the AtRules from the output", async () => {
    const css = /* css */ `
        @typescaler {
          font-size: 16;
          scale: 1.2;
          --md: 0;
          --lg: 1;
        }
        body { color: red; } /* Ensure other CSS is kept */
      `;
    const result = await processCss(css);
    expect(result.css).not.toContain("@typescaler");
    expect(result.css).not.toContain("--md");
    expect(result.css).not.toContain("--lg");
    expect(result.css).toContain("body { color: red; }");
  });
});

describe("Warnings", () => {
  it("should warn for invalid scale and use default", async () => {
    const css = /* css */ `
        @typescaler {
          scale: invalid;
          --lg: 1;
        }
      `;
    const result = await processCss(css);
    const warning = result.messages[0];
    expect(warning.text).toBe('Could not parse "scale" value "invalid". Skipping.');
    expect(result.css).toContain("--text-lg: 1.125rem /* 18px */;"); // using default scale of 1.125
  });

  it("should handle missing step in @step", async () => {
    const css = /* css */ `
      @typescaler {
        font-size: 16;
        scale: 1.2;
        line-height: 1.5;
        prefix: "text";
        rounded: true;

        @sm {
          line-height: 1.4;
        }
      }
    `;

    const result = await processCss(css);

    expect(result.messages).toHaveLength(1);
    const warning = result.messages[0];
    expect(warning.plugin).toBe("postcss-typescaler");
    expect(warning.text).toBe(
      'Invalid config for "sm" step. fontSize and step are both undefined. Skipping.'
    );
  });
});
