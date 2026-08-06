import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudioLayout } from "@/components/templates/StudioLayout";

describe("StudioLayout", () => {
  it("renders three distinct labelled landmark regions, in left→center→right source order (FR-19/AC-23)", () => {
    render(
      <StudioLayout
        left={<div data-testid="left-slot">left content</div>}
        viewer={<div data-testid="viewer-slot">viewer content</div>}
        gallery={<div data-testid="gallery-slot">gallery content</div>}
      />,
    );

    const left = screen.getByRole("complementary", { name: "Upload and generation settings" });
    const viewer = screen.getByRole("main", { name: "3D viewer" });
    const gallery = screen.getByRole("complementary", { name: "Recent generations gallery" });

    expect(left).toBeInTheDocument();
    expect(viewer).toBeInTheDocument();
    expect(gallery).toBeInTheDocument();

    // Source order left -> center -> right (DOCUMENT_POSITION_FOLLOWING means "comes after").
    expect(left.compareDocumentPosition(viewer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(viewer.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByTestId("left-slot")).toBeInTheDocument();
    expect(screen.getByTestId("viewer-slot")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-slot")).toBeInTheDocument();
  });
});
