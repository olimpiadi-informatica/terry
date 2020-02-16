# `terry` format specification
With this document it should be clear how to create a new task in the _terry_ format and how to parse it from its components.

## Terminology
Each task is composed by the following components:

- **Generator**: a program that given a _seed_ generates an _input file_.
- **Validator**: a program that given an _input file_ checks that it is valid w.r.t the problem statement.
- **Checker**: a program that given an _input file_ and an _output file_, parses them and emits some metadata (e.g. the score, messages, ...).
- **Solution**: a program that given an _input file_ produces an _output file_.
- **Input file**: a text file containing some instances of the task.
- **Output file**: a text file containing the solution of the instances relative to an _input file_.
- **Seed**: an integer value used to produce deterministically an _input file_.

## Execution flow
When a solution has to be tested the following steps will be executed serially:

- A seed `S` is chosen (e.g randomly generating it).
- An input file `I` is produced executing the generator providing `S` as the first command line argument. `I` is the standard output of the generator. A non-zero exit code means _generation failed_ and the evaluation fails.
- If the validator is present: run the validator passing `I` to its standard input. A non-zero exit code means _invalid input_, `I` is discarded and the evaluation fails.
- The solution is executed:
	- During the testing of the task the solution is executed passing `I` to its standard input and capturing the output file `O` from its standard output. A non-zero exit code means _solution failed_ and the evaluation fails.
	- During the contest, the contestant compiles his solution and runs it however he wants to produce the output file `O`.
- The checker is executed passing `I` and `O` as command line arguments and it prints the results `R` to standard output. A non-zero exit code means _checker failed_ and the evaluation fails. `R` should be a JSON value following the _checker result specification_ below.

## Task directory structure
For begin valid a task in _terry_ format should follow this directory structure:

- root task directory: its name should (but it's not enforced) be called as the _task name_.
	- `managers/` in this directory all the managers (generator, validator and checker) are placed.
		- `generator.OS.ARCH`: the executable of the generator.
		- `validator.OS.ARCH`: the executable of the validator (optional).
		- `checker.OS.ARCH`: the executable of the checker.
		- `solution.OS.ARCH`: the executable of the official solution (optional).
	- `solutions/` in this directory all the solutions are placed.
		- Any solution to be tested during the task development.
	- `statement/` in this directory all the statement-related files are places.
		- `statement.md`: the main statement file of the task.
		- Any other statement related files.
	- `task.yaml` the metadata of the task, following the _task metadata specification_ below.

Additionally any other file can be placed in those and other directories. By convention inside `managers/` there may be the source files of the managers (with the same name, but different extensions) and let the build tool create the the `.OS.ARCH` files.

In order to allow the contest environment to be run on various architectures without repacking the task, more than a manager can be present, compiled for the various architectures. The `.OS.ARCH` extension is used to switch between the various managers.
The value of `OS` corresponds to the value of [`platform.system().lower()`](https://docs.python.org/3.8/library/platform.html#platform.system) in Python. The value of `ARCH` corresponds to the value of [`platform.machine().lower()`](https://docs.python.org/3.8/library/platform.html#platform.machine). The most typical combinations of the two are: `.linux.x86_64` and `.linux.i686`.

The solutions in the `solutions/` directory are used only during the development of the task and may not be present during the contest. If the solution in `managers` is present it should be compiled by the build tool and will be accessible to the other managers.

## Task metadata specification
The `task.yaml` file inside the task root directory should be a YAML file with _at least_ the following fields:

- `name`: the short name of the task (usually all lowercase, without spaces).
- `description`: a longer name of the task (usually title-case).
- `max_score`: maximum score obtainable with a 100% correct solution of this task.

## Checker result specification
The checker should print to its standard output a JSON value with _at least_ the following fields:

- `score`: a float value from 0.0 to 1.0.
- `validation`: the data visible to the contestant even before submitting the file. It's an object with _at least_ the following fields:
	- `cases`: an array with the _validation results_, i.e. some parsing information about the validity of the output files. The array should have as many items as test cases in the input file, in the same order. Each item should be an object with _at least_ the following fields:
		- `status`: the status of the parsing of the test case, a string with one of the following values: `"missing"`, `"parsed"` or `"invalid"`.
		- `message` (optional): a textual message showed to the user, even before confirming the submission. It should not contain the outcome of the test case (i.e. its score), since the user may decide to discard the submission and try again using the same input file.
	- `alerts`: a list of messages to show to the contestant, unrelated to any specific test case. Each item should be an object with _at least_ the following fields:
		- `severity`: a string with one of the following values: `"warning"`
		- `message`: the message to show to the contestant.
- `feedback`: the data visible to the contestant after he confirms the submission. It's an object with _at least_ the following fields:
	- `cases`: an array with the actual results of the solution. The array should have as many items as test cases in the input file, in the same order. Each item should be an object with _at least_ the following fields:
		- `correct`: a boolean value indicating whether the test cases is completely correct.
		- `message` (optional): a string with a message to the contestant about this evaluation.
	- `alerts`: a list of messages to show to the contestant, unrelated to any specific test case. Each item should be an object with _at least_ the following fields:
		- `severity`: a string with one of the following values: `"warning"`
		- `message`: the message to show to the contestant.

The checker should be very resilient to invalid output files submitted by the contestant. To avoid writing every time the parsing code a Python library is available [here](https://github.com/algorithm-ninja/territoriali-cli/blob/master/terry_cli/parser.py). Note that it's useful only for the `Case #1: ...` output format.