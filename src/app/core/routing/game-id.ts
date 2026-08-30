import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Host-facing screens carry the game id in the URL. Players never do - they
// arrive with a join code and take their game id from the join response.
export function injectRouteGameId(): number {
  return Number(inject(ActivatedRoute).snapshot.paramMap.get('gameId'));
}
