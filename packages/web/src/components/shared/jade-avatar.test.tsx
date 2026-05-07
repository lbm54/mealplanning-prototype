/**
 * Unit test: JadeAvatar renders the "J" letter.
 */
import { render, screen } from "@testing-library/react";
import { JadeAvatar } from "./jade-avatar";

describe("JadeAvatar", () => {
  it("renders the J letter at 36px size", () => {
    render(<JadeAvatar size={36} />);
    expect(screen.getByText("J")).toBeTruthy();
  });

  it("adds animate-pulse class when state is thinking", () => {
    render(<JadeAvatar size={36} state="thinking" />);
    const el = screen.getByLabelText(/thinking/i);
    expect(el.className).toContain("animate-pulse");
  });

  it("renders at 96px without error", () => {
    render(<JadeAvatar size={96} />);
    expect(screen.getByText("J")).toBeTruthy();
  });
});
