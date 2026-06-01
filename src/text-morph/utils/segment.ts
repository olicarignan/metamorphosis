export type Segment = {
  id: string;
  string: string;
};

const NBSP = " ";

export function segmentText(
  value: string,
  locale: Intl.LocalesArgument,
): Segment[] {
  const byWord = value.includes(" ");

  if (typeof Intl.Segmenter !== "undefined") {
    const segmenter = new Intl.Segmenter(locale, {
      granularity: byWord ? "word" : "grapheme",
    });

    const segments: Segment[] = [];
    const seen = new Set<string>();
    for (const { segment, index } of segmenter.segment(value)) {
      if (segment === " ") {
        segments.push({ id: `space-${index}`, string: NBSP });
        continue;
      }
      pushSegment(segments, seen, segment, index);
    }
    return segments;
  }

  return segmentsFallback(value, byWord);
}

// First occurrence of a string keeps the bare string as its id; later
// duplicates are disambiguated with their index. A Set tracks which strings
// have already been claimed so this stays O(n) instead of scanning the array.
function pushSegment(
  segments: Segment[],
  seen: Set<string>,
  part: string,
  index: number,
) {
  if (seen.has(part)) {
    segments.push({ id: `${part}-${index}`, string: part });
  } else {
    seen.add(part);
    segments.push({ id: part, string: part });
  }
}

function segmentsFallback(value: string, byWord: boolean): Segment[] {
  const parts = byWord ? value.split(" ") : value.split("");
  const segments: Segment[] = [];
  const seen = new Set<string>();

  parts.forEach((part, index) => {
    if (byWord && index > 0) {
      segments.push({ id: `space-${index}`, string: NBSP });
    }
    pushSegment(segments, seen, part, index);
  });

  return segments;
}
