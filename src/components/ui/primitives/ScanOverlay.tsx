type Props = {
  scope?: "page" | "canvas";
};

export function ScanOverlay({ scope = "page" }: Props) {
  if (scope === "canvas") {
    return (
      <>
        <div className="canvas-grid" aria-hidden />
        <div className="canvas-radial" aria-hidden />
        <div className="canvas-scan" aria-hidden />
        <div className="canvas-beam" aria-hidden />
      </>
    );
  }
  return (
    <>
      <div className="bg-grid" aria-hidden />
      <div className="bg-radial" aria-hidden />
      <div className="bg-scan" aria-hidden />
      <div className="bg-beam" aria-hidden />
    </>
  );
}
