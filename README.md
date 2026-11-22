# Meopardy UI

Hosted site: [https://jattam.onrender.com/](https://jattam.onrender.com/)

Angular frontend for a hosted, multiplayer written-answer trivia game. Requires Node.js 22 and the Meopardy backend with persisted gameplay, recovery tokens, and snapshot events.

## Run locally

1. Start the sibling `meopardy-backend` on port 3000 using its README instructions. Import a game and note its game ID.
2. Run `npm ci` and `npm start` in this repository. On Windows PowerShell with restricted script execution, use `npm.cmd`.
3. Open `http://localhost:4200/admin-lobby/<gameId>` and select **Show join code** to open the display in another tab. Click **Start Game** in the admin lobby: after server confirmation, the lobby opens the admin dashboard and the join-code display automatically switches to the host board. A join-code display opened after the game starts also switches to the host board.
4. Players open `http://localhost:4200/join` and enter the code and their name. Use separate browsers/profiles for separate players; a browser profile retains one player session.
5. Open the host board at `/host/<gameId>` and the answer dashboard at `/admin-dashboard/<gameId>` in another tab. Select a clue, monitor submissions and grade on the dashboard, then reveal/close the clue. **Close** completes the clue and advances the saved game. When time expires, submissions close and the answer stays hidden. Click **Reveal Answer** on the question card when ready, or close the clue to skip revealing it.

The root URL defaults to the configured game ID (currently 8). Change `src/environments/environment.ts` for local API/socket URLs and `environment.production.ts` for deployed URLs. Production hosting must serve `index.html` for Angular routes.

## Gameplay and server contracts

- `GET /api/games/:id/join` can return either a JSON string or `{ joinCode }`.
- Host sockets join with `admin:joinGame { gameId }`; player sockets join with `player:joinGame { gameId, sessionToken }`. Player identity and token come from `POST /api/players/join` and are retained across refreshes. Older sessions without tokens must rejoin.
- `game:state` snapshots drive the phase, board, active clue, scores, reveal, and deadline. `game:answers` restores the host's saved submissions; `player:state` restores the player's score and accepted answer. SQLite numeric flags are normalized at the frontend boundary.
- Reconnects rejoin the saved room. A periodic `game:sync` also recovers missed events. Controls stay disabled until synchronization succeeds. Player routes follow the saved phase, including when joining a game already in progress.
- `game:start`, `game:clueSelected`, `game:clueRevealed`, and `game:clueClosed` require acknowledgment `{ ok, result }` or `{ ok: false, message }`. Selection sends only `{ gameId, clue: { id } }`; closing includes the captured clue ID so a retry cannot close a later clue.
- Player submissions use `game:answerSubmitted { clueId, submittedAnswer }` on the session-authenticated socket. The backend supplies identity, elapsed time, duplicate protection, persistence, scoring, and broadcasts. The frontend never sends client elapsed times or rebroadcasts accepted answers. A timeout triggers recovery before retrying.
- Grading uses `PATCH /api/answers/:answerId/override { isCorrect }`. The server saves the judgment and adjusts the score delta, then broadcasts updated snapshots. Failed saves do not optimistically change the displayed judgment.
- Public clue models and selection messages contain no answer key. Answer text appears only in the server's revealed state. Legacy cached clue/answer keys are removed from local storage.
- Countdown display uses the server's clock offset and deadline. The server enforces the actual acceptance window; browser timing never determines awarded points. At the deadline, the saved phase becomes `awaiting_reveal`. Host and player cards keep the question visible with submissions disabled; only the host's explicit **Reveal Answer** action discloses the answer. Refreshing, reconnecting, or restarting the server preserves this hidden state. Deploy the matching backend changes together with this frontend.

The backend currently documents host authentication as unfinished: admin room joins and grading endpoints still require server-side authorization before a public release. Frontend filtering cannot provide that protection.

## Validation

Run `npm run build` and `npm test -- --watch=false`. Tests cover API join-code shapes, acknowledged starts and clue closure, persistent grading failures, session recovery, duplicate submissions, stale responses, answer privacy, and deadline locking. Socket and HTTP dependencies are mocked in frontend tests; run the backend's multiplayer tests as well when changing the shared protocol.
