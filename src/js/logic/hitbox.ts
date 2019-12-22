import {Location, Spawn} from '../rom/location.js';
import {TileId} from './tileid.js';

// Hitbox is an iterable of (dy, dx) coordinates.
export type Hitbox = Iterable<TileId>; //Iterable<readonly [number, number]>;

export namespace Hitbox {
  // export function rect(dys: readonly number[], dxs: readonly number[]): Hitbox {
  //   return {
  //     * [Symbol.iterator]() {
  //       for (const y of dys) {
  //         for (const x of dxs) {
  //           yield [dy, dx];
  //         }
  //       }
  //     }
  //   };
  // }

  export function trigger(location: Location, spawn: Spawn): Hitbox {
    // For triggers, which tiles do we mark?
    // The trigger hitbox is 2 tiles wide and 1 tile tall, but it does not
    // line up nicely to the tile grid.  Also, the player hitbox is only
    // $c wide (though it's $14 tall) so there's some slight disparity.
    // It seems like probably marking it as (x-1, y-1) .. (x, y) makes the
    // most sense, with the caveat that triggers shifted right by a half
    // tile should go from x .. x+1 instead.
    return {
      * [Symbol.iterator]() {
        let {x: x0, y: y0} = spawn;
        x0 += 8;
        for (const dx of [-16, 0]) {
          const x = x0 + dx;
          for (const dy of [-16, 0]) {
            const y = y0 + dy;
            yield TileId.from(location, {x, y});
          }
        }
      }
    };
  }

  export function adjust(h: Hitbox, ...deltas: Delta[]): Hitbox {
    const s = new Set();
    const ts = [...h];
    for (const [dy, dx] of deltas) {
      for (const t of ts) {
        s.add(TileId.add(t, dy, dx));
      }
    }
    return s;
  }
  type Delta = readonly [number, number];
}
