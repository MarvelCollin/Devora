export interface IRegexRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
}

export interface IRegexMatch {
  index: number;
  end: number;
  text: string;
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export interface IRegexResponse {
  id: number;
  matches: IRegexMatch[];
  truncated: boolean;
  replaced: string;
  error: string | null;
}

const MATCH_LIMIT = 1000;

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<IRegexRequest>) => void) | null;
  postMessage: (message: IRegexResponse) => void;
};

const toMatch = (match: RegExpExecArray): IRegexMatch => ({
  index: match.index,
  end: match.index + match[0].length,
  text: match[0],
  groups: match.slice(1),
  named: { ...(match.groups ?? {}) },
});

scope.onmessage = (event) => {
  const { id, pattern, flags, text, replacement } = event.data;
  try {
    const regex = new RegExp(pattern, flags);
    const matches: IRegexMatch[] = [];
    let truncated = false;
    if (flags.includes("g")) {
      let match = regex.exec(text);
      while (match) {
        if (matches.length >= MATCH_LIMIT) {
          truncated = true;
          break;
        }
        matches.push(toMatch(match));
        if (match[0] === "") {
          const code = text.codePointAt(regex.lastIndex);
          regex.lastIndex += flags.includes("u") && code !== undefined && code > 0xffff ? 2 : 1;
        }
        match = regex.exec(text);
      }
    } else {
      const match = regex.exec(text);
      if (match) matches.push(toMatch(match));
    }
    const replaced = text.replace(new RegExp(pattern, flags), replacement);
    scope.postMessage({ id, matches, truncated, replaced, error: null });
  } catch (error) {
    scope.postMessage({
      id,
      matches: [],
      truncated: false,
      replaced: "",
      error: error instanceof Error ? error.message : "The pattern could not run.",
    });
  }
};
