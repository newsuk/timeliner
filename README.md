# timeliner

## Automated Browser Timeline Analyser

Uses chromedriver to load a webpage a number of times and aggregates performance metrics from Chrome's devtools timelines.

## Installation

Install from npm. Use `-g` flag to install CLI.

```shell
npm install timeliner [-g]
```

## Usage

### From the command line:

```shell
$ timeliner https://cubelets.digital/ --count 3 --sleep=15000
# outputs
┌──────────────────┬───────────────────┬────────┬────────┐
│ metric           │ mean              │ min    │ max    │
├──────────────────┼───────────────────┼────────┼────────┤
│ firstPaint       │ 1.973 (+/-0.314)  │ 1.532  │ 2.234  │
├──────────────────┼───────────────────┼────────┼────────┤
│ domcontentloaded │ 2.083 (+/-0.313)  │ 1.643  │ 2.342  │
├──────────────────┼───────────────────┼────────┼────────┤
│ load             │ 2.568 (+/-0.264)  │ 2.194  │ 2.761  │
├──────────────────┼───────────────────┼────────┼────────┤
│ lastPaint        │ 10.451 (+/-0.314) │ 10.010 │ 10.714 │
└──────────────────┴───────────────────┴────────┴────────┘
```

### Side by side comparison:

You can run timeliner against two websites in parallel which will return a comparison of metrics, with an indicator of whether the difference is statistically significant (p<0.05).

```shell
$ timeliner https://facebook.com https://twitter.com --count=1
# outputs
┌──────────────────┬──────────────────────┬─────────────────────┬──────────┐
│ metric           │ https://facebook.com │ https://twitter.com │ p < 0.05 │
├──────────────────┼──────────────────────┼─────────────────────┼──────────┤
│ firstPaint       │ 2.189 (±0.000)       │ 2.724 (±0.000)      │ -        │
├──────────────────┼──────────────────────┼─────────────────────┼──────────┤
│ domcontentloaded │ 2.223 (±0.000)       │ 2.876 (±0.000)      │ -        │
├──────────────────┼──────────────────────┼─────────────────────┼──────────┤
│ load             │ 2.432 (±0.000)       │ 3.124 (±0.000)      │ -        │
├──────────────────┼──────────────────────┼─────────────────────┼──────────┤
│ lastPaint        │ 2.434 (±0.000)       │ 3.139 (±0.000)      │ -        │
└──────────────────┴──────────────────────┴─────────────────────┴──────────┘
```

*Note: you may need to increase the count option (i.e. sample size) in order to see statistical significance.*

### Scrolling performance:

```shell
# analyse scrolling performance on a long webpage
$ timeliner http://buzzfeed.com --reporter fps --sleep 5000
```

### From code:

```javascript
const timeliner = require('timeliner');

timeliner({ url: 'http://google.com' })
  .then(timeliner.reporters.basic)
  .then(timeliner.reporters.table)
  .then(result => console.log(result));
```

The reporter step can be omitted to provide the raw timeline logs to analyse as you require.

## Options

All options can be passed as flags in the command line, or as arguments in code unless otherwise specified.

### `url`

*Required* - set the page url to be loaded

### `count`

set the number of times to load the page before aggregating results - Default `5`

### `reporter`

*CLI only* - set the reporter to be used to output results - supported values: `table` (default), `chart:<metric>`, `basic`, `fps`, `json`

If the `chart:<metric>` reporter is used, then `<metric>` must be a metric name present in the result set. e.g. `chart:load` will output a chart showing the value of the load metric for each run.

Multiple reporters can also be specified by separating with a comma. e.g. `chart:load,table` will output load time charts, and a table of all metrics.

### `progress`

if set then a progress bar will be output to the console showing test execution progress

### `scroll`

if set, injects a script into the page which binds a vertical scroll to `window.requestAnimationFrame` making the page scroll continuously. If a numerical value is provided then the page will scroll by that amount per frame - Default `false`

### `sleep`

set how long (in ms) after the page completes loading to continue recording metrics - Default `0`

### `driver`

sets the url of the webdriver remote server to use - Default `http://localhost:9515` (note: default webdriver is started automatically)

### `inject`

`Function` - allows the definition of a custom step in the webdriver promise chain. Function is passed the [webdriver](https://github.com/admc/wd) browser object as a parameter and should return a promise. See [example below](#custom-metrics).

## Custom metrics

### Using `console.timeStamp`

You can fire custom events by calling `console.timeStamp` from anywhere within your code with a label that matches `timeliner.*`. This will then report the first occurence of that event with a metric name of the wildcard portion of the timestamp label.

These can either be fired directly by the site under test, or injected as part of the test run using the `inject` option.

Example - inject some custom javascript into your page to trigger a custom event after 1 second.

```javascript
const timeliner = require('timeliner');

timeliner({
    url: 'http://example.com',
    inject: (browser) => {
      return browser.execute(`setTimeout(() => console.timeStamp('timeliner.custom-metric'), 1000);`);
    }
  })
  .then(timeliner.reporters.basic)
  .then((result) => {
    // result includes data for `custom-metric` event
    // result = { ... , 'custom-metric': { ... } }
  });
```

### In Code

You can pass an optional function to the `basic` reporter as a second argument which can execute custom metrics and output them in a form compatible with the `table` reporter.

The function should take a single set of logs as an argument and return an object keyed by metric names and with values corresponding to the value of each metric.

Example:

```javascript
const timeliner = require('timeliner');

function customMetrics (logs) {
  // value = do some big map-reduce on the logs
  return {
    'my-metric': value
  }
}

timeliner({ url: 'http://google.com' })
  .then(logs => timeliner.reporters.basic(logs, customMetrics))
  .then(timeliner.reporters.table)
  .then(result => console.log(result));
```

See [./examples/image-count.js](a full worked example of using custom metrics in code).
