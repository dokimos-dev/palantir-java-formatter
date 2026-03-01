# Palantir Java Formatter

Formats Java source files using [Palantir Java Format](https://github.com/palantir/palantir-java-format). Runs a long lived JVM daemon in the background for fast formatting.

## Requirements

Java 17 or later on the PATH or specified via the `palantirJavaFormat.javaHome` setting.

## Setup

Add this to your VS Code settings JSON to use as the default Java formatter with format on save:

```json
{
  "[java]": {
    "editor.defaultFormatter": "dokimos-dev.palantir-java-formatter",
    "editor.formatOnSave": true
  }
}
```

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `palantirJavaFormat.enabled` | boolean | `true` | Enable or disable the formatter |
| `palantirJavaFormat.style` | string | `PALANTIR` | Formatting style |
| `palantirJavaFormat.javaHome` | string | | Path to Java home. Falls back to JAVA_HOME |
| `palantirJavaFormat.jvmArgs` | array | `[]` | Additional JVM arguments for the daemon |

## Commands

- **Palantir Java Format: Restart Daemon** restart the daemon process
- **Palantir Java Format: Show Output** show the daemon log in the output panel

## How it works

The extension spawns a JVM daemon process that communicates via JSON over stdin/stdout. The daemon stays running between format requests so you only pay the JVM startup cost once. If the daemon crashes it automatically restarts up to 3 times.

The status bar shows the current daemon state. Click it to restart.

## Building from source

Build the Java daemon:
```bash
cd daemon && gradle clean fatJar
cd .. && mkdir -p lib
cp daemon/build/libs/formatter-daemon.jar lib/
```

Build the extension:
```bash
npm install
npm run build
```

Package as VSIX:
```bash
npm run package
```

## Development

```bash
npm run dev         # watch mode
npm run lint        # check for lint errors
npm run format      # format with prettier
npm test            # run tests
```

Open this repo in VS Code and press F5 to launch an Extension Development Host for testing.
