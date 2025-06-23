# TempusStack

**TempusStack** is a command-line tool designed to orchestrate temporary service stacks for local development using Docker. It enables developers to spin up services such as databases, mock APIs, and utility containers on demand, through a simple YAML configuration file, with built-in extensibility via plugins.

---

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

Clone the repository and install dependencies:

```bash
git clone https://github.com/kappall/tempusstack.git
cd tempusstack
npm install
```

Execute TempusStack using:

```bash
npx tempusstack <command>
```

---

## Available Commands

```bash
tempusstack up         # Start all services defined in tempusstack.yaml
tempusstack down       # Stop and remove all TempusStack containers
tempusstack status     # List active TempusStack containers
tempusstack init       # Create an example tempusstack.yaml file and mock.json
```

---

## Example Configuration (tempusstack.yaml)

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

### Corresponding mock.json

```json
{
  "/api/status": { "status": "ok" },
  "/api/user": { "id": 1, "name": "Tempus Tester" }
}
```

---

## Plugin System

Each service can specify a `type`. If omitted, the default `docker` handler will be used to start a container using the `image` field. If a `type` is defined, TempusStack will attempt to load the plugin from the `plugins/` directory.

### Example Plugin Declaration

```yaml
services:
  api:
    type: mock
    file: ./mock.json
    port: 3001
```

### Example Plugin Implementation (`plugins/mock.js`)

```js
module.exports = {
  run: async (docker, name, cfg) => {
    // logic to start a container using cfg parameters
  }
};
```

This allows custom service behaviors to be encapsulated and reused.

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
