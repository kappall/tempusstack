# TempusStack

**TempusStack** is a command-line tool designed to orchestrate temporary service stacks for local development using Docker. It enables developers to spin up services such as databases, mock APIs, and utility containers on demand, through a simple YAML configuration file, with built-in extensibility via plugins.


## Why TempusStack

Modern development often requires a combination of services to be available for testing or prototyping: a database, a message queue, a mock API, etc. Managing these with traditional tools like Docker Compose can become unnecessarily verbose and rigid, especially when the setup is meant to be temporary.

TempusStack addresses this by:

* Simplifying configuration through a concise YAML format
* Allowing services to be started, stopped, and inspected with a single command
* Supporting custom plugin logic for services beyond plain Docker containers
* Preventing the accumulation of orphan containers or volumes
* Encouraging clean, reproducible, and modular dev environments

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Docker](https://www.docker.com/get-started) installed and running

### Steps
1. **Clone the repository and install dependencies:**
    ```bash
    git clone https://github.com/kappall/tempusstack.git
    cd tempusstack
    npm install
    ```

2. **Run TempusStack using npx:**
    ```bash
    npx tempusstack <command>
    ```

   Or, for global usage, you can link it:
    ```bash
    npm link
    tempusstack <command>
    ```

---


## Configuration Reference

TempusStack uses a YAML file (`tempusstack.yaml`) to define your stack. Here’s a reference for the configuration options:

```yaml
services:
  db:
    image: postgres:15
    port: 5432
    env:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass

  mock-api:
    type: mock
    file: ./mock.json
    port: 3001
```
### Service Fields

| Field         | Required | Description                                                                 |
|---------------|----------|-----------------------------------------------------------------------------|
| `image`       | Yes*     | Docker image to use (required for default docker handler)                    |
| `type`        | No       | Service handler type (e.g. `mock`, `docker`, or a plugin name)               |
| `port`        | No       | Port to expose on the host                                                   |
| `env`         | No       | Environment variables (object)                                               |
| `file`        | No       | Path to a file (used by some plugins, e.g. mock API)                         |
| ...           | ...      | Additional fields may be used by plugins                                     |

\* Required unless a plugin handler is used.

## Available Commands

```bash
tempusstack up [options]                    # Start all services defined in tempusstack.yaml
tempusstack down                            # Stop and remove all TempusStack containers
tempusstack status                          # List active TempusStack containers
tempusstack logs <service> [-f]             # Show logs for a running service (use -f to follow)
tempusstack init                            # Create an example tempusstack.yaml file and mock.json
tempusstack restart <service> [options]     # Restart a specified TempusStack service
```

### Common Options

- `--config <path>`: Specify a custom config file path
- `-d, --detached`: Start services in the background
- `-v, --verbose`: Enable verbose output

---

## Plugin Development Guide

TempusStack supports plugins for custom service logic. Plugins are placed in the `plugins/` directory and loaded by specifying the `type` field in your service config.

### Writing a Plugin

1. **Create a file in `plugins/`, e.g. `plugins/myplugin.js`:**

    ```js
    // plugins/myplugin.js
    module.exports = {
      run: async (docker, name, cfg, verbose) => {
        // Your logic to start a service
        if (verbose) console.log(`Starting ${name} with myplugin...`);
        // Example: start a container, or run custom logic
      }
    };
    ```

2. **Reference your plugin in `tempusstack.yaml`:**

    ```yaml
    services:
      custom:
        type: myplugin
        # ...other fields your plugin expects
    ```

3. **Plugin API:**
    - `run(docker, name, cfg, verbose)` is called when your service is started.
    - Return a container ID or any identifier if needed.

---

## Troubleshooting

### Common Issues

#### Docker not running

- **Symptom:** command hang or fail with conection errors.
- **Solution:** ensure Docker Desktop or your docker daemon is running.

#### Port already in use

- **Symptom:** service fails to start due to port conflict.
- **Solution:** Change the `port` in your `tempusstack.yaml` or stop the conficting service.

#### Service not starting

- **Symptom:** error message about a service not starting.
- **Solution:** check the logs with `tempusstack logs <service>`. Verify your config and Docker image.

#### Plugin not found

- **Symptom:** Error: "Cannon find module 'plugins/yourplugin'"
- **Solution:** ensure your plugin file exists in the `plugin/` dir and is named correctly.

#### Cleaning up

- **Symptom:** containers remain after `down` or on error.
- **Solution:** run `tempusstack down` again, or remove containers manually with `docker ps -a` and `docker rm`.

### Getting Help

- Run with `-v` or `--verbose` for more detailed output.
- Check Docker logs for more information: `docker logs <container_id>`.
- Open an issue on [GitHub](https://github.com/kappall/tempusstack/issues) if you need further assistance.

---

## Project Structure

```
bin/          # CLI entrypoint
core/         # Config parser and orchestrator logic
services/     # Default service handlers (e.g. docker)
plugins/      # Custom plugin implementations
tests/        # Unit tests
```

---

## License

This project is licensed under the MIT License.
