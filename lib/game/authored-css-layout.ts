export type AuthoredLayoutRule = {
  selector: string;
  min: number;
  max: number;
  declarations: Record<string, string>;
};

// A bounded warning heuristic, not a browser layout engine. Resolve source order
// for identical selectors before judging widths, including media breakpoints.
export function authoredWidthsFit(rules: AuthoredLayoutRule[]): boolean {
  const viewports = new Set([320]);
  for (const rule of rules) {
    for (const edge of [rule.min, rule.max]) {
      if (!Number.isFinite(edge) || edge < 320) continue;
      viewports.add(edge);
      viewports.add(edge + 0.01);
      if (edge > 320) viewports.add(Math.max(320, edge - 0.01));
    }
  }
  for (const viewport of viewports) {
    const cascade = new Map<string, Record<string, string>>();
    for (const rule of rules) {
      if (viewport < rule.min || viewport > rule.max) continue;
      for (const selector of rule.selector.split(',').map(value => value.trim())) {
        cascade.set(selector, {...cascade.get(selector), ...rule.declarations});
      }
    }
    const pixels = (value: string | undefined): number | undefined => {
      const fixed = /^(\d+(?:\.\d+)?)(px|rem|em|vw|%)$/.exec(value ?? '');
      if (!fixed) return undefined;
      const size = Number(fixed[1]);
      return fixed[2] === 'px' ? size : ['rem', 'em'].includes(fixed[2]) ? size * 16 : size * viewport / 100;
    };
    for (const declarations of cascade.values()) {
      const minimum = pixels(declarations['min-width']);
      const width = pixels(declarations.width);
      const maximum = pixels(declarations['max-width']);
      // CSS min-width wins over max-width; a width alone can be capped safely.
      if (minimum !== undefined && minimum > viewport) return false;
      if (width !== undefined && Math.min(width, maximum ?? Infinity) > viewport) return false;
      if (declarations['white-space'] === 'nowrap') return false;
    }
  }
  return true;
}
