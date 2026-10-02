# CoverMe

**CoverMe** is a lightweight utility that helps you create and manage coverage reports for your projects. It provides a simple command‑line interface to generate HTML coverage summaries, integrate with CI pipelines, and visualize test coverage trends over time.

## Features
- Generate HTML coverage reports from common coverage tools (e.g., `coverage.py`, `nyc`).
- Merge multiple coverage reports into a single unified view.
- Export coverage data as JSON for downstream analysis.
- Easy integration with GitHub Actions, GitLab CI, and other CI/CD platforms.

## Installation
```bash
# Using pip (Python)
pip install coverme

# Using npm (Node.js)
npm install -g coverme
```

## Usage
```bash
# Python project
coverage run -m pytest
coverage html
coverme --source ./htmlcov --output ./coverage-report

# Node.js project
nyc npm test
coverme --source ./coverage --output ./coverage-report
```

## Configuration
`coverme` looks for an optional `coverme.config.json` file in the project root. Example:
```json
{
  "title": "My Project Coverage",
  "theme": "dark",
  "include": ["src/**/*.js", "src/**/*.py"],
  "exclude": ["tests/**"]
}
```

## Contributing
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. See the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
