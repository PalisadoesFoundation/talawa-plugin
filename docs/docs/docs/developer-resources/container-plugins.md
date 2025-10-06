---
id: container-plugins
title: Containerizing Plugins
slug: /developer-resources/container-plugins
sidebar_position: 3
---

# Containerizing Heavy Plugins

Some plugins may require significant resources (e.g. ML models, media processing, or long-running tasks). These can be containerized using Docker to isolate them from the main Talawa services and maintain performance and stability.

## Why Use Containers?

- Run resource-heavy workloads like AI summarization or OCR
- Keep plugin dependencies isolated from the main environment
- Deploy independent services with their own lifecycles
- Communicate via secure API with Talawa server or plugins

## Structure

Place the container configuration inside your plugin folder:

```
plugins/
└── my-heavy-plugin/
    ├── server/
    ├── admin/
    ├── mobile/
    └── docker/
        ├── Dockerfile
        └── start.sh
```

## Sample Dockerfile

```Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY docker/requirements.txt .
RUN pip install -r requirements.txt

# Copy plugin server files
COPY docker/ .
COPY server/ /app/server

# Expose service
EXPOSE 5001

# Start service
CMD ["python", "server/main.py"]
```

## Communication Pattern

- Expose the plugin container over HTTP or WebSocket (e.g. port 5001)
- Talawa API calls the plugin via REST/GraphQL
- Plugins may also publish Webhooks back to Talawa

You can define your container URL inside `plugin.json`:

```json
"runtime": {
  "type": "container",
  "endpoint": "http://localhost:5001"
}
```

## Running Plugin Containers

Use Docker Compose for development:

```yaml
services:
  plugin-survey-ai:
    build: ./plugins/survey-ai/docker
    ports:
      - 5001:5001
    environment:
      - MODEL_PATH=/app/models
```

Run with:

```bash
docker-compose up -d
```

## Security Best Practices

- Do not expose plugin containers publicly
- Validate all data passed from/to containers
- Use resource limits in production

## When to Use

✅ Ideal for:

- Machine Learning plugins (e.g., summarisation, image tagging)
- Document parsers or video processors
- Isolated backend tools

❌ Avoid if:

- Plugin only renders UI or simple APIs
- Plugin runs entirely within the browser or admin panel

Containerization allows you to build powerful, scalable plugins that run independently while integrating tightly with Talawa.
