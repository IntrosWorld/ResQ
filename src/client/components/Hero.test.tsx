// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders a full homepage hero with navigation, product framing, and dashboard handoff", () => {
    render(<Hero onStart={vi.fn()} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Homepage" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "SafePath AI" })).toBeInTheDocument();
    expect(screen.getByText("AI evacuation routing for hotels and large buildings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open command center/i })).toBeInTheDocument();
    expect(screen.getByText("Dashboard preview below")).toBeInTheDocument();
  });
});
