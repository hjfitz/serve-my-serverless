# SMS - Serve My Serverless

A small webserver to serve your lambdas

## Getting Started

This project is still in development, so we're a little manual. You can either setup a config file, or pass in some params.

1. Clone the project - `git clone git@github.com:hjfitz/serverless-server.git`
2. Install any dependencies - `npm i`
3. Link the things - `npm link`

**Note:** `yarn link` doesn't place the binary in your bin, which is we use `npm link`



### Usage

If you want to get up and running quickly for a single lambda, use the CLI.

```
Usage: sms [options]

Options:
  -p, --path <path>       Path to host your lambda handler
  -f, --file <file>       File to load
  -e, --export <exports>  Exports to import and run. Defaults to `lambda_handler`
  -h, --help              display help for command
```

Example:

```bash
sms -f ./my-api/index.js -p "/foo/:path_param" -e handler
```

Alternatively, copy `config-example.yml` to the root of your project and modify it accordingly. Simply run `sms` to get going.


## Features/Roadmap

- [x] Initial hosting of lambdas
- [x] support for custom config
- [x] support for cli arguments
- [x] config validation
- [x] hot reload
- [ ] api gateway event object mocking




