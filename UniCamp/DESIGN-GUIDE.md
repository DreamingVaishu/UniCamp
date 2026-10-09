# UniCamp UI guide (for beginners)

## Where things live
- `lib/theme.ts`      all colors + text styles. Change a color here, it changes everywhere.
- `components/`       small building blocks: Header, Row, Button, Field, Sheet, EnumPicker ...
- `lib/useLoad.ts`    loads data when a screen opens + pull-to-refresh + loading/error state.
- `lib/tabs.tsx`      the bottom bar, shared by student / staff / admin.
- `app/<role>/*.tsx`  one file per screen.

## A screen is always the same 4 steps
```tsx
const q = useLoad(async () => ok(await supabase.from('channels').select('*')), []);  // 1. load
<Screen>                                                                              // 2. page
  <Header title="Channels" />                                                         // 3. top bar
  <Scroll load={q}>{q.data.map(c => <Row key={c.id} title={c.name} />)}</Scroll>      // 4. content
</Screen>
```

## Rules
- Never hard-code a color. Use `C.something` from `lib/theme.ts`.
- Show a friendly message when a save fails. Never show raw database errors to users.
- Hiding a button is NOT security. Access rules belong in the database (Row Level Security).
