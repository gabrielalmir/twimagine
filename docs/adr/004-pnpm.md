# ADR 004: Using pnpm as Package Manager

## Status
:heavy_check_mark: Accepted

## Context
The Twimagine project needs an efficient and modern package manager to handle its dependencies. While npm is the default Node.js package manager, it has some limitations in terms of performance and disk space management.

## Decision
We will adopt pnpm as the main package manager for the project, replacing npm.

### Reasons for the choice:
- :zap: **Performance**: pnpm is significantly faster than npm in package installation
- :floppy_disk: **Space Efficiency**: Uses symlinks to share dependencies between projects, reducing disk usage
- :lock: **Security**: Better dependency isolation, avoiding "dependency hoisting" issues
- :package: **Integrity**: Ensures that installed dependencies are exactly the same across all environments
- :rocket: **Compatibility**: Fully compatible with the npm ecosystem and SST

## Consequences
- :white_check_mark: Improved performance in CI/CD and local development
- :white_check_mark: Lower disk space usage
- :white_check_mark: More reliable installations
- :warning: Need to install pnpm globally (`npm install -g pnpm`)
- :warning: Possible need to adapt existing scripts

## Alternatives Considered
- **npm**: Default manager, but slower and less efficient
- **yarn**: Good performance, but doesn't offer the same space advantages as pnpm

## References
- [pnpm Documentation](https://pnpm.io/)
- [Performance Comparison](https://pnpm.io/benchmarks)
