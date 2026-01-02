# WZ Classification Module

This module contains all data and build logic for
WZ-based activity classification, permits and regulatory hints.

## Principles
- source/ contains editable fachliche Daten
- dist/ is a generated artefact
- database is rebuilt, never edited manually

## Build
npm install
npm run build:wz-db

## Security Notice

This module uses build-time dependencies only.
Current npm audit reports moderate vulnerabilities
in transitive dependencies which do not affect runtime
or production services.

We intentionally do not apply `npm audit fix --force`
to avoid breaking deterministic builds.
