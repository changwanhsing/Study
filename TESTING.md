# Testing Guide

## Manual Integration Testing for RLS Policies

This guide covers manual testing procedures to verify Row-Level Security policies work correctly in multi-user scenarios.

### Setup

1. Create two test Supabase accounts:
   - Account A: `user_a@test.local`
   - Account B: `user_b@test.local`

2. Open two browser windows/tabs:
   - Window A: Logged in as Account A
   - Window B: Logged in as Account B

### Test Cases

#### 1. Deck Ownership Isolation

**Objective**: Verify User A's decks are not visible to User B

1. In Window A:
   - Log in as Account A
   - Create a new deck named "Private Deck A"
   - Note the deck ID from the URL

2. In Window B:
   - Log in as Account B
   - Try to navigate directly to User A's deck using the URL: `/decks/[deckId]`
   - **Expected**: 404 Not Found (deck does not exist for User B)
   - Try to navigate to the deck import page: `/decks/[deckId]/import`
   - **Expected**: 404 Not Found

3. Verify via Database:
   - In Supabase Dashboard, switch to Database view
   - Run query as User B: `SELECT * FROM decks;`
   - **Expected**: Only User B's decks are returned (if any)

#### 2. Word Access Control

**Objective**: Verify User B cannot see words in User A's decks

1. In Window A:
   - Create a deck "Test Deck"
   - Add a word: "apple"
   - View the word in the quiz

2. In Window B:
   - Attempt to query User A's words via Supabase Dashboard
   - **Expected**: Query returns empty result due to RLS

#### 3. Progress Isolation

**Objective**: Verify each user sees only their own progress

1. In Window A:
   - Complete a quiz for User A's deck
   - Progress should be recorded

2. In Window B:
   - Complete the same quiz (need access to same public deck or shared scenario)
   - User B's progress should be separate and independent
   - **Expected**: User A's progress count ≠ User B's progress count for same word

#### 4. Import Batch Visibility

**Objective**: Verify import batch RLS

1. In Window A:
   - Create a deck "Shared Deck"
   - Upload an Excel file with words

2. In Window B:
   - Attempt to view import batches for "Shared Deck"
   - **Expected**: Cannot see the batch (only deck owner and uploader can see)

3. Invite User B to upload to User A's deck:
   - User B uploads Excel file to User A's deck
   - In Window A: Verify User A can see User B's upload batch
   - In Window B: Verify User B can see their own upload batch

#### 5. Delete Cascade

**Objective**: Verify cascading deletes work correctly

1. In Window A:
   - Create a deck with words, examples, forms
   - Create progress records by taking quizzes
   - Delete the deck

2. Verify in Database:
   - Query the deck: should not exist
   - Query words: should not exist
   - Query progress: should not exist
   - **Expected**: All related records cleaned up

### Speech Synthesis Testing

#### Desktop Browser

1. Open the app on desktop browser (Chrome, Firefox, Safari)
2. Click the speaker icon next to any word
3. **Expected**: Word should be spoken aloud
4. Click speaker icon next to example sentence
5. **Expected**: Sentence should be spoken aloud

#### Mobile Browser (iOS Safari)

1. Open the app on iPhone/iPad with Safari
2. Take a quiz and flip a card
3. **Expected**: Word should auto-speak (if auto-speak enabled)
4. Click speaker icon manually
5. **Expected**: Word/example should speak (may require user interaction due to iOS restrictions)

#### PWA Installation

1. On mobile (iOS or Android):
   - Add app to home screen
   - Open PWA version
   
2. Test speech in PWA:
   - **Expected**: Speaker buttons work same as web version
   - Note: iOS PWA speech may have additional restrictions

### Known Limitations

1. **iOS Safari Web Speech API**: Limited support. Speech synthesis may:
   - Require user gesture (tap) to activate
   - Have restricted voice selection
   - Not work in background

2. **Multi-user RLS Testing**: Requires actual Supabase accounts
   - Use real test user accounts in Supabase Auth
   - Cannot simulate with JWT tokens alone

3. **Cascading Deletes**: Verified via:
   - Direct database queries
   - Supabase Dashboard or pg_dump

### Automated Testing

Placeholder tests are in `__tests__/integration/rls-policies.test.ts`.

To run integration tests with a test Supabase instance:

```bash
npm run test:integration
```

(Requires test database setup in `vitest.config.ts`)

### Verification Checklist

- [ ] User A cannot access User B's decks
- [ ] User A cannot see User B's words
- [ ] User A cannot see User B's progress
- [ ] User A cannot modify User B's data
- [ ] Import batches respect uploader/deck owner
- [ ] Speech synthesis works on desktop browsers
- [ ] Speech synthesis works on mobile (with gestures if needed)
- [ ] Cascading deletes clean up all related records
- [ ] RLS policies block unauthenticated access
