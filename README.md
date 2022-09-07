usage

1. clone the repo
2. clone the repo with lambdas that you wish to run somewhere relative (a child of) this repo
3. create a `config.yml` file at the root of your lambda repo. this can be based on the `config-example.yml` file in this repo
4. install dependencies for both repos!
5. from the root of the lambda repo, run `npx ts-node ../src/index.ts`

**note:** this is a very scuffed approach to run this tool. eventually, it'll become a cli tool that reads your config.
