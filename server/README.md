# Talentwise server models

This package contains the first MongoDB models for the Talentwise recruiting workflow. It does not yet include an Express API or a database connection.

## Models

- **RecruitingChannel** — validates channel name and type, monthly spend, active status, and description. Channel names are unique.
- **Candidate** — validates candidate identity, role, recruiting-source reference, pipeline stage, quality score, and application/hire dates. Hires must have a hire date on or after application; other stages cannot have one. `daysToHire` is a virtual value.

Both schemas use Mongoose timestamps and strict field checking. Candidate stage/date and source/stage indexes support the main pipeline queries.

## Install and validate

```powershell
npm install
npm run check
npm test
```

Tests run without a MongoDB server by validating Mongoose documents in memory.
