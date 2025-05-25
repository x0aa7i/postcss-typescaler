import type { PluginOptions } from "../types.js";

import postcss from "postcss";
import { describe, expect, it } from "vitest";

import typeScaler from "../index.js";

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
    const expectedTextSizes = rawSizes.map((size: string) => {
      const baseVar = `--type-${size}`;
      return [baseVar, `${baseVar}--line-height`];
    });

    for (const [size, lineHeight] of expectedTextSizes) {
      expect(result.css).toContain(size);
      expect(result.css).toContain(lineHeight);
    }
  });

  it("should override plugin js config with @typescaler css config", async () => {
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
    expect(result.css).not.toContain("--type-base:");
    expect(result.css).not.toContain("--type-lg:");
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
    expect(resultRem.css).toContain("--type-base: 1.5rem /* 24px */;");
    expect(resultRem.css).toContain("--type-lg: 1.8rem /* 28.8px */;"); // 24 * 1.2 = 28.8  -> 1.8rem

    const cssEm = /* css */ `
        @typescaler {
          font-size: 1.2em;
          scale: 1.2;
          --base: 0;
          --lg: 1;
        }
      `;
    const resultEm = await processCss(cssEm);
    expect(resultEm.css).toContain("--type-base: 1.188rem /* 19px */;"); // 19.2 * 1 = 19.2... rounded to 19px -> 1.188em
    expect(resultEm.css).toContain("--type-lg: 1.438rem /* 23px */;"); // 19.2 * 1.2 = 23.04... rounded to 23px -> 1.438em

    const cssPx = /* css */ `
        @typescaler {
          font-size: 16px;
          scale: 1.2;
          --sm: -1;
        }
      `;
    const resultPx = await processCss(cssPx);
    expect(resultPx.css).toContain("--type-sm: 0.813rem /* 13px */;"); // 16 * 1.2^-1 = 13.33... rounded to 13px -> 0.813rem

    const cssUnitless = /* css */ `
        @typescaler {
          font-size: 20;
          scale: 1.2;
          --base: 0;
        }
      `;
    const resultUnitless = await processCss(cssUnitless);
    expect(resultUnitless.css).toContain("--type-base: 1.25rem /* 20px */;"); // 20 * 1.2^0 = 20px -> 1.25rem
  });

  it("should handle different line-height units (unitless, rem, px)", async () => {
    const css = /* css */ `
         @typescaler {
           font-size: 16;
           scale: 1.2;
           line-height: 1.5; /* Unitless default */

           --sm--step: -1;
           --sm--line-height: 1.4rem; /* rem override */

           --base: 0;
           --lg: 1 24px; /* px override using shorthand */
         }
       `;
    const result = await processCss(css);
    expect(result.css).toContain("--type-sm--line-height: 1.4rem");
    expect(result.css).toContain("--type-base--line-height: 1.5"); // Default unitless applied
    expect(result.css).toContain("--type-lg--line-height: 24px"); // Should keep px unit if provided
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
    expect(result.css).toContain("--type-lg: 1.2rem /* 19.2px */;");
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
    expect(result.css).toContain("--type-lg: 1.375rem /* 22px */;"); // 19px converted to rem
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
    expect(result.css).not.toContain("--type-base:");
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
    expect(result.css).toContain("--type-md:");
    expect(result.css).toContain("--type-lg:");
    expect(result.css).not.toContain("--type-base:"); // Not explicitly defined
  });

  it("should define steps using --[name]--[prop] shorthand", async () => {
    const css = /* css */ `
        @typescaler {
          --sm: -1;
          --sm--line-height: 1.4;
          --sm--letter-spacing: -0.01em;
          --md--step: 0;
          --md--line-height: 1.5;
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--type-sm:");
    expect(result.css).toContain("--type-md:");
    expect(result.css).toContain("--type-md--line-height: 1.5");
    expect(result.css).not.toContain("--type-base:"); // Not explicitly defined
  });

  it("should define steps using --[name] step line-height letter-spacing shorthand", async () => {
    const css = /* css */ `
        @typescaler {
          --xl: 2 1.8 -0.03em;
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--type-xl:");
    expect(result.css).toContain("--type-xl--line-height: 1.8");
    expect(result.css).toContain("--type-xl--letter-spacing: -0.03em");
  });

  it("should define steps using both css shorthand and --[name]--[prop] syntax", async () => {
    const css = /* css */ `
        @typescaler {
          --sm: -1 1.5 -0.01em;
          --md: 0;
          --md--line-height: 1.5;
        }
      `;
    const result = await processCss(css);
    expect(result.css).toContain("--type-sm:");
    expect(result.css).toContain("--type-sm--line-height: 1.5");
    expect(result.css).toContain("--type-md:");
    expect(result.css).toContain("--type-md--line-height: 1.5");
    expect(result.css).not.toContain("--type-base:"); // Not explicitly defined
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

describe("Complex Merging Scenarios", () => {
  it("should correctly merge configurations: JS < Preset < CSS", async () => {
    const jsOptions: PluginOptions = {
      prefix: "js", // Will be overridden by CSS
      steps: {
        md: { step: 0 }, // JS provides base step
      },
      preset: "default", // Default preset might provide lineHeight for 'md'
      // DEFAULT_OPTIONS.prefix is 'type', DEFAULT_STEPS.md.lineHeight is '1.5'
    };
    const css = /* css */ `
      @typescaler {
        prefix: "css"; /* CSS overrides JS prefix */
        --md--font-size: 16px; /* CSS provides explicit fontSize, overriding any preset calculation for fontSize */
        --md--letter-spacing: 0.05em; /* CSS adds letterSpacing */
      }
    `;

    const result = await processCss(css, jsOptions);
    expect(result.css).toContain("--css-md: 16px;"); // fontSize from CSS
    expect(result.css).toContain("--css-md--line-height: 1.5;"); // lineHeight from preset
    expect(result.css).toContain("--css-md--letter-spacing: 0.05em;"); // letterSpacing from CSS
    // 'step: 0' is used in calculation if fontSize wasn't explicit. Here fontSize is explicit.
  });

  it("should deepMerge step configurations from JS and CSS", async () => {
    const jsOptions: PluginOptions = {
      steps: {
        sm: { step: -1, lineHeight: "1.4" },
      },
    };
    const css = /* css */ `
      @typescaler {
        --sm--letter-spacing: 0.01em;
        --sm--font-size: 14px; /* Also add/override fontSize via CSS */
      }
    `;

    const result = await processCss(css, jsOptions);
    expect(result.css).toContain("--type-sm: 14px;"); // fontSize from CSS (default prefix 'type' as none in CSS/JS options)
    expect(result.css).toContain("--type-sm--line-height: 1.4;"); // lineHeight from JS
    expect(result.css).toContain("--type-sm--letter-spacing: 0.01em"); // letterSpacing from CSS (removed semicolon for toContain robustness)
    // step: -1 from JS is used if fontSize is not specified. Here CSS specifies fontSize.
  });
});

describe("stepOffset Option Tests", () => {
  it("should apply stepOffset from JS options", async () => {
    const jsOptions: PluginOptions = {
      stepOffset: 1, // Shift all steps up by 1
      steps: {
        base: { step: 0 }, // Effective step: 0 + 1 = 1
        // 16 * 1.125^1 = 18px (default scale, default prefix 'type')
      },
    };
    const css = /* css */ `@typescaler {}`;
    const result = await processCss(css, jsOptions);
    expect(result.css).toContain("--type-base: 1.125rem /* 18px */;");
  });

  it("should apply stepOffset from CSS options", async () => {
    const css = /* css */ `
      @typescaler {
        step-offset: -1; /* Shift all steps down by 1 */
        --base: 0; /* Effective step: 0 - 1 = -1 */
      }
    `;
    const result = await processCss(css);
    expect(result.css).toContain("--type-base: 0.875rem /* 14px */;");
  });

  it("CSS stepOffset should override JS stepOffset", async () => {
    const jsOptions: PluginOptions = {
      stepOffset: 2, // This should be ignored
    };
    const css = /* css */ `
      @typescaler {
        step-offset: 1; /* This should be used */
        --base: 0; /* Effective step: 0 + 1 = 1 */
                     /* 16 * 1.125^1 = 18px */
      }
    `;
    const result = await processCss(css, jsOptions);
    expect(result.css).toContain("--type-base: 1.125rem /* 18px */;");
  });

  it("stepOffset should not affect explicitly set fontSize values", async () => {
    const css = /* css */ `
      @typescaler {
        step-offset: 2;
        --explicit: 0; /* This step would normally be scaled */
        --explicit--font-size: 30px; /* But fontSize is explicit */
      }
    `;
    const result = await processCss(css);
    expect(result.css).toContain("--type-explicit: 30px;");
    // Check that line-height is still generated
    expect(result.css).toContain("--type-explicit--line-height:");
  });
});

describe("Warnings", () => {
  // Helper to check for a specific warning message
  const expectWarning = (result: import("postcss").Result, message: string) => {
    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          plugin: "postcss-typescaler",
          text: message,
          type: "warning",
        }),
      ])
    );
  };

  it("should warn for invalid scale and use default", async () => {
    const css = /* css */ `
        @typescaler {
          scale: invalid;
          --lg: 1;
        }
      `;
    const result = await processCss(css);
    expectWarning(result, 'Could not parse "scale" value "invalid". Skipping.');
    expect(result.css).toContain("--type-lg: 1.125rem /* 18px */;"); // using default scale of 1.125
  });

  it("Parser: should warn for unknown property in @typescaler rule options", async () => {
    const css = /* css */ `
      @typescaler {
        unknownOption: true;
      }
    `;
    const result = await processCss(css);
    expectWarning(result, 'Unknown property "unknownOption" in @typescaler rule. Skipping.');
  });

  it("Parser: should warn for unparseable value for a known option", async () => {
    // Example: scale already tested. Let's try step-offset
    const css = /* css */ `
      @typescaler {
        step-offset: "not-a-number";
      }
    `;
    const result = await processCss(css);
    expectWarning(result, 'Could not parse "stepOffset" value ""not-a-number"". Skipping.');
  });

  it("Parser: should warn for unknown property in a step definition", async () => {
    const css = /* css */ `
      @typescaler {
        --myStep--unknownProp: 1;
      }
    `;
    const result = await processCss(css);
    expectWarning(result, 'Unknown property "unknownProp" in --myStep--unknownProp. Ignoring.');
  });

  it("Parser: should warn for unparseable value in a step definition (property-specific)", async () => {
    const css = /* css */ `
      @typescaler {
        --myStep--step: not-a-step-value;
      }
    `;
    const result = await processCss(css);
    expectWarning(
      result,
      'Could not parse "step" value "not-a-step-value" associated with --myStep. Skipping.'
    );
  });

  it("Parser: should warn for unparseable value in a step definition (shorthand)", async () => {
    const css = /* css */ `
      @typescaler {
        --myStep: not-a-step-value 1.5;
      }
    `;
    const result = await processCss(css);
    expectWarning(result, 'Could not parse "step" value "not-a-step-value" in shorthand --myStep. Skipping.');
  });

  // Normalizer Warnings
  it("Normalizer: should warn and use default for invalid fontSize unit in JS options", async () => {
    const jsOptions: PluginOptions = { fontSize: "invalid-unit" as any };
    const result = await processCss("@typescaler {}", jsOptions); // Added dummy @typescaler for log processing
    expectWarning(result, 'Invalid fontSize value "invalid-unit". Using default value: 16.');
  });

  it("Normalizer: should warn for unknown property in JS options", async () => {
    const jsOptions = { unknownJsOption: "hello" } as any;
    const result = await processCss("@typescaler {}", jsOptions); // Added dummy @typescaler
    expectWarning(result, 'Unknown property "unknownJsOption" in @typescaler rule. Skipping.');
  });

  it("Normalizer: should warn for unknown property within a JS step definition", async () => {
    const jsOptions: PluginOptions = {
      steps: {
        myStep: { unknownProp: "value" } as any,
      },
    };
    const result = await processCss("@typescaler {}", jsOptions); // Added dummy @typescaler
    expectWarning(result, 'Unknown property "unknownProp" in @myStep step. Skipping.');
  });

  it("Normalizer: should warn for invalid value within a JS step definition that normalizer skips", async () => {
    const jsOptions: PluginOptions = {
      steps: {
        myStep: { step: "foo" as any },
      },
    };
    const result = await processCss("@typescaler {}", jsOptions); // Added dummy @typescaler
    expectWarning(result, 'Invalid step value "foo" in @myStep. Skipping.');
  });

  it("Normalizer: should warn if a step lacks both step and fontSize after normalization (from JS)", async () => {
    const jsOptions: PluginOptions = {
      steps: {
        test: { lineHeight: 1.5 },
      },
    };
    const result = await processCss("@typescaler {}", jsOptions); // Added dummy @typescaler
    expectWarning(result, 'Invalid config for "test" step. fontSize and step are both undefined. Skipping.');
  });

  it("Normalizer: should warn and skip value if no default (e.g. preset in JS options)", async () => {
    const jsOptions: PluginOptions = {
      preset: "nonExistentPreset",
    };
    const result = await processCss("@typescaler {}", jsOptions); // Added dummy @typescaler
    expectWarning(result, 'Invalid preset value "nonExistentPreset". Skipping.');
  });

  it("should handle missing step in a declaration", async () => {
    const css = /* css */ `
      @typescaler {
        font-size: 16;
        scale: 1.2;
        line-height: 1.5;
        prefix: "text";
        rounded: true;

        --sm--line-height: 1.4;
      }
    `;

    const result = await processCss(css);
    expect(result.messages).toHaveLength(1);
    expectWarning(result, 'Invalid config for "sm" step. fontSize and step are both undefined. Skipping.');
  });
});
