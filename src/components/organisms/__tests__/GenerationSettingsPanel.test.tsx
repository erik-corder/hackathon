import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { useGenerationSettings } from "@/components/features/settings/useGenerationSettings";
import { GenerationSettingsPanel } from "@/components/organisms/GenerationSettingsPanel";

/** Wires the real feature hook, matching how `page.tsx` composes the organism
 * (§8 of `02-plan.md` — business logic lives in the hook, not the organism). */
function Harness() {
  const settings = useGenerationSettings();
  return <GenerationSettingsPanel {...settings} />;
}

describe("GenerationSettingsPanel", () => {
  it("exposes an accessible name for every control, incl. the randomize action (AC-25/NFR-8)", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Resolution")).toBeInTheDocument();
    expect(screen.getByLabelText("Seed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Randomize seed" })).toBeInTheDocument();
    expect(screen.getByLabelText("Decimation target")).toBeInTheDocument();
    expect(screen.getByLabelText("Texture size")).toBeInTheDocument();
  });

  it("is reachable, in order, via Tab for every control (AC-25/NFR-8)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    expect(screen.getByLabelText("Resolution")).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText("Seed")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Randomize seed" })).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText("Decimation target")).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText("Texture size")).toHaveFocus();
  });

  it("updates the resolution value on selection, via standard select interaction (AC-17/AC-25)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const select = screen.getByLabelText("Resolution") as HTMLSelectElement;
    await user.selectOptions(select, "512");

    expect(select.value).toBe("512");
  });

  it("changes the seed value when Randomize seed is activated via Enter (FR-16/AC-20/AC-25)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const seedInput = screen.getByLabelText("Seed") as HTMLInputElement;
    const before = seedInput.value;
    const randomizeButton = screen.getByRole("button", { name: "Randomize seed" });

    // Two random 32-bit integers matching is astronomically unlikely but not
    // impossible; retry defensively rather than asserting a single sample.
    let changed = false;
    for (let attempt = 0; attempt < 5 && !changed; attempt += 1) {
      randomizeButton.focus();
      await user.keyboard("{Enter}");
      changed = seedInput.value !== before;
    }
    expect(changed).toBe(true);
  });

  it("updates decimationTarget/textureSize when typed into (AC-17/AC-25)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const decimationInput = screen.getByLabelText("Decimation target") as HTMLInputElement;
    await user.clear(decimationInput);
    await user.type(decimationInput, "150000");
    expect(decimationInput.value).toBe("150000");

    const textureInput = screen.getByLabelText("Texture size") as HTMLInputElement;
    await user.clear(textureInput);
    await user.type(textureInput, "2048");
    expect(textureInput.value).toBe("2048");
  });
});
