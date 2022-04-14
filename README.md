# Trivia

This package contains a typed fetch builder and some utils for working with the [OpenTDB](https://opentdb.com/) api.

# Usage

You can find more info in the [documentation](https://doc.deno.land/https://deno.land/x/trivia_deno/trivia.ts).

```ts
import {
  Encoding,
  triviaFetch,
  decodeQuestion,
} from "https://deno.land/x/trivia_deno/trivia.ts";

const questions = await triviaFetch({
  amount: 5,
  encode: Encoding.Base64,
  token: undefined,
})
  .then((res) => res.json())
  .then((res) => res.results.map((res) => decodeQuestion(res, atob)));
```
