import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FileDropzone } from "@/components/molecules/FileDropzone";

describe("FileDropzone", () => {
  it("exposes an accessible name and is reachable via Tab (AC-15/NFR-4)", async () => {
    render(<FileDropzone onFileSelected={vi.fn()} accept="image/png" />);

    const dropzone = screen.getByRole("button", { name: "Upload an image" });
    expect(dropzone).toBeInTheDocument();

    await userEvent.tab();
    expect(dropzone).toHaveFocus();
  });

  it("opens the file browser when activated via Enter or Space (AC-15/NFR-4)", async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<FileDropzone onFileSelected={vi.fn()} accept="image/png" />);

    const dropzone = screen.getByRole("button", { name: "Upload an image" });
    dropzone.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(clickSpy).toHaveBeenCalledTimes(2);
    clickSpy.mockRestore();
  });

  it("calls onFileSelected with the chosen file", async () => {
    const onFileSelected = vi.fn();
    const { container } = render(<FileDropzone onFileSelected={onFileSelected} accept="image/png" />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "photo.png", { type: "image/png" });

    await userEvent.upload(input, file);

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("renders the given error message as an alert (AC-2)", () => {
    render(<FileDropzone onFileSelected={vi.fn()} accept="image/png" error="Unsupported file type." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported file type.");
  });

  it("is not reachable via Tab and cannot be clicked open when disabled", () => {
    render(<FileDropzone onFileSelected={vi.fn()} accept="image/png" disabled />);
    const dropzone = screen.getByRole("button", { name: "Upload an image" });
    expect(dropzone).toHaveAttribute("tabindex", "-1");
    expect(dropzone).toHaveAttribute("aria-disabled", "true");
  });
});
