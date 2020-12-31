# CP Validator

This is an automated "sanity-check" for competitive programming repos.

It can be configured that the script listens to github events, such as the "Git push to a repository" event.
When such event is fired, the script will download all files on that specific repository snapshot,
do all the checks, and leave a comment on the commit with the results.

TODO: add instructions on how to configure the github events.


## Expected folder structure

The script expects that the files are structured as follows:

```
/
  problems/
    (some-problem)/
      solutions/
        (some-solution).cpp
      io/
        (io-folder)/
          (io-number).in
          (io-number).out
```

See https://github.com/crbonilha/sample-contest as an example.


## Limitations

Currently, the script only supports compiling and running C++ code.
