$ErrorActionPreference = 'Stop'
# Prefer an explicitly installed Java. A downloaded test runtime is optional.
$taskJava = Join-Path $PSScriptRoot '../test-results/runtime/java/jdk-21.0.12.1+1-jre'
if (Test-Path -LiteralPath $taskJava) {
  $env:JAVA_HOME = (Resolve-Path -LiteralPath $taskJava).Path
  $env:Path = $env:JAVA_HOME + '\bin;' + $env:Path
}
# Java's Windows AF_UNIX pipe fails under some desktop app hosts.
# An unavailable Unix-socket directory makes Java fall back to its TCP loopback pipe.
$taskUnixDir = Join-Path $PSScriptRoot '../test-results/runtime/unavailable-unix-socket-directory'
$env:JAVA_TOOL_OPTIONS = '"-Djdk.net.unixdomain.tmpdir=' + $taskUnixDir + '"'
npx firebase-tools emulators:start --only auth,firestore --project demo-elifa-mushaf
exit $LASTEXITCODE
