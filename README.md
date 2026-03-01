# Palantir Java Format

A VS Code extension that formats Java files using Palantir Java Format via a long running JVM daemon process.

## Installation

Clone the repository and build the extension locally.

Build the Java daemon:
```bash
cd daemon && gradle build fatJar
cd .. && mkdir -p lib
cp daemon/build/libs/formatter-daemon.jar lib/
```

Install Node dependencies and build the extension:
```bash
npm install
npm run build
```

Package the extension:
```bash
npm run package
```

Install in VS Code:
```bash
code --install-extension palantir-java-format-0.1.0.vsix
```

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

Open VS Code settings and search for "Palantir Java Format":

- `palantirJavaFormat.enabled` boolean. Enable or disable the formatter. Default: true
- `palantirJavaFormat.style` string. Formatting style. Default: PALANTIR
- `palantirJavaFormat.javaHome` string. Path to Java home. If not set uses JAVA_HOME environment variable
- `palantirJavaFormat.jvmArgs` array. Additional JVM arguments to pass to the daemon

## Usage

Open a Java file and save it to format. Right click and select "Format Document" or use the keyboard shortcut.

The extension shows a status indicator in the bottom right that displays the daemon state. Click it to restart the daemon.

Commands:
- `Palantir Java Format: Restart Daemon` restart the daemon process
- `Palantir Java Format: Show Output` display the daemon output in the output panel

## Testing Locally

To test the extension in your Java projects:

1. Build and package the extension as described above
2. Install the VSIX file in VS Code
3. Open a Java project folder in VS Code
4. Open a Java file and save it to trigger formatting
5. Check the status icon at the bottom right. It shows check mark when running
6. If formatting fails, click the status icon to restart the daemon and check the output panel

## Requirements

Java 17 or later on the PATH or specified via `palantirJavaFormat.javaHome` setting.

## Architecture

The extension spawns a long running JVM daemon process that communicates via JSON lines over stdin/stdout. Each format request receives a response with the formatted source. The daemon handles one format request at a time.

The daemon automatically restarts if it crashes, up to 3 times before giving up.

## Development

Format code:
```bash
npm run format
```

Check for lint errors:
```bash
npm run lint
npm run lint:fix
```

Run tests:
```bash
npm test
```

Watch mode for development:
```bash
npm run dev
```
