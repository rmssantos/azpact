# Contributing to AZpact

Thanks for your interest in contributing!

## How to Contribute

### Adding New Rules

1. Edit `src/data/rules.ts`
2. Add your rule following the existing pattern:

```typescript
{
  id: "unique-rule-id",
  name: "Rule Name",
  description: "What this rule detects",
  category: "infra" | "guest" | "blocker",
  actions: ["ResizeVM"],
  conditions: [
    { field: "os.family", operator: "eq", value: "Linux" },
  ],
  impact: {
    reboot: "none" | "possible" | "likely" | "guaranteed",
    downtime: "none" | "low" | "medium" | "high",
    reason: "Explanation",
  },
  mitigations: ["mitigation-id"],
}
```

### Adding Mitigations

Edit `src/data/mitigations.ts`:

```typescript
"mitigation-id": {
  id: "mitigation-id",
  title: "Title",
  description: "Steps to follow",
  required: true | false,
  docUrl: "https://...",
}
```

### Adding VM SKUs

Edit `src/data/skus.ts` with the new SKU information.

### Adding Documentation Articles

Edit `src/data/articles.ts` to add links to official Microsoft documentation.

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a pull request

## Guidelines

- Keep rules accurate and based on official Azure documentation
- Include documentation URLs when possible
- Test your changes locally before submitting
