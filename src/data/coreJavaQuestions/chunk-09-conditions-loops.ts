import { defineChunk } from "@/data/coreJavaQuestions/contract";

/**
 * Conditions & Loops — global questions 79-90.
 * Covers brace discipline, dangling else, accidental assignment, switch
 * fall-through and default placement, String selectors, loop bound traces,
 * enhanced for, and labelled break/continue.
 */
export const chunk09ConditionsLoops = defineChunk({
  topic: "conditions-loops",
  questions: [
    {
      id: "q079",
      question: "Why should you always use blocks around if statement?",
      answer:
        "Braces are not decoration - they define the body of an `if`. Without them the condition guards exactly one statement, so a second statement added later silently escapes the guard. Every serious Java style guide requires braces, and Checkstyle enforces it with the `NeedBraces` rule.\n\n" +
        "**The three classic failures:**\n\n" +
        "- **Misleading indentation**: indentation is for humans, the compiler counts statements. `if (ready) send(); log();` always calls `log()`, whether or not `ready` is true.\n" +
        "- **Dangling `else`**: `if (a) if (b) x(); else y();` binds the `else` to the nearest unmatched `if`, so `y()` runs when `b` is false even though `a` was false as well.\n" +
        "- **The goto-fail bug**: Apple's 2014 TLS flaw was a duplicated `goto fail;` that landed outside the guarded block, so an error check silently never ran and nothing failed to compile. It is the canonical argument for braces.\n\n" +
        "**What the snippet prints**: `A: guarded`, then `A: always runs` (that line is unconditional), then `B: else ran although outer is false`, then `C: outer false, nothing to do`. Only the brace-heavy block C does what the indentation of B suggests.\n\n" +
        "**Interview framing**: braces cost one line, remove an entire bug class, keep diffs clean when someone adds a second statement, and let reviewers read statements instead of tracking alignment. Treat a brace-less `if` as a latent defect, not a style preference.",
      code: `public class BracesDemo {
    static boolean enabled = true;

    public static void main(String[] args) {
        // A: without braces only the first statement is guarded
        if (enabled)
            System.out.println("A: guarded");            // inside the if
        System.out.println("A: always runs");            // unconditional

        // B: the else binds to the NEAREST if, not the outer one
        boolean outer = false, inner = false;
        if (outer)
            if (inner)
                System.out.println("B: both true");
        else
            System.out.println("B: else ran although outer is false");

        // C: the same logic with braces does what the indentation promises
        if (outer) {
            if (inner) {
                System.out.println("C: both true");
            } else {
                System.out.println("C: outer true, inner false");
            }
        } else {
            System.out.println("C: outer false, nothing to do");
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "They check that you know braces are the safety mechanism, naming dangling else, misleading indentation and the goto-fail lesson.",
    },
    {
      id: "q080",
      question: "Guess the output",
      answer:
        "**Output**: one line - `Standard tier`.\n\n" +
        "The trap is the missing braces combined with the rule that a Java `else` binds to the **nearest unmatched `if`**. The indentation suggests the `else` pairs with `if (score > 90)`, but the compiler pairs it with the inner `if (bonusEligible)`. The real structure is: when `score > 90` holds, evaluate the inner `if`; if `bonusEligible` is false, run the `else` bound to it and print `Standard tier`.\n\n" +
        "**Step-by-step trace:**\n\n" +
        "- `score = 95`, so `score > 90` is true and control enters the inner `if`.\n" +
        "- `bonusEligible` is false, so the inner condition fails and its bound `else` is selected.\n" +
        "- `Standard tier` prints. The outer condition never selected the branch a human would expect.\n\n" +
        "**Why interviewers love it**: the reader expects either `Gold tier` or no output at all, because the `else` visually aligns with the outer `if`. The braced version below produces exactly that - it prints nothing when the bonus is not eligible. The compiler follows statement structure; humans follow indentation. That divergence is the same failure mode as the Apple `goto fail` bug, so an unexpected `else` firing is a genuine production bug rather than a curiosity.",
      code: `public class DanglingElseDemo {
    public static void main(String[] args) {
        int score = 95;
        boolean bonusEligible = false;   // no bonus this quarter

        // No braces: which if owns the else?
        if (score > 90)
            if (bonusEligible)
                System.out.println("Gold tier");
        else
            System.out.println("Standard tier");
            // The else belongs to the nearest unmatched if - the INNER one,
            // not "score > 90". Output: Standard tier

        // Braced version with the intended meaning: prints nothing here
        if (score > 90) {
            if (bonusEligible) {
                System.out.println("Gold tier");
            }
        }
    }
}`,
      codeLanguage: "java",
      explanation:
        "The interviewer wants the nearest-if binding rule and a trace that proves you follow the compiler, not the indentation.",
    },
    {
      id: "q081",
      question: "Guess the output",
      answer:
        "**Output**: `branch taken: flag is now true`, then `now equal: true`.\n\n" +
        "The first `if` is always taken because `if (flag = true)` is an **assignment**, not a comparison. The assignment expression has type `boolean` and its value is the value assigned, so the condition is `true` and the branch runs. `flag` was `false` on entry and is silently rewritten to `true`.\n\n" +
        "**Where Java differs from C:**\n\n" +
        "- `flag = true` compiles in Java because the expression is of type `boolean`, which is exactly what a condition requires.\n" +
        "- The non-boolean typo does **not** compile: `int count = 0; if (count = 5)` fails with incompatible types, because an `int` cannot be converted to `boolean`. C accepts it and treats any non-zero scalar as true, so Java catches the integer form but happily accepts the boolean one.\n" +
        "- Nothing in `javac` warns about the boolean form, so enable static analysis such as PMD's `AssignmentUsedAsCondition` or SpotBugs.\n\n" +
        "**Related traps**: comparing boxed `Boolean` objects with `==` compares references rather than values, and mutating state inside a condition makes later code depend on a side effect that is easy to overlook. The snippet shows both the accidental assignment and the follow-up comparison.",
      code: `public class AccidentalAssignmentDemo {
    public static void main(String[] args) {
        boolean flag = false;
        boolean override = true;

        // '=' is an assignment; its value is the assigned value -> true
        if (flag = true) {
            System.out.println("branch taken: flag is now " + flag);
        }

        // flag is silently true from here on
        if (flag == override) {
            System.out.println("now equal: " + flag);
        }

        // The non-boolean form does NOT compile in Java (it does in C):
        // int count = 0;
        // if (count = 5) { }  // incompatible types: int cannot be converted to boolean
    }
}`,
      codeLanguage: "java",
      explanation:
        "They test whether you know the assignment expression value, and that Java only rejects non-boolean conditions.",
    },
    {
      id: "q082",
      question: "Guess the output of this switch block.",
      answer:
        "**Output**: `points = 110`.\n\n" +
        "**Trace**: `switch (level)` matches the label equal to `level` - for enums that is the constant itself. `Level.MEDIUM` matches `case MEDIUM`, so `points += 10` runs and `points` becomes 10. There is no `break` after that case, so execution does not stop: it **falls through** into the body of the next case in source order, `case HIGH`, and `points += 100` runs, taking `points` to 110. The `break` after `case HIGH` then exits the switch, so `default` is never reached.\n\n" +
        "**What to say in the interview:**\n\n" +
        "- **Fall-through is deliberate in the colon form**: a case label is only a jump target. Unless you `break`, `return` or `throw`, every following case body executes.\n" +
        "- **Labels versus bodies**: `case LOW:` is never entered here, because matching starts at `MEDIUM`; labels before the match are skipped, but the bodies after it are not.\n" +
        "- **Order changes the answer**: with `Level.HIGH` only the last branch runs and the result is 100 - the same switch, two reachable outcomes.\n" +
        "- **Java 14+ arrow form** (`case HIGH -> points += 100;`) has no fall-through, so this bug class disappears.\n\n" +
        "Never leave a case without a terminating statement; javac only enforces that in switch expressions, not in switch statements.",
      code: `public class SwitchFallThroughDemo {
    enum Level { LOW, MEDIUM, HIGH }

    public static void main(String[] args) {
        Level level = Level.MEDIUM;
        int points = 0;

        switch (level) {
            case LOW:
                points += 1;          // not entered: match starts at MEDIUM
            case MEDIUM:
                points += 10;         // matched here, still no break
            case HIGH:
                points += 100;
                break;                // fall-through stops here
            default:
                points = -1;          // never reached
        }

        System.out.println("points = " + points);   // 110
    }
}`,
      codeLanguage: "java",
      explanation:
        "Fall-through with a missing break: name the matched label, then every case body that follows it in source order.",
    },
    {
      id: "q083",
      question: "Guess the output of this switch block?",
      answer:
        "**Output**: two lines - `1 default: unknown command` and `2 start`.\n\n" +
        "**Trace**: `command` holds `pause`, which matches no case label, so control jumps to `default`. Because `default` sits in the middle and carries no `break`, execution continues into the case body physically below it, `case \"start\"`, and prints `2 start`; the `break` there ends the switch. `case \"stop\"` is never reached.\n\n" +
        "**The rule to state:**\n\n" +
        "- **`default` is a jump target, not a position**: its placement only decides which case body fall-through reaches next, and execution always proceeds in **source order**.\n" +
        "- **A matched label skips `default` entirely**: if any case label equals the selector, `default` never runs, wherever it sits. A selector of `stop` would print `3 stop` only.\n" +
        "- **Convention exists for this reason**: placing `default` last with an explicit `break` removes the hazard completely.\n" +
        "- **Arrow switches (Java 14+)** make it a normal arm: `default -> System.out.println(...)` cannot fall through.\n\n" +
        "Most strange-switch-output interview questions are exactly this combination: a non-final `default` plus a missing `break`.",
      code: `public class DefaultInMiddleDemo {
    public static void main(String[] args) {
        String command = "pause";   // matches no case label

        switch (command) {
            default:
                System.out.println("1 default: unknown command");
                // no break -> execution falls through in SOURCE order
            case "start":
                System.out.println("2 start");
                break;
            case "stop":
                System.out.println("3 stop");   // never reached for "pause"
                break;
        }
        // With selector "stop" the only output would be: 3 stop
    }
}`,
      codeLanguage: "java",
      explanation:
        "Position of default changes only what fall-through reaches next; a matched label skips default entirely.",
    },
    {
      id: "q084",
      question: "Should default be the last case in a switch statement?",
      answer:
        "**No. `default` may appear anywhere in a `switch`, and it may be omitted altogether.** Placement is convention, not a language rule; the classic-label switch is a jump table and control flows in source order.\n\n" +
        "**What position actually changes:**\n\n" +
        "- **Fall-through**: a `default` without `break`, `return` or `throw` runs every statement below it until the next exit, so in the middle it falls into the case bodies that follow.\n" +
        "- **Readability only**: `default` last mirrors the `if` / `else if` / `else` mental model, which is why every style guide recommends it.\n" +
        "- **Omitting `default` is legal**: if nothing matches, the switch does nothing at all. That is silently wrong for `String` and enum selectors, so `default` is your guard when a new enum constant is added later.\n\n" +
        "**Modern idioms:**\n\n" +
        "- Java 14+ **arrow form** (`case A, B -> handle();`) has no fall-through, so position truly cannot matter.\n" +
        "- A **switch expression** requires an exhaustive set of arms, so either `default` or coverage of every enum constant is mandatory and the result can be assigned.\n" +
        "- Use `default` to throw for impossible values, for example `throw new IllegalArgumentException(...)`, instead of returning a silent placeholder.\n\n" +
        "A safe answer: put `default` last for readers, always terminate every arm, and prefer arrow form on Java 14+ so the question stops mattering.",
      code: `public class DefaultPlacementDemo {
    enum State { NEW, RUNNING, DONE }

    static String describe(State state) {
        switch (state) {
            default:                    // legal placement, still falls through
                return "unknown";
            case NEW:
                return "new";
            case RUNNING:
                return "running";       // DONE is handled by default
        }
        return "";                      // keeps javac happy for other values
    }

    static String arrow(State state) {  // Java 14+: no fall-through exists
        return switch (state) {
            case NEW -> "new";
            case RUNNING -> "running";
            case DONE -> "done";
        };
    }

    public static void main(String[] args) {
        System.out.println(describe(State.NEW) + " | " + describe(State.DONE));
        System.out.println(arrow(State.RUNNING));
    }
}`,
      codeLanguage: "java",
      explanation:
        "Default placement is convention, not syntax: position affects fall-through, omission is legal, arrow form removes the hazard.",
    },
    {
      id: "q085",
      question: "Can a switch statement be used around a String",
      answer:
        "**Yes - since Java 7 a `String` may be a `switch` selector.** Before Java 7 only `char`, `byte`, `short`, `int` (and their wrappers) or an enum were allowed, so developers switched on `method.charAt(0)` and then compared the full string inside each case.\n\n" +
        "**How the compiler does it:**\n\n" +
        "- **Java 7+**: it lowers the switch to `selector.hashCode()` plus a verification step that uses `String.equals`. Matching is therefore **value equality**, not `==`, so hash collisions are resolved correctly.\n" +
        "- **`null` throws**: the generated code dereferences the selector, so `switch (nullSelector)` throws `NullPointerException` before any case is tested. Guard with a null check and keep `default` as the fallback.\n" +
        "- **Constant labels only**: case labels must be compile-time constants, so a `final String` works but a runtime value does not.\n" +
        "- **The legacy `charAt` trick** is case-sensitive, needs an explicit full-string comparison in every arm, and throws on an empty string.\n\n" +
        "The snippet shows both forms: `httpStatus` is the Java 7 version, `legacyStatus` is the pre-7 workaround. Note that the switch itself is case-sensitive - it does not give you `equalsIgnoreCase` semantics for free.",
      code: `public class StringSwitchDemo {
    static int httpStatus(String method) {
        switch (method) {                 // Java 7+; selector must not be null
            case "GET":
                return 200;
            case "POST":
                return 201;
            default:
                return 405;               // method not allowed
        }
    }

    // Pre-Java 7 workaround: switch on one char, verify with equals
    static int legacyStatus(String method) {
        if (method == null || method.isEmpty()) {
            return 405;
        }
        switch (method.charAt(0)) {
            case 'G': return "GET".equals(method) ? 200 : 405;
            case 'P': return "POST".equals(method) ? 201 : 405;
            default:  return 405;
        }
    }

    public static void main(String[] args) {
        System.out.println(httpStatus("GET") + "-" + httpStatus("PUT"));
        // httpStatus(null) throws NullPointerException before any case is tested
    }
}`,
      codeLanguage: "java",
      explanation:
        "String switch compiles to hashCode plus equals, throws NPE on null, and replaced the pre-Java-7 charAt workaround.",
    },
    {
      id: "q086",
      question:
        "Guess the output of this for loop (P.S. there is an error as the output of given question should be 0-1-2-3-4-5-6-7-8-9. So please ignore that.)",
      answer:
        "**Correct output**: `0-1-2-3-4-5-6-7-8-9` - ten values on one line.\n\n" +
        "**Trace, step by step:**\n\n" +
        "- **Initialisation** `int i = 0` runs once, before the first condition test.\n" +
        "- **Condition** `i < 10` is evaluated before every iteration, including the first.\n" +
        "- **Body** appends the `-` separator only when the builder already holds content, then appends `i`. That is why there is no leading or trailing dash.\n" +
        "- **Update** `i++` runs after the body, and then the condition is re-tested.\n" +
        "- **Termination** when `i` reaches 10, `10 < 10` is false and the loop exits. The value 10 is never appended.\n\n" +
        "**About the misprinted answer key**: the commonly circulated copy of this question claims the expected output is `0-1-2-3-4-5-6-7-8-9-10`, or shows the bound as `i <= 10`, which contradicts its own snippet. With `i = 0; i < 10; i++` there are exactly ten iterations, producing `0` through `9`; the final value of `i` is 10, but it is never printed. Trust the trace instead of the answer key.\n\n" +
        "**Interviewer's point**: they want the loop-header semantics - initialise once, test before each pass, update after each pass - not a memorised output string.",
      code: `public class LoopBoundDemo {
    public static void main(String[] args) {
        StringBuilder trace = new StringBuilder();

        for (int i = 0; i < 10; i++) {          // init once, test, body, update
            if (trace.length() > 0) {
                trace.append('-');              // separator between values only
            }
            trace.append(i);                    // i = 0, 1, 2, ... 9
        }

        System.out.println(trace);              // 0-1-2-3-4-5-6-7-8-9
        // After the loop i == 10, but 10 is never appended: "10 < 10" is false.
        // The misprinted variant uses i <= 10, which would add a trailing -10.
    }
}`,
      codeLanguage: "java",
      explanation:
        "Trust the loop-header trace: init once, test before each pass, so i < 10 yields exactly zero through nine.",
    },
    {
      id: "q087",
      question: "What is an enhanced for loop?",
      answer:
        "**The enhanced `for` loop, or for-each, iterates an array or any `Iterable<T>` without exposing an index or an iterator variable.** Its shape is `for (Element e : collection) { ... }`, read as for each element. It arrived in Java 5 and removes the manual index bookkeeping that causes off-by-one and infinite-loop bugs.\n\n" +
        "**What it compiles to:**\n\n" +
        "- **Arrays**: a plain counted loop from `0` to `length - 1`, with the array reference captured once at the start.\n" +
        "- **`Iterable`**: an `Iterator` loop - `iterator()`, then `hasNext()` and `next()` - which is why implementing `Iterable` is the only requirement for collections.\n\n" +
        "**Limitations you must name:**\n\n" +
        "- **No index**: you cannot read the position, look ahead, or walk two lists in lockstep.\n" +
        "- **No removal**: calling `collection.remove(element)` during iteration bumps `modCount`, so the next `next()` throws `ConcurrentModificationException`. Use `Iterator.remove()` or Java 8's `removeIf`.\n" +
        "- **No structural modification**: adding or replacing elements fails the same way.\n" +
        "- **Array elements are loop-variable copies**: assigning to `e` does not write back into the array.\n\n" +
        "The snippet uses for-each for read-only traversal and then shows the correct `removeIf` replacement.",
      code: `public class EnhancedForDemo {
    public static void main(String[] args) {
        int[] primes = {2, 3, 5, 7, 11};
        for (int prime : primes) {                 // array -> counted loop
            System.out.print(prime + " ");
        }
        System.out.println();

        var colours = new java.util.ArrayList<>(
                java.util.List.of("Red", "Green", "Blue"));
        for (String colour : colours) {            // Iterable -> Iterator loop
            System.out.println(colour.toUpperCase());
        }

        try {
            for (String colour : colours) {
                if (colour.equals("Green")) {
                    colours.remove(colour);        // invalidates the iterator
                }
            }
        } catch (java.util.ConcurrentModificationException e) {
            System.out.println("for-each remove -> " + e.getClass().getSimpleName());
        }

        colours.removeIf(colour -> colour.equals("Green"));   // Java 8+ way
        System.out.println("remaining: " + colours);
    }
}`,
      codeLanguage: "java",
      explanation:
        "They want the Iterator desugaring, the missing index, and that removal during iteration throws ConcurrentModificationException.",
    },
    {
      id: "q088",
      question: "What is the output of the for loop below?",
      answer:
        "**Output**: `(0,10)(1,9)(2,8)(3,7)(4,6)`.\n\n" +
        "**Trace:**\n\n" +
        "- **Initialisation** runs once: `i = 0`, `j = 10`. Comma-separated initialisers of the same type are allowed, and both variables are scoped to the loop.\n" +
        "- **Condition before each pass**: `i < j` is true for `(0,10)`, `(1,9)`, `(2,8)`, `(3,7)` and `(4,6)` - five iterations, each appending the pair in that order.\n" +
        "- **Update after each pass**: `i++, j--` converges the pair from both ends. The body never observes the post-update values of the current pass.\n" +
        "- **Exit**: after the fifth pass `i = 5` and `j = 5`, so `5 < 5` fails and the loop ends. The last printed pair is `(4,6)`, never `(5,5)`.\n\n" +
        "**What the interviewer is testing:**\n\n" +
        "- A `for` header is three independent slots; the test runs before the body, including the very first time, so this loop is equivalent to a `while (i < j)` loop with the updates at the end.\n" +
        "- The update slot is just a statement list executed once per pass, and it may touch several variables.\n" +
        "- Watch the sibling trap `for (int i = 0; i < 5; i = i++)`: the assignment discards the incremented value, so `i` stays 0 and the loop never terminates.",
      code: `public class ForUpdateDemo {
    public static void main(String[] args) {
        StringBuilder out = new StringBuilder();

        for (int i = 0, j = 10; i < j; i++, j--) {   // two vars, two updates
            out.append('(').append(i).append(',').append(j).append(')');
        }

        System.out.println(out);   // (0,10)(1,9)(2,8)(3,7)(4,6)
        // Same as: int i = 0, j = 10; while (i < j) { body; i++; j--; }
        // The test runs before every pass, so 5 < 5 stops the loop.
    }
}`,
      codeLanguage: "java",
      explanation:
        "They test the three-slot for header: test before every pass, update after, so the pair never reaches equality.",
    },
    {
      id: "q089",
      question: "What is the output of the program below?",
      answer:
        "**Output**: `while attempts   = 0` and `do-while sends   = 1`.\n\n" +
        "The difference is **when the condition is tested**, not how the body is written.\n\n" +
        "- **`while` is entry-tested**: the condition runs before the first execution of the body. `retries` is 0, so `retries > 0` is false immediately and the body never runs. `attempts` stays 0.\n" +
        "- **`do-while` is exit-tested**: the body executes once unconditionally and only then is `pending > 0` evaluated. `sends` becomes 1 and `pending` becomes -1, the condition fails, and the loop stops after that single pass. Note the trailing semicolon after `while (...)`.\n\n" +
        "**Practical guidance:**\n\n" +
        "- Use `while` whenever zero iterations is the correct behaviour for empty input - work queues, retry budgets, reading until end of stream.\n" +
        "- Use `do-while` for menus, prompts and validation loops that must run at least once, such as asking again until the input parses.\n" +
        "- A `do-while` whose body you expect to skip is a bug by construction: the first iteration's side effects always happen.\n\n" +
        "**Interviewer's point**: the two constructs are interchangeable only when you can prove the body must run at least once. Otherwise the entry-tested form is the safer default.",
      code: `public class WhileVsDoWhileDemo {
    public static void main(String[] args) {
        int retries = 0;
        int attempts = 0;

        // while: the test runs first, so the body is skipped entirely
        while (retries > 0) {
            attempts++;
            retries--;
        }
        System.out.println("while attempts   = " + attempts);   // 0

        int pending = 0;
        int sends = 0;

        // do-while: the body always runs once, then the test is evaluated
        do {
            sends++;
            pending--;
        } while (pending > 0);                                 // note the semicolon
        System.out.println("do-while sends   = " + sends);      // 1
    }
}`,
      codeLanguage: "java",
      explanation:
        "Entry-tested versus exit-tested is the whole answer: do-while always runs the body once, with no exception.",
    },
    {
      id: "q090",
      question: "What is the output of the program below?",
      answer:
        "**Output**: `abort at row 1 col 1`, then `cells visited = 5`.\n\n" +
        "**Trace across the grid** `{1,2,3}` / `{4,-1,6}` / `{7,8,9}`:\n\n" +
        "- **Row 0**: `1` increments `visited` to 1 and is odd, so the inner loop continues; `2` takes `visited` to 2 and is even, so `continue` skips the rest of this inner iteration only; `3` takes `visited` to 3.\n" +
        "- **Row 1**: `4` takes `visited` to 4, even, so it is skipped; `-1` takes `visited` to 5 and is negative, so `break search;` fires.\n" +
        "- **The labelled break exits both loops**, so row 2 is never touched and `visited` remains 5.\n\n" +
        "**Points to state:**\n\n" +
        "- **A plain `break` exits the innermost loop only**: the outer loop would continue with the next row, which is rarely the intent in a two-dimensional search.\n" +
        "- **`continue` also targets the innermost loop**: it jumps to the next inner iteration and re-tests the inner condition, while `continue search;` would move to the next outer iteration instead.\n" +
        "- **Labels are not `goto`**: `search:` labels a statement, and Java only allows `break` or `continue` to reference it. There is no arbitrary jump.\n\n" +
        "**Cleaner alternative**: move the search into a method and `return` as soon as the target is found, which most reviewers prefer over labelled breaks.",
      code: `public class LabelledBreakDemo {
    public static void main(String[] args) {
        int[][] grid = {
            { 1,  2,  3},
            { 4, -1,  6},
            { 7,  8,  9},
        };
        int visited = 0;

        search:
        for (int row = 0; row < grid.length; row++) {
            for (int col = 0; col < grid[row].length; col++) {
                visited++;
                if (grid[row][col] < 0) {
                    System.out.println("abort at row " + row + " col " + col);
                    break search;              // exits BOTH loops
                }
                if (grid[row][col] % 2 == 0) {
                    continue;                  // skips only this inner iteration
                }
            }
        }
        System.out.println("cells visited = " + visited);   // 5
    }
}`,
      codeLanguage: "java",
      explanation:
        "Labelled break versus plain break is the differentiator, plus counting visited cells precisely across the nested loops.",
    },
  ],
  meta: {
    q079: {
      difficulty: "medium",
      priority: "high",
      tags: ["if-else", "braces", "dangling-else"],
      relatedQuestionIds: ["q080", "q081", "q084"],
      estimatedReadMinutes: 3,
    },
    q080: {
      difficulty: "medium",
      priority: "high",
      tags: ["if-else", "dangling-else", "output-trace"],
      relatedQuestionIds: ["q079", "q081"],
      estimatedReadMinutes: 3,
    },
    q081: {
      difficulty: "medium",
      priority: "high",
      tags: ["if-condition", "assignment", "bug"],
      relatedQuestionIds: ["q079", "q080"],
      estimatedReadMinutes: 3,
    },
    q082: {
      difficulty: "medium",
      priority: "high",
      tags: ["switch", "fall-through", "break"],
      relatedQuestionIds: ["q083", "q084"],
      estimatedReadMinutes: 3,
    },
    q083: {
      difficulty: "hard",
      priority: "high",
      tags: ["switch", "default", "fall-through"],
      relatedQuestionIds: ["q082", "q084"],
      estimatedReadMinutes: 3,
    },
    q084: {
      difficulty: "medium",
      priority: "medium",
      tags: ["switch", "default", "java-14"],
      relatedQuestionIds: ["q082", "q083"],
      estimatedReadMinutes: 4,
      javaVersions: ["Java 1+", "Java 14+"],
    },
    q085: {
      difficulty: "medium",
      priority: "high",
      tags: ["switch", "string", "java-7"],
      relatedQuestionIds: ["q082", "q084", "q087"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 7+"],
    },
    q086: {
      difficulty: "easy",
      priority: "medium",
      tags: ["for-loop", "off-by-one", "trace"],
      relatedQuestionIds: ["q088", "q090"],
      estimatedReadMinutes: 2,
    },
    q087: {
      difficulty: "easy",
      priority: "very-high",
      tags: ["for-each", "iterator", "iterable"],
      relatedQuestionIds: ["q086", "q088", "q090"],
      estimatedReadMinutes: 3,
      javaVersions: ["Java 5+"],
    },
    q088: {
      difficulty: "medium",
      priority: "medium",
      tags: ["for-loop", "condition", "update"],
      relatedQuestionIds: ["q086", "q089"],
      estimatedReadMinutes: 3,
    },
    q089: {
      difficulty: "easy",
      priority: "high",
      tags: ["while", "do-while", "loops"],
      relatedQuestionIds: ["q088", "q086"],
      estimatedReadMinutes: 2,
    },
    q090: {
      difficulty: "hard",
      priority: "high",
      tags: ["nested-loops", "labelled-break", "continue"],
      relatedQuestionIds: ["q088", "q089", "q087"],
      estimatedReadMinutes: 3,
    },
  },
});