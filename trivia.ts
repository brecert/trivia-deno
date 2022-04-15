// Utils

/** A simple typed version of the fetch {@link Response} to a request. */
export interface TypedResponse<
  T extends Record<string, unknown> | unknown = Record<string, unknown>,
> extends Response {
  json<
    P = T extends Record<string, unknown> ? T["application/json"] : unknown,
  >(): Promise<P>;
}

// deno-fmt-ignore
const encodeURLQueryString = (
  params: Record<string, string | number | boolean>,
) =>
  Object.keys(params)
    .map((k) => params[k] ? encodeURIComponent(k) + "=" + encodeURIComponent(params[k]) : "")
    .join("&");

// Main Types

/** Represents an OpenTDB question, encoded or not. */
export type Question = {
  type: string;
  category: string;
  question: string;
  difficulty: string;
  correct_answer: string;
  incorrect_answers: string[];
};

/** Represents an OpenTDB question, decoded */
export type DecodedQuestion = Question & {
  type: QuestionType;
  category: Category;
  difficulty: Difficulty;
};

/** Response code for OpenTDB responses */
export const enum ResponseCode {
  Success = 0,
  NoResults = 1,
  InvalidParameter = 2,
  TokenNotFound = 3,
  TokenEmpty = 4,
}

export enum Category {
  Any = "",

  "General Knowledge" = 9,
  "Entertainment: Books" = 10,
  "Entertainment: Film" = 11,
  "Entertainment: Music" = 12,
  "Entertainment: Musicals & Theatres" = 13,
  "Entertainment: Television" = 14,
  "Entertainment: Video Games" = 15,
  "Entertainment: Board Games" = 16,
  "Science & Nature" = 17,
  "Science: Computers" = 18,
  "Science: Mathematics" = 19,
  "Mythology" = 20,
  "Sports" = 21,
  "Geography" = 22,
  "History" = 23,
  "Politics" = 24,
  "Art" = 25,
  "Celebrities" = 26,
  "Animals" = 27,
  "Vehicles" = 28,
  "Entertainment: Comics" = 29,
  "Science: Gadgets" = 30,
  "Entertainment: Japanese Anime & Manga" = 31,
  "Entertainment: Cartoon & Animations" = 32,
}

export const enum Difficulty {
  Any = "",

  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}

export const enum QuestionType {
  Any = "",

  /** multiple choice questions */
  Multiple = "multiple",

  /** true or false questions */
  Boolean = "boolean",
}

/** The way values should be encoded by the OpenTDB */
export const enum Encoding {
  /**
   * The default encoding
   *
   * `Don&‌#039;t forget that &‌pi; = 3.14 &‌amp; doesn&‌#039;t equal 3.`
   */
  HTMLCodes = "",

  /**
   * URL Encoding ({@link https://www.ietf.org/rfc/rfc3986.txt RFC 3986})
   *
   * `Don%27t%20forget%20that%20%CF%80%20%3D%203.14%20%26%20doesn%27t%20equal%203.`
   */
  URL = "url3986",

  /**
   * Base64 Encoding
   *
   * `RG9uJ3QgZm9yZ2V0IHRoYXQgz4AgPSAzLjE0ICYgZG9lc24ndCBlcXVhbCAzLg==`
   */
  Base64 = "base64",
}

export type TriviaParams = {
  /** The amount of questions to fetch, `1..50`. */
  amount: number;

  /** The category to pick questions from */
  category?: Category;

  /** The relative difficulty of the questions picked */
  difficulty?: Difficulty;

  /** The type of questions given */
  type?: QuestionType;

  /** The encoding question values should in */
  encode?: Encoding;

  /** Token to use */
  token?: string;
};

export type TriviaResponse = {
  response_code: ResponseCode;
  results: Question[];
};

export type TokenParams =
  | { command: "request" }
  | { command: "reset"; token: string };

export type TokenResponse = {
  response_code: ResponseCode;
  response_message?: string;
  token: string;
};

// Main Code

/** fetch and interact with OpenTDB api tokens */
export const tokenFetch = (
  params: TokenParams,
): Promise<TypedResponse<{ "application/json": TokenResponse }>> =>
  fetch("https://opentdb.com/api_token.php?" + encodeURLQueryString(params));

/** fetch questions from the OpenTDB */
export const triviaFetch = (
  params: TriviaParams,
): Promise<TypedResponse<{ "application/json": TriviaResponse }>> =>
  fetch("https://opentdb.com/api.php?" + encodeURLQueryString(params));

/**
 * Utility function to help with decoding questions.
 *
 * The type signature assumes the text has been properly decoded.
 */
export const decodeQuestion = (
  question: Question,
  fn: (text: string) => string,
): DecodedQuestion =>
  ({
    type: fn(question.type),
    category: fn(question.category),
    question: fn(question.question),
    difficulty: fn(question.difficulty),
    correct_answer: fn(question.correct_answer),
    incorrect_answers: question.incorrect_answers.map(fn),
  }) as DecodedQuestion;
