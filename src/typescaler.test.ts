import { describe, expect, it, vi } from "vitest";
import postcss from "postcss";
import typeScaler from "./index.js";

describe("postcss-typescaler", () => {
  it("should generate CSS variables for Tailwind config", async () => {
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        line-height: 1.5;
        output-prefix: "text";
        round-to-px: true;
        tailwind-config: true;

        @level sm {
          step: -1;
          line-height: 1.4;
        }
        @level md {
          step: 0;
        }
        @level lg {
          step: 1;
        }
      }
    `;

    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-sm:");
    expect(result.css).toContain("--text-sm--line-height:");
    expect(result.css).toContain("--text-md:");
    expect(result.css).toContain("--text-md--line-height:");
    expect(result.css).toContain("--text-lg:");
    expect(result.css).toContain("--text-lg--line-height:");
  });

  it("should generate CSS variables based on plugin config", async () => {
    const css = "@typescaler { }";
    const config = {
      fontSize: 16,
      ratio: 1.25,
      lineHeight: 1.6,
      outputPrefix: "text",
      roundToPx: true,
      tailwindConfig: true,
    };
    const result = await postcss([typeScaler(config)]).process(css);
    expect(result.css).toContain("--text-lg: 1.25rem");
    expect(result.css).toContain("--text-xl: 1.563rem");
  });

  it("should handle different font-size units", async () => {
    const css = `
      @typescaler {
        font-size: 16px;
        ratio: 1.2;

        @level sm {
          step: -1;
        }
      }
    `;

    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-sm: 0.813rem /* 13px */");
  });

  it("should warn for invalid font-size", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const css = `
      @typescaler {
        font-size: invalid;
        ratio: 1.2;
        line-height: 1.5;
        output-prefix: "text";
        round-to-px: true;
        tailwind-config: true;

        @level sm {
          step: -1;
        }
      }
    `;

    await postcss([typeScaler()]).process(css, { from: undefined });
    expect(warnSpy).toHaveBeenCalledWith(
      '[postcss-typescaler]: Could not parse font-size value "invalid". Using 16.',
    );
    warnSpy.mockRestore();
  });

  it("should handle different line-height units", async () => {
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        line-height: 1.5;

        @level sm {
          step: -1;
          line-height: 1.4rem;
        }
      }
    `;

    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-sm--line-height: 1.4");
  });

  it("should warn for invalid line-height", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        line-height: 1.5;
        output-prefix: "text";
        round-to-px: true;
        tailwind-config: true;

        @level sm {
          step: -1;
          line-height: invalid;
        }
      }
    `;

    await postcss([typeScaler()]).process(css, { from: undefined });
    expect(warnSpy).toHaveBeenCalledWith(
      '[postcss-typescaler]: Could not parse line height number from "invalid".',
    );
    warnSpy.mockRestore();
  });

  it("should generate correct font-size and line-height", async () => {
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        line-height: 1.5;
        tailwind-config: true;

        @level sm {
          step: -1;
        }
        @level md {
          step: 0;
        }
      }
    `;

    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-sm: 0.813rem");
    expect(result.css).toContain("--text-sm--line-height: 1.5");
    expect(result.css).toContain("--text-md: 1rem");
    expect(result.css).toContain("--text-md--line-height: 1.5");
  });

  it("should handle missing @level name", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        line-height: 1.5;
        output-prefix: "text";
        tailwind-config: true;

        @level {
          step: -1;
        }
      }
    `;

    await postcss([typeScaler()]).process(css, { from: undefined });
    expect(warnSpy).toHaveBeenCalledWith(
      "[postcss-typescaler]: Skipping @level rule with no name in CSS source.",
    );
    warnSpy.mockRestore();
  });

  it("should handle missing step in @level", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        line-height: 1.5;
        output-prefix: "text";
        round-to-px: true;
        tailwind-config: true;

        @level sm {
          line-height: 1.4;
        }
      }
    `;

    await postcss([typeScaler()]).process(css, { from: undefined });
    expect(warnSpy).toHaveBeenCalledWith(
      "[postcss-typescaler]: 'step' not found for @level \"sm\". Using default step 0.",
    );
    warnSpy.mockRestore();
  });

  it("should return the correct CSS variables with default config", async () => {
    const css = "@typescaler {}";
    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-base");
    expect(result.css).toContain("--text-lg");
    expect(result.css).toContain("--text-xl");
    expect(result.css).toContain("--text-2xl");
    expect(result.css).toContain("--text-3xl");
  });

  it("should use the provided fontSize, ratio, and lineHeight", async () => {
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        height-ratio: 1.5;
      }
    `;
    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-sm: 0.813rem");
    expect(result.css).toContain("--text-sm--line-height: 1.5");
    expect(result.css).toContain("--text-base: 1rem");
    expect(result.css).toContain("--text-base--line-height: 1.5");
  });

  it("should output px with decimal places when round-to-px is false", async () => {
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        round-to-px: false;

        @level lg {
          step: 1;
        }
        @level xl {
          step: 2;
      }
      }
    `;
    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--text-lg: 1.2rem /* 19.2px */;");
    expect(result.css).toContain("--text-xl: 1.44rem /* 23.04px */;");
  });

  it("should remove the @typescaler rule and @level rules", async () => {
    const css = `
      @typescaler {
        font-size: 16;
        ratio: 1.2;
        output-prefix: "text";
        @level md {
          step: 0;
        }
        @level lg {
          step: 1;
        }
      }
    `;
    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).not.toContain("@typescaler");
    expect(result.css).not.toContain("@level");
  });

  it("should generate CSS variables with the outputPrefix", async () => {
    const css = `
      @typescaler {
        output-prefix: "custom-text";
        @level base {
          step: 0;
        }
      }
    `;
    const result = await postcss([typeScaler()]).process(css, { from: undefined });
    expect(result.css).toContain("--custom-text-base");
  });

  it("should not generate levels not defined in the configuration", async () => {
    const css = `
      @typescaler {
        @level sm {
          step: -1;
          line-height: 1.4;
        }
        @level md {
          step: 0;
        }
      }
    `;
    const result = await postcss([typeScaler()]).process(css, { from: undefined });

    expect(result.css).toContain("--text-sm");
    expect(result.css).toContain("--text-md");
    expect(result.css).not.toContain("--text-base");
    expect(result.css).not.toContain("--text-lg");
  });
});
