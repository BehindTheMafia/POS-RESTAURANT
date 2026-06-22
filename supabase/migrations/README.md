# Database migrations

The production schema lives in the linked Supabase project. To sync locally:

```bash
supabase link --project-ref kkpwvbcjfmobyxoyekxn
supabase db pull
npm run db:types
```

Migrations in this folder are applied incrementally. The initial remote schema was created outside this repo; use `db pull` to capture it.
