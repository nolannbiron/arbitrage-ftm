interface Token {
  readonly symbol: string;
  readonly address: string;
  readonly aggr?: string;
}

interface Tokens {
  readonly [key: string]: Token;
}

interface TokenPair {
  symbols: string;
  pairs: string[];
  factory: string;
}

interface ArbitragePair {
  symbols: string;
  pairs: [string, string];
  factory: string;
}

interface AmmFactories {
  readonly [propName: string]: string;
}
