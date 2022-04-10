import { parse } from "https://deno.land/std@0.134.0/flags/mod.ts";

import {
  Category,
  decodeQuestion,
  Encoding,
  Question,
  triviaFetch,
} from "../trivia.ts";

export type AnswerList = { answer: string; correct?: boolean }[];

export const getAnswers = (question: Question): AnswerList =>
  ([{ answer: question.correct_answer, correct: true }] as AnswerList)
    .concat(question.incorrect_answers.map((answer) => ({ answer })))
    .sort((a, b) => b.answer.charCodeAt(0) - a.answer.charCodeAt(0));

const CATEGORIES = Array(24)
  .fill(null)
  .map((_, i) => `${(i + 1).toString().padStart(4, " ")} ${Category[i + 9]}`)
  .join("\n  ");

// technically wasteful but it's easier this way for now..
const HELP = `trivia

Interactive trivia prompt, using OpenTDB.

USAGE:
  trivia [-h|--help] [--json] [--amount <1..50> (default: 1)] [--type <multiple | boolean>] [--category <1..24>] [--difficulty <easy | medium | hard>]

FLAGS:
  -h, --help
    Print help
  
  --json
    Run non interactively and instead return the JSON for all of the questions that would otherwise have been interactively answered.

OPTIONS:
  --amount <1..50> (default: 1)
    The amount of questions to ask.

  --type <multiple | boolean>
    The type of questions to ask, multiple meaning multiple choice, and boolean meaning true / false.

  --category <1..24>
    The category of questions to ask, see CATEGORIES for more information on each category.

  --difficulty <easy | medium | hard>
    The relative difficulty of the questions asked.

CATEGORIES:
  ${CATEGORIES}
`.trim();

const validateRange = (min: number, max: number, val: number, name: string) => {
  if (val < 1 || val > max) {
    console.error(`${name} '${val}' is not in range ${min}..${max}`);
    return false;
  }
  return true;
};

const validateEnum = (valid: string[], val: string, name: string) => {
  if (!(valid.includes(val))) {
    console.error(
      `${name} '${val}' is not one of ${valid.join(" | ")}`,
    );
    return false;
  }
  return true;
};

const parsedArgs = parse(Deno.args, {
  boolean: ["help", "json"],
  string: ["type", "difficulty"],
  alias: {
    help: "h",
  },
  default: {
    amount: 1,
  },
});

let exitFlag = false;

// todo: proper help exit
if (parsedArgs.h || parsedArgs.help) {
  console.log(HELP);
  Deno.exit(0);
}

if (parsedArgs.amount) {
  exitFlag ||= !validateRange(1, 50, parsedArgs.amount, "amount");
}

if (parsedArgs.category) {
  exitFlag ||= !validateRange(1, 24, parsedArgs.category, "category");
}

if (parsedArgs.difficulty) {
  parsedArgs.difficulty = parsedArgs.difficulty.toLowerCase();

  exitFlag ||= !validateEnum(
    ["easy", "medium", "hard"],
    parsedArgs.difficulty,
    "difficulty",
  );
}

if (parsedArgs.type) {
  parsedArgs.type = parsedArgs.type.toLowerCase();

  exitFlag ||= !validateEnum(
    ["multiple", "boolean"],
    parsedArgs.type,
    "type",
  );
}

if (exitFlag) Deno.exit(1);

const questions = await triviaFetch({
  amount: 5,
  ...parsedArgs,
  encode: Encoding.Base64,
  token: undefined,
})
  .then((res) => res.json())
  .then((res) => res.results.map((res) => decodeQuestion(res, atob)));

if (parsedArgs.json) {
  console.log(JSON.stringify(questions));
  Deno.exit(0);
}

let correct = 0;
for (const question of questions) {
  const answers = getAnswers(question);
  let chosenIndex = -1;

  while (true) {
    chosenIndex = parseInt(
      prompt(
        question.question + "\n" +
          answers.map((ans, i) => `[${i + 1}] ${ans.answer}`).join("\n") +
          "\n:",
      ) ?? "-1",
    );

    if (!chosenIndex || !(chosenIndex - 1 in answers)) {
      console.log();
      console.warn(
        `'${chosenIndex}' is not a valid selection between 1 and ${answers.length}, try selecting again.`,
      );
      console.log();
      continue;
    }

    break;
  }
  console.log();

  const chosenAnswer = answers[chosenIndex - 1];
  const correctIndex = answers.findIndex((a) => a.correct) + 1;
  if (chosenAnswer.correct) {
    console.log(
      `Correct! [${chosenIndex}] ${chosenAnswer.answer} was the right answer!`,
    );
    correct += 1;
  } else {
    console.log(
      `Incorrect! [${chosenIndex}] ${chosenAnswer.answer} was the wrong answer!\nThe correct answer was: [${correctIndex}] ${question.correct_answer}`,
    );
  }
  console.log();
}

if (questions.length > 1) {
  console.log(`Total Score: ${correct} / ${questions.length}`);
}
