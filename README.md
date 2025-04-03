# AvArc

An application to collect data of historical interest, with locations and descriptions


## Development / Repository organization

[![CI](https://github.com/avarcorg/avarc-server/actions/workflows/ci-build.yml/badge.svg)](https://github.com/avarcorg/avarc-server/actions/workflows/ci-build.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-yellowgreen.svg)](https://opensource.org/licenses/Apache-2.0)

#### Make sure cygwin is installed:

https://cygwin.com/install.html

#### Make sure Node.js is installed:

https://nodejs.org/en

#### IntelliJ:


### Command line build


### Translations


### Code Quality


### Integration Tests


## 🧪 Local Development

### Frontend

#### 🚀 Run Docker Container with Runtime API Host

To override the API backend host at runtime:

```bash
docker run -e NEXT_PUBLIC_API_HOST=https://api.example.com -p 3000:3000 avarc-frontend
```

This will ensure your frontend points to the correct backend API on launch.

### Backend

#### 🚀 Run Docker Container with Runtime API Host

To override the API backend host at runtime:

```bash
docker run -e APP.CORS.ALLOWED-ORIGINS="http://localhost:3000,https://*.example.com" -p 8080:8080 avarc-backend
```

This will ensure your backend will accept requests from the correct frontend on launch.


## 📁 Environment Variables

| Name                      | Description                               | Example                   |
|---------------------------|-------------------------------------------|---------------------------|
| `NEXT_PUBLIC_API_HOST`    | Host URL for backend API communication    | `http://localhost:8080`   |
| `APP.CORS.ALLOWED-ORIGINS`| Sources the backend accepts requests from | `http://localhost:3000`   |


## How to develop via an Integrated Development Environment (IDE)

We will assemble some step-by-step guides for different IDEs on our developer documentation website:

Happy coding!
