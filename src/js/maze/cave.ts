import { Grid, GridCoord, GridIndex, E, S } from './grid.js';
import { seq, hex } from '../rom/util.js';
import { Metascreen } from '../rom/metascreen.js';
import { Metalocation, Pos } from '../rom/metalocation.js';
import { MazeShuffle, Attempt, Survey, Result, OK } from '../maze/maze.js';
import { UnionFind } from '../unionfind.js';
import { DefaultMap } from '../util.js';

const [] = [hex];

type A = CaveShuffleAttempt;

export class CaveShuffleAttempt implements Attempt {
  readonly grid: Grid<string>;
  readonly fixed = new Set<GridCoord>();

  // Current size and number of walls/bridges.
  rivers = 0;
  wides = 0;
  count = 0;
  walls = 0;
  bridges = 0;

  constructor(readonly h: number, readonly w: number,
              readonly size: number) {
    this.grid = new Grid(h, w);
    this.grid.data.fill('');
  }
}

export class CaveShuffle extends MazeShuffle {

  maxPartitions = 1;
  minSpikes = 2;
  maxSpikes = 5;
  looseRefine = false;
  addBlocks = true;
  private _requirePitDestination = false;

  requirePitDestination(): this {
    this._requirePitDestination = true;
    return this;
  }

  // shuffle(loc: Location, random: Random) {
  //   const meta = loc.meta;
  //   const survey = this.survey(meta);
  //   for (let attempt = 0; attempt < 100; attempt++) {
  //     const width =
  //         Math.max(1, Math.min(8, loc.meta.width +
  //                              Math.floor((random.nextInt(6) - 1) / 3)));
  //     const height =
  //         Math.max(1, Math.min(16, loc.meta.height +
  //                              Math.floor((random.nextInt(6) - 1) / 3)));
  //     const shuffle = new CaveShuffleAttempt(height, width, survey, random);
  //     const result = shuffle.build();
  //     if (result) {
  //       if (loc.id === 0x31) console.error(`Shuffle failed: ${result}`);
  //     } else {
  //       this.finish(loc, shuffle.meta, random);
  //       return;
  //     }
  //   }
  //   throw new Error(`Completely failed to map shuffle ${loc}`);
  // }

  survey(meta: Metalocation): Survey {
    // take a survey.
    const survey = {
      meta,
      id: meta.id,
      tileset: meta.tileset,
      size: 0,
      edges: [0, 0, 0, 0],
      stairs: [0, 0],
      features: {
        arena: 0,
        bridge: 0,
        over: 0,
        pit: 0,
        ramp: 0,
        river: 0,
        spike: 0,
        statue: 0,
        under: 0,
        wall: 0,
        wide: 0,
      },
    };
    if (meta.id >= 0) {
      for (const spawn of meta.rom.locations[meta.id].spawns) {
        if (spawn.isMonster() && spawn.monsterId === 0x8f) {
          survey.features.statue++;
        }
      }
    }
    for (const pos of meta.allPos()) {
      const scr = meta.get(pos);
      if (!scr.isEmpty() || scr.data.exits?.length) survey.size++;
      for (const exit of scr.data.exits ?? []) {
        const {type} = exit;
        if (type === 'edge:top') {
          if ((pos >>> 4) === 0) survey.edges[0]++;
          continue;
        } else if (type === 'edge:left') {
          if ((pos & 0xf) === 0) survey.edges[1]++;
          continue;
        } else if (type === 'edge:bottom') {
          if ((pos >>> 4) === meta.height - 1) survey.edges[2]++;
          continue;
        } else if (type === 'edge:right') {
          if ((pos & 0xf) === meta.width - 1) survey.edges[3]++;
          continue;
        } else if (type === 'crypt') {
          // stair is built into arena
          continue;
        } else if (type.startsWith('seamless')) {
          // do nothing...
        } else if (exit.dir & 1) {
          throw new Error(`Bad exit direction: ${exit.dir}`);
        } else {
          survey.stairs[exit.dir >>> 1]++;
          continue;
        }
      }
      if (scr.hasFeature('arena')) survey.features.arena++;
      if (scr.hasFeature('bridge')) survey.features.bridge++;
      if (scr.hasFeature('overpass')) survey.features.over++;
      if (scr.hasFeature('pit')) survey.features.pit++;
      if (scr.hasFeature('ramp')) survey.features.ramp++;
      if (scr.hasFeature('spikes')) survey.features.spike++;
      if (scr.hasFeature('underpass')) survey.features.under++;
      if (scr.hasFeature('wall')) survey.features.wall++;
      if (scr.hasFeature('river')) survey.features.river++;
      if (scr.hasFeature('wide')) survey.features.wide++;
    }
    if (survey.size < 2 && (meta.width > 1 || meta.height > 1)) survey.size = 2;
    return survey;
  }

  build(h = this.pickHeight(), w = this.pickWidth(),
        size = this.pickSize()): Result<Metalocation> {
    this.init();
    let result: Result<void>;
    //const r = this.random;
    const a = new CaveShuffleAttempt(h, w, size);
    if ((result = this.fillGrid(a)), !result.ok) return result;

    // try to translate to metascreens at this point...
    if ((result = this.preinfer(a)), !result.ok) return result;
    const meta = this.inferScreens(a);
    if (!meta.ok) return meta;
    if ((result = this.refineMetascreens(a, meta.value)), !result.ok) {
      //console.error(meta.value.show());
      return result;
    }
    if ((result = this.checkMetascreens(a, meta.value)), !result.ok) {
      return result;
    }
    if (this._requirePitDestination &&
        !this.requireEligiblePitDestination(meta.value)) {
      return {ok: false, fail: `no eligible pit destination`};
    }
    return meta;
  }

  fillGrid(a: A): Result<void> {
    let result: Result<void>;
    if ((result = this.initialFill(a)), !result.ok) return result;
    //if (!this.addEarlyFeatures()) return false;
    if ((result = this.addEdges(a)), !result.ok) return result;
    if ((result = this.addEarlyFeatures(a)), !result.ok) return result;
    //console.log(`refine:\n${this.grid.show()}`);
    if ((result = this.refine(a)), !result.ok) return result;
    //console.log(`postrefine:\n${this.grid.show()}`);
    if (!this.refineEdges(a)) return {ok: false, fail: 'refineEdges'};
    this.removeSpurs(a);
    this.removeTightLoops(a);
    if ((result = this.addLateFeatures(a)), !result.ok) return result;
    if ((result = this.addStairs(a, ...(this.params.stairs ?? []))),
        !result.ok) return result;
    return OK;
  }

  ////////////////////////////////////////////////////////////////
  // Attempt methods

  init() {}

  // Initial fill.
  initialFill(a: A): Result<void> {
    this.fillCave(a, 'c');
    return OK;
  }

  fillCave(a: A, s: string) {
    // TODO - move to MazeShuffle.fill?
    for (let y = 0.5; y < a.h; y++) {
      for (let x = 0.5; x < a.w; x++) {
        if (y > 1) a.grid.set2(y - 0.5, x, 'c');
        if (x > 1) a.grid.set2(y, x - 0.5, 'c');
        a.grid.set2(y, x, 'c');
      }
    }
    a.count = a.h * a.w;
  }

  // Add edge and/or stair exits
  addEdges(a: A): Result<void> {
    //let attempts = 0;
    if (!this.params.edges) return OK;
    for (let dir = 0; dir < 4; dir++) {
      let count = this.params.edges[dir] || 0;
      if (!count) continue;
      const edges =
          seq(dir & 1 ? a.h : a.w, i => a.grid.border(dir, i));
      for (const edge of this.random.ishuffle(edges)) {
        //console.log(`edge: ${edge.toString(16)} count ${count} dir ${dir}`);
        if (a.grid.get(edge)) continue;
        if (dir & 1) {
          if (dir === 1) {
            if (this.addLeftEdge(a, edge)) count--;
          } else {
            if (this.addRightEdge(a, edge)) count--;
          }
        } else {
          if (dir === 0) {
            if (this.addUpEdge(a, edge)) count--;
          } else {
            if (this.addDownEdge(a, edge)) count--;
          }
        }
        if (!count) break;
      }
      if (count) {
        return {ok: false, fail: `can't fit all edges shuffling ${this.loc
                                 }\nmissing ${count} ${dir}`};
        //\n${a.grid.show()}`};
      }
    }
    return OK;
  }

  addUpEdge({grid, fixed}: A, edge: GridCoord): boolean {
    // Up edges must always be arena screens, so cut off both
    // the E-W edges AND the neighboring screens as well (provided
    // there is not also an exit next to them, since that would be
    // a problem.  (These are pretty limited: vampire 1, prison,
    // stxy 1, pyramid 1, crypt 2, draygon 2).
    const below = edge + 0x800 as GridCoord;
    const left = below - 8 as GridCoord;
    const left2 = left - 8 as GridCoord;
    const left3 = left2 - 8 as GridCoord;
    const right = below + 8 as GridCoord;
    const right2 = right + 8 as GridCoord;
    const right3 = right2 + 8 as GridCoord;
    if (grid.isBorder(left)) {
      if (grid.get(left)) return false;
    } else {
      if (grid.get(edge - 16 as GridCoord)) return false;
      if (grid.isBorder(left3) && grid.get(left3)) return false;
    }
    if (grid.isBorder(right)) {
      if (grid.get(right)) return false;
    } else {
      if (grid.get(edge + 16 as GridCoord)) return false;
      if (grid.isBorder(right3) && grid.get(right3)) return false;
    }
    fixed.add(edge);
    grid.set(edge, 'n');
    grid.set(left, '');
    grid.set(right, '');
    return true;
  }

  addDownEdge({grid, fixed}: A, edge: GridCoord): boolean {
    // down edges must have straight N-S screens, so cut off
    // the E-W edges next to them.
    const above = edge - 0x800 as GridCoord;
    const left = above - 8 as GridCoord;
    const right = above + 8 as GridCoord;
    if (!grid.get(above)) return false;
    if (grid.isBorder(left) && grid.get(left)) return false;
    if (grid.isBorder(right) && grid.get(right)) return false;
    fixed.add(edge);
    grid.set(edge, 'n');
    grid.set(left, '');
    grid.set(right, '');
    return true;
  }

  addLeftEdge({grid, fixed}: A, edge: GridCoord): boolean {
    const right = edge + 8 as GridCoord;
    const rightUp = right - 0x800 as GridCoord;
    const rightDown = right + 0x800 as GridCoord;
//console.log(`addLeft ${hex(edge)} right ${hex(right)}:${this.grid.get(right)} ru ${hex(rightUp)}:${this.grid.isBorder(rightUp)}:${this.grid.get(rightUp)} rd ${hex(rightDown)}:${this.grid.isBorder(rightDown)}:${this.grid.get(rightDown)}`);
    if (!grid.get(right)) return false;
    if (grid.isBorder(rightUp) && grid.get(rightUp)) return false;
    if (grid.isBorder(rightDown) && grid.get(rightDown)) return false;
    fixed.add(edge);
    grid.set(edge, 'c');
    return true;
  }

  addRightEdge({grid, fixed}: A, edge: GridCoord): boolean {
    const left = edge - 8 as GridCoord;
    const leftUp = left - 0x800 as GridCoord;
    const leftDown = left + 0x800 as GridCoord;
    if (!grid.get(left)) return false;
    if (grid.isBorder(leftUp) && grid.get(leftUp)) return false;
    if (grid.isBorder(leftDown) && grid.get(leftDown)) return false;
    fixed.add(edge);
    grid.set(edge, 'c');
    return true;
  }

  // addArenasEarly(): boolean {
  //   // Specifically, just arenas...
  //   let arenas = this.params.features?.['a'];
  //   if (!arenas) return true;
  //   const g = this.grid;
  //   for (const c of this.random.ishuffle(this.screens)) {
  //     const middle = (c | 0x808) as GridCoord;
  //     const left = (middle - 8) as GridCoord;
  //     const left2 = (left - 8) as GridCoord;
  //     const left3 = (left2 - 8) as GridCoord;
  //     const left2Up = (left2 - 0x800) as GridCoord;
  //     const left2Down = (left2 + 0x800) as GridCoord;
  //     const right = (middle + 8) as GridCoord;
  //     const right2 = (right + 8) as GridCoord;
  //     const right3 = (right2 + 8) as GridCoord;
  //     const right2Up = (right2 - 0x800) as GridCoord;
  //     const right2Down = (right2 + 0x800) as GridCoord;
  //     if (!g.isBorder(left)) {
  //       if (g.isBorder(left3) && g.get(left3)) continue;
  //       if (g.isBorder(left2Up) && g.get(left2Up)) continue;
  //       if (g.isBorder(left2Down) && g.get(left2Down)) continue;
  //     }
  //     if (!g.isBorder(right)) {
  //       if (g.isBorder(right3) && g.get(right3)) continue;
  //       if (g.isBorder(right2Up) && g.get(right2Up)) continue;
  //       if (g.isBorder(right2Down) && g.get(right2Down)) continue;
  //     }
  //     this.fixed.add(middle);
  //     g.set(middle, 'a');
  //     g.set(left, '');
  //     g.set(left2, '');
  //     g.set(right, '');
  //     g.set(right2, '');
  //     arenas--;
  //     if (!arenas) return true;
  //   }
  //   return false;
  // }

  addEarlyFeatures(a: A): Result<void> {
    if (!this.addSpikes(a, this.params.features?.spike ?? 0)) {
      return {ok: false, fail: `add spikes\n${a.grid.show()}`};
    }
    if (!this.addOverpasses(a, this.params.features?.over ?? 0)) {
      return {ok: false, fail: 'add overpasses'};
    }
    return OK;
  }

  addLateFeatures(a: A): Result<void> {
    if (!this.addArenas(a, this.params.features?.arena ?? 0)) {
      return {ok: false, fail: 'addArenas'};
    }
    if (!this.addUnderpasses(a, this.params.features?.under ?? 0)) {
      return {ok: false, fail: 'addUnderpasses'};
    }
    if (!this.addPits(a, this.params.features?.pit ?? 0)) {
      return {ok: false, fail: 'addPits'};
    }
    if (!this.addRamps(a, this.params.features?.ramp ?? 0)) {
      return {ok: false, fail: 'addRamps'};
    }
    return OK;
  }

  addArenas(a: A, arenas: number): boolean {
    if (!arenas) return true;
    const g = a.grid;
    for (const c of this.random.ishuffle(a.grid.screens())) {
      const middle = (c | 0x808) as GridCoord;
      if (!this.isEligibleArena(a, middle)) continue;
      const tile = this.extract(a.grid, c);
      const arenaTile = tile.substring(0, 4) + 'a' + tile.substring(5);
      const options = this.orig.tileset.getMetascreensFromTileString(arenaTile);
      if (!options.length) continue;
      a.fixed.add(middle);
      g.set(middle, 'a');
      // g.set(left, '');
      // g.set(left2, '');
      // g.set(right, '');
      // g.set(right2, '');
      arenas--;
      if (!arenas) return true;
    }
    //console.error('could not add arena');
    return false;
  }

  isEligibleArena(a: A, middle: GridCoord): boolean {
    const g = a.grid;
    const left = (middle - 8) as GridCoord;
    const left2 = (left - 8) as GridCoord;
    const right = (middle + 8) as GridCoord;
    const right2 = (right + 8) as GridCoord;
    if (g.get(middle) !== 'c' && g.get(middle) !== 'w') return false;
    if (g.get(left) || g.get(right)) return false;
    if (!g.isBorder(left) && g.get(left2)) return false;
    if (!g.isBorder(right) && g.get(right2)) return false;
    return true;
  }

  addUnderpasses(a: A, under: number): boolean {
    // Only add horizontal '   |cbc|   ', not ' c | b | c '.  Could possibly
    // use 'b' and 'B' instead?
    return this.addStraightScreenLate(a, under, 'b', 0x800);
  }

  addOverpasses(a: A, over: number): boolean {
    let attempts = 0;
    while (over) {
      const y = this.random.nextInt(a.h - 2) + 1;
      const x = this.random.nextInt(a.w - 2) + 1;
      const c = (y << 12 | x << 4 | 0x808) as GridCoord;
      if (a.grid.get(c) !== 'c') {
        if (++attempts > 10) throw new Error('Bad attempts');
        continue;
      }
      a.grid.set(c, 'b');
      a.fixed.add(c);
      a.grid.set(c - 8 as GridCoord, '');
      a.grid.set(c + 8 as GridCoord, '');
      over--;
    }
    return true;
  }

  addPits(a: A, pits: number): boolean {
    return this.addStraightScreenLate(a, pits, 'p');
  }

  addRamps(a: A, ramps: number): boolean {
    return this.addStraightScreenLate(a, ramps, '/', 8);
  }

  /** @param delta GridCoord difference for edges that need to be empty. */
  addStraightScreenLate(a: A, count: number,
                        char: string, delta?: number): boolean {
    if (!count) return true;
    for (const c of this.random.ishuffle(a.grid.screens())) {
      const middle = (c | 0x808) as GridCoord;
      if (a.grid.get(middle) !== 'c') continue;
      if (delta) {
        const side1 = (middle - delta) as GridCoord;
        const side2 = (middle + delta) as GridCoord;
        if (a.grid.get(side1) || a.grid.get(side2)) continue;
      }
      const tile = this.extract(a.grid, c);
      const newTile = tile.substring(0, 4) + char + tile.substring(5);
      const options = this.orig.tileset.getMetascreensFromTileString(newTile);
      if (!options.length) continue;
      // TODO - return false if not on a critical path???
      //      - but POI aren't placed yet.
      a.fixed.add(middle);
      a.grid.set(middle, char);
      count--;
      if (!count) return true;
    }
    //console.error('could not add ramp');
    return false;
  }

  addSpikes(a: A, spikes: number): boolean {
    if (!spikes) return true;
    let attempts = 0;
    while (spikes > 0) {
      if (++attempts > 20) return false;

      // TODO - try to be smarter about spikes
      //  - if total > 2 then use min(total, h*.6, ??) as len
      //  - if len > 2 and w > 3, avoid putting spikes on edge?
      let len = Math.min(spikes, Math.floor(a.h * 0.6), this.maxSpikes);
      while (len < spikes - 1 && len > this.minSpikes) {
        if (this.random.next() < 0.2) len--;
      }
      //if (len === spikes - 1) len++;
      const x =
          (len > 2 && a.w > 3) ? this.random.nextInt(a.w - 2) + 1 :
          this.random.nextInt(a.w);
      // const r =
      //     this.random.nextInt(Math.min(this.h - 2, spikes) - this.minSpikes);
      // let len = this.minSpikes + r;
      if (len > spikes - this.minSpikes) {
        if (len >= a.h - 2) { // && len > this.minSpikes) {
          len = a.h - 2;
        } else {
          len = spikes; // ??? is this even valid ???
        }
      }
      const y0 = this.random.nextInt(a.h - len - 2) + 1;
      const t0 = y0 << 12 | x << 4 | 0x808;
      const t1 = t0 + ((len - 1) << 12);
      for (let t = t0 - 0x1000; len && t <= t1 + 0x1000; t += 0x800) {
        if (a.grid.get(t as GridCoord) !== 'c') len = 0;
      }
      if (!len) continue;
      const cleared = [t0 - 8, t0 + 8, t1 - 8, t1 + 8] as GridCoord[];
      const orphaned = this.tryClear(a, cleared);
      if (!orphaned.length) continue;
      for (const c of orphaned) {
        a.grid.set(c, '');
      }
      a.fixed.add((t0 - 0x800) as GridCoord);
      a.fixed.add((t0 - 0x1000) as GridCoord);
      a.fixed.add((t1 + 0x800) as GridCoord);
      a.fixed.add((t1 + 0x1000) as GridCoord);
      for (let t = t0; t <= t1; t += 0x800) {
        a.fixed.add(t as GridCoord);
        a.grid.set(t as GridCoord, 's');
      }
      spikes -= len;
      attempts = 0;
    }
    return spikes === 0;
  }

  canRemove(c: string): boolean {
    // Notably, exclude stairs, narrow edges, arenas, etc.
    return c === 'c';
  }

  /**
   * Does a traversal with the given coordinate(s) cleared, and returns
   * an array of coordinates that would be cut off (including the cleared
   * coordinates).  If clearing would create more than the allowed number
   * of partitions (usually 1), then returns an empty array to signify
   * that the clear is not allowed.
   */
  tryClear(a: A, coords: GridCoord[]): GridCoord[] {
    const replace = new Map<GridCoord, string>();
    for (const c of coords) {
      if (a.fixed.has(c)) return [];
      replace.set(c, '');
    }
    const parts = a.grid.partition(replace);
    // Check simple case first - only one partition
    const [first] = parts.values();
    if (first.size === parts.size) { // a single partition
      return [...coords];
    }
    // More complex case - need to see what we actually have,
    // see if anything got cut off.
    const connected = new Set<Set<GridCoord>>();
    const allParts = new Set<Set<GridCoord>>(parts.values());
    for (const fixed of a.fixed) {
      connected.add(parts.get(fixed)!);
    }
    if (connected.size > this.maxPartitions) return []; // no good
    const orphaned = [...coords];
    for (const part of allParts) {
      if (connected.has(part)) continue;
      orphaned.push(...part);
    }
    return orphaned;
  }

  refine(a: A): Result<void> {
    let filled = new Set<GridCoord>();
    for (let i = 0 as GridIndex; i < a.grid.data.length; i++) {
      if (a.grid.data[i]) filled.add(a.grid.coord(i));
    }
    let attempts = 0;
    while (a.count > a.size) {
      if (attempts++ > 50) throw new Error(`refine failed: attempts`);
      //console.log(`main: ${this.count} > ${a.size}`);
      let removed = 0;
//if(this.params.id===4){debugger;[...this.random.ishuffle(filled)];}
      for (const coord of this.random.ishuffle([...filled])) {
        if (a.grid.isBorder(coord) ||
            !this.canRemove(a.grid.get(coord)) ||
            a.fixed.has(coord)) {
          continue;
        }
        if (removed > 3) break;

        const parts = a.grid.partition(this.removalMap(a, coord));
        //console.log(`  coord: ${coord.toString(16)} => ${parts.size}`);
        const [first] = parts.values();
        if (first.size === parts.size && parts.size > 1) { // a single partition
          // ok to remove
          removed++;
          filled.delete(coord);
          if ((coord & 0x808) === 0x808) a.count--;
          a.grid.set(coord, '');
        } else {
          // find the biggest partition.
          let part!: Set<GridCoord>;
          for (const set of parts.values()) {
            if (!part || set.size > part.size) part = set;
          }
          // make sure all the fixed screens are in it.
          if (![...a.fixed].every(c => part.has(c))) continue;
          // check that it's big enough.
          const count = [...part].filter(c => (c & 0x808) == 0x808).length;
          //console.log(`part: ${[...part].map(x=>x.toString(16)).join(',')} count=${count}`);
          if (count < a.size) continue;
          // ok to remove
          removed++;
          filled = part;
          a.count = count;
          a.grid.set(coord, '');
          for (const [k, v] of parts) {
            if (v !== part) a.grid.set(k, '');
          }
        }
      }
      if (!removed) {
        if (this.looseRefine) return OK;
        return {ok: false, fail: `refine ${a.count} > ${a.size}`};
        //\n${a.grid.show()}`};
      }
    }
    return OK;
  }

  removalMap(a: A, coord: GridCoord): Map<GridCoord, string> {
    return new Map([[coord, '']]);
  }

  /** Remove only edges. Called after refine(). */
  refineEdges(a: A): boolean {
    let edges: GridCoord[] = [];
    for (let i = 0 as GridIndex; i < a.grid.data.length; i++) {
      if (!a.grid.data[i]) continue;
      const coord = a.grid.coord(i);
      if (a.grid.isBorder(coord) || a.fixed.has(coord)) continue;
      // Only add edges.
      if ((coord ^ (coord >> 8)) & 8) edges.push(coord);
    }
    this.random.shuffle(edges);
    const orig = a.grid.partition(new Map());
    let size = orig.size;
    const partCount = new Set(orig.values()).size;
    for (const e of edges) {
      const parts = a.grid.partition(new Map([[e, '']]));
      //console.log(`  coord: ${coord.toString(16)} => ${parts.size}`);
      const [first] = parts.values();
      const ok = first.size === parts.size ?
          // a single partition - make sure we didn't lose anything else.
          parts.size === size - 1 :
          // require no new partitions
          new Set(parts.values()).size === partCount && parts.size === size - 1;
      if (ok) {
        size--;
        a.grid.set(e, '');
      }
    }
    return true;
  }

  /**
   * We can't handle a tile ' c |c  |   ' so get rid of one or the
   * other of the edges.  Leave tiles of the form ' c |   | c ' since
   * that works fine.  TODO - how to preserve ' > |   | < '?
   */
  removeSpurs(a: A) {
    for (let y = 0; y < a.h; y++) {
      for (let x = 0; x < a.w; x++) {
        const c = (y << 12 | 0x808 | x << 4) as GridCoord;
        if (a.grid.get(c)) continue;
        const up = (c - 0x800) as GridCoord;
        const down = (c + 0x800) as GridCoord;
        const left = (c - 0x8) as GridCoord;
        const right = (c + 0x8) as GridCoord;
        if ((a.grid.get(up) || a.grid.get(down)) &&
            (a.grid.get(left) || a.grid.get(right))) {
          if (this.random.nextInt(2)) {
            a.grid.set(up, '');
            a.grid.set(down, '');
          } else {
            a.grid.set(left, '');
            a.grid.set(right, '');
          }
          //console.log(`remove ${y} ${x}:\n${this.grid.show()}`);
        }
      }
    }
  }

  removeTightLoops(a: A) {
    for (let y = 0; y < a.h - 1; y++) {
      const row = y << 12 | 0x800;
      for (let x = 0; x < a.w - 1; x++) {
        const coord = (row | (x << 4) | 8) as GridCoord;
        if (this.isTightLoop(a, coord)) this.breakTightLoop(a, coord);
      }
    }
  }

  isTightLoop({grid}: A, coord: GridCoord): boolean {
    for (let dy = 0; dy < 0x1800; dy += 0x800) {
      for (let dx = 0; dx < 0x18; dx += 8) {
        const delta = dy | dx
        if (delta === 0x808) continue;
        if (grid.get((coord + delta) as GridCoord) !== 'c') return false;
      }
    }
    return true;
  }

  breakTightLoop(a: A, coord: GridCoord) {
    // Pick a delta - either 8, 1008, 800, 810
    const r = this.random.nextInt(0x10000);
    const delta = r & 1 ? (r & 0x1000) | 8 : (r & 0x10) | 0x800;
    a.grid.set((coord + delta) as GridCoord, '');
  }

  addStairs(a: A, up = 0, down = 0): Result<void> {
    // Find spots where we can add stairs
//if(this.params.id===5)debugger;
    const stairs = [up, down];
    if (!stairs[0] && !stairs[1]) return OK; // no stairs
    for (const c of this.random.ishuffle(a.grid.screens())) {
      if (!this.tryAddStair(a, c, stairs)) continue;
      if (!stairs[0] && !stairs[1]) return OK; // no stairs
    }
    return {ok: false, fail: `stairs`}; //\n${a.grid.show()}`};
  }

  addEarlyStair(a: A, c: GridCoord, stair: string): Array<[GridCoord, string]> {
    const mods: Array<[GridCoord, string]> = [];
    const left = c - 8 as GridCoord;
    const right = c + 8 as GridCoord;
    const up = c - 0x800 as GridCoord;
    const down = c + 0x800 as GridCoord;
    let neighbors = [c - 8, c + 8] as GridCoord[];
    if (stair === '<') {
      neighbors.push(down);
      mods.push([up, '']);
      if (a.grid.get(left) === 'c' && a.grid.get(right) === 'c' &&
          this.random.nextInt(3)) {
        mods.push([down, ''], [c, '<']);
        return mods;
      }
    } else if (stair === '>') {
      neighbors.push(up);
      mods.push([down, '']);
    }
    // NOTE: if we delete then we forget to zero it out...
    // But it would still be nice to "point" them in the easy direction?
    // if (this.delta < -16) neighbors.splice(2, 1);
    // if ((this.delta & 0xf) < 8) neighbors.splice(1, 1);
    neighbors = neighbors.filter(c => a.grid.get(c) === 'c');
    if (!neighbors.length) return [];
    const keep = this.random.nextInt(neighbors.length);
    for (let j = 0; j < neighbors.length; j++) {
      if (j !== keep) mods.push([neighbors[j], '']);
    }
    mods.push([c, stair]);
    return mods;
  }

  tryAddStair(a: A, c: GridCoord, stairs: number[]): boolean {
    if (a.fixed.has((c | 0x808) as GridCoord)) return false;
    const tile = this.extract(a.grid, c);
    const both = stairs[0] && stairs[1];
    const total = stairs[0] + stairs[1];
    const up = this.random.nextInt(total) < stairs[0];
    const candidates = [up ? 0 : 1];
    if (both) candidates.push(up ? 1 : 0);
    for (const stair of candidates) {
      const stairChar = '<>'[stair];
      const stairTile = tile.substring(0, 4) + stairChar + tile.substring(5);
      if (this.orig.tileset.getMetascreensFromTileString(stairTile).length) {
        a.grid.set((c | 0x808) as GridCoord, stairChar);
        stairs[stair]--;
        return true;
      }
    }
    return false;
  }

  /**
   * Attempt to make a path connecting start to end (both centers).
   * Requires all ...?
   */
  tryConnect(a: A, start: GridCoord, end: GridCoord,
             char: string, attempts = 1): boolean {
    while (attempts-- > 0) {
      const replace = new Map<GridCoord, string>();
      let pos = start;
      if ((start & end & 0x808) !== 0x808) {
        throw new Error(`bad start ${hex(start)} or end ${hex(end)}`);
      }
      replace.set(pos, char);
      while (pos !== end) {
        // on a center - find eligible directions
        const dirs: number[] = [];
        for (const dir of [8, -8, 0x800, -0x800]) {
          const pos1 = pos + dir as GridCoord;
          const pos2 = pos + 2 * dir as GridCoord;
          if (a.fixed.has(pos2)) continue;
          if (replace.get(pos2) ?? a.grid.get(pos2)) continue;
          if (a.grid.isBorder(pos1)) continue;
          dirs.push(dir);
        }
        if (!dirs.length) break;
        const dy = (end >> 12) - (pos >> 12)
        const dx = (end & 0xf0) - (pos & 0xf0);
        const preferred = new Set<number>(dirs);
        if (dy < 0) preferred.delete(0x800);
        if (dy > 0) preferred.delete(-0x800);
        if (dx < 0) preferred.delete(8);
        if (dx > 0) preferred.delete(-8);
        // 3:1 bias for preferred directions  (TODO - backtracking?)
        dirs.push(...preferred, ...preferred);
        const dir = this.random.pick(dirs);
        replace.set(pos + dir as GridCoord, char);
        replace.set(pos = pos + 2 * dir as GridCoord, char);
      }
      if (pos !== end) continue;
      // If we got there, make the changes.
      for (const [c, v] of replace) {
        a.grid.set(c, v);
        if ((c & 0x808) === 0x808) a.count++;
      }
      return true;
    }
    return false;
  }

  tryAddLoop(a: A, char: string, attempts = 1): boolean {
    // pick a pair of coords for start and end
    const uf = new UnionFind<GridCoord>();
    for (let i = 0; i < a.grid.data.length; i++) {
      const c = a.grid.coord(i as GridIndex);
      if (a.grid.get(c) || a.grid.isBorder(c)) continue;
      if (!a.grid.get(E(c))) uf.union([c, E(c)]);
      if (!a.grid.get(S(c))) uf.union([c, S(c)]);
    }
    const eligible =
        new DefaultMap<unknown, [GridCoord, GridCoord][]>(() => []);
    for (const s of a.grid.screens()) {
      const c = s + 0x808 as GridCoord;
      if (!a.grid.get(c)) continue;
      for (const d of [8, -8, 0x800, -0x800]) {
        const e1 = c + d as GridCoord;
        if (a.grid.isBorder(e1) || a.grid.get(e1)) continue;
        const e2 = c + 2 * d as GridCoord;
        if (a.grid.get(e2)) continue;
        const replace = new Map([[e1 as GridCoord, char]]);
        const tile = this.extract(a.grid, s, {replace});
        if (this.orig.tileset.getMetascreensFromTileString(tile).length) {
          eligible.get(uf.find(e2)).push([e1, e2]);
        }
      }
    }
    const weightedMap = new Map<GridCoord, [GridCoord, GridCoord][]>();
    for (const partition of eligible.values()) {
      if (partition.length < 2) continue; // TODO - 3 or 4?
      for (const [e1] of partition) {
        weightedMap.set(e1, partition);
      }
    }
    const weighted = [...weightedMap.values()];
    if (!weighted.length) return false;
    while (attempts-- > 0) {
      const partition = this.random.pick(weighted);
      const [[e0, c0], [e1, c1]] = this.random.ishuffle(partition);
      a.grid.set(e0, char);
      a.grid.set(e1, char);
      if (this.tryConnect(a, c0, c1, char, 5)) {
        return true;
      }
      a.grid.set(e0, '');
      a.grid.set(e1, '');
    }
    return false;
  }

  /**
   * Attempt to extend an existing screen into a direction that's
   * currently empty.  Length is probabilistic, each successful
   * attempt will have a 1/length chance of stopping.  Returns number
   * of screens added.
   */
  tryExtrude(a: A, char: string, length: number, attempts = 1): number {
    // Look for a place to start.
    while (attempts--) {
      for (const c of this.random.ishuffle(a.grid.screens())) {
        const mid = c + 0x808 as GridCoord;
        if (!a.grid.get(mid)) continue;
        const tile = this.extract(a.grid, c);
        for (let dir of this.random.ishuffle([0, 1, 2, 3])) {
          const n1 = mid + GRIDDIR[dir] as GridCoord;
          const n2 = mid + 2 * GRIDDIR[dir] as GridCoord;
//console.log(`mid: ${mid.toString(16)}; n1(${n1.toString(16)}): ${a.grid.get(n1)}; n2(${n2.toString(16)}): ${a.grid.get(n2)}`);
          if (a.grid.get(n1) || a.grid.isBorder(n1) || a.grid.get(n2)) continue;
          const i = TILEDIR[dir];
          const rep = tile.substring(0, i) + char + tile.substring(i + 1);
          if (this.orig.tileset.getMetascreensFromTileString(rep).length) {
            a.grid.set(n1, char);
            a.grid.set(n2, char);
            const added = this.tryContinueExtrude(a, char, length, n2);
            if (added) return added;
            a.grid.set(n2, '');
            a.grid.set(n1, '');
          }
        }
      }
    }
    return 0;
  }

  /** Recursive attempt. */
  tryContinueExtrude(a: A, char: string, length: number, c: GridCoord): number {
    const tile = this.extract(a.grid, c - 0x808 as GridCoord);
    const ok = this.orig.tileset.getMetascreensFromTileString(tile).length > 0;
    if (length === 1) return ok ? 1 : 0;
    // maybe return early
    if (ok && !this.random.nextInt(length)) return 1;
    // find a new direction
    for (const dir of this.random.ishuffle([0, 1, 2, 3])) {
      const n1 = c + GRIDDIR[dir] as GridCoord;
      const n2 = c + 2 * GRIDDIR[dir] as GridCoord;
      if (a.grid.get(n1) || a.grid.isBorder(n1) || a.grid.get(n2)) continue;
      const i = TILEDIR[dir];
      const rep = tile.substring(0, i) + char + tile.substring(i + 1);
      if (this.orig.tileset.getMetascreensFromTileString(rep).length) {
        a.grid.set(n1, char);
        a.grid.set(n2, char);
        const added = this.tryContinueExtrude(a, char, length - 1, n2);
        if (added) return added + 1;
        a.grid.set(n2, '');
        a.grid.set(n1, '');
      }
      if (ok) break;
    }
    return ok ? 1 : 0;
  }

  /** Attempt to add a grid type. */
  tryAdd(a: A, opts: AddOpts = {}): number {
    // Optionally start at the given screen only.
    const tileset = this.orig.tileset;
    const {attempts = 1, char = 'c', start, loop = false} = opts;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const startIter =
          start != null ?
              [(start & 0xf0f0) as GridCoord] :
              this.random.ishuffle(a.grid.screens());
      for (const c of startIter) {
        const mid = c + 0x808 as GridCoord;
        if (!a.grid.get(mid)) continue;
        const tile = this.extract(a.grid, c);
        for (let dir of this.random.ishuffle([0, 1, 2, 3])) {
          const n1 = mid + GRIDDIR[dir] as GridCoord;
          const n2 = mid + 2 * GRIDDIR[dir] as GridCoord;
          if (a.fixed.has(n1) || a.fixed.has(n2)) continue;
          const o1 = a.grid.get(n1);
          const o2 = a.grid.get(n2);
//console.log(`mid(${mid.toString(16)}): ${a.grid.get(mid)}; n1(${n1.toString(16)}): ${a.grid.get(n1)}; n2(${n2.toString(16)}): ${a.grid.get(n2)}`);
          // allow making progress on top of an edge-only connection.
          if ((o1 && (o2 || o1 !== char)) || a.grid.isBorder(n1)) continue;
          if (!loop) {
            const neighborTile = this.extract(a.grid, n2 - 0x808 as GridCoord,
                                              {replace: new Map([[n1, '']])});
            if (/\S/.test(neighborTile)) continue;
          }
          const i = TILEDIR[dir];
          const rep = tile.substring(0, i) + char + tile.substring(i + 1);
          if (tileset.getMetascreensFromTileString(rep).length) {
            a.count++;
            a.grid.set(n1, char);
            a.grid.set(n2, char);
            // if (length > 1) {
            //   const added = this.tryContinueExtrude(a, char, length, n2);
            //   if (added) return added;
            // } else {
            const neighborTile = this.extract(a.grid, n2 - 0x808 as GridCoord);
            if (tileset.getMetascreensFromTileString(neighborTile).length) {
              return 1;
            } 
            // }
            a.grid.set(n2, o2);
            a.grid.set(n1, o1);
            a.count--;
          }
        }
      }
    }
    return 0;
  }

  // /**
  //  * Attempt to extend an existing screen into a direction that's
  //  * currently empty.  Length is probabilistic, each successful
  //  * attempt will have a 1/length chance of stopping.  Returns number
  //  * of screens added.
  //  */
  // tryExtrude(a: A, char: string, length: number, attempts = 1): number {
  //   // Look for a place to start.
  //   while (attempts--) {
  //     for (const c of this.random.ishuffle(a.grid.screens())) {
  //       const mid = c + 0x808 as GridCoord;
  //       if (!a.grid.get(mid)) continue;
  //       const tile = this.extract(a.grid, c);
  //       for (let dir of [0, 1, 2, 3]) {
  //         if (a.grid.get(mid + 2 * GRIDDIR[dir] as GridCoord)) continue;
  //         const i = TILEDIR[dir];
  //         if (tile[i] !== ' ') continue;
  //         const rep = tile.substring(0, i) + char + tile.substring(i + 1);
  //         if (this.orig.tileset.getMetascreensFromTileString(rep).length) {
  //           const added = this.tryContinueExtrude(a, char, length, mid, dir);
  //           if (added) return added;
  //         }
  //       }
  //     }
  //   }
  //   return 0;
  // }

  // tryContinueExtrude(a: A, char: string, length: number,
  //                    mid: GridCoord, dir: number): number {
  //   const replace = new Map<GridCoord, string>([]);
  //   let works: Array<[GridCoord, string]>|undefined;
  //   let weight = 0;
  //   OUTER:
  //   while (true) {
  //     replace.set(mid + GRIDDIR[dir] as GridCoord, char);
  //     replace.set(mid + 2 * GRIDDIR[dir] as GridCoord, char);
  //     mid = (mid + 2 * GRIDDIR[dir]) as GridCoord;

  //     const tile = this.extract(a.grid, mid - 0x808 as GridCoord, {replace});
  //     weight++;
  //     if (this.orig.tileset.getMetascreensFromTileString(tile).length) {
  //       works = [...replace];
  //       // we can quit now - see if we should.
  //       while (weight > 0) {
  //         if (!this.random.nextInt(length)) break OUTER;
  //         weight--;
  //       }
  //     }

  //     // Find a viable next step.
  //     for (const nextDir of this.random.ishuffle([0, 1, 2, 3])) {
  //       const delta = GRIDDIR[nextDir];
  //       const edge = mid + delta as GridCoord;
  //       if (a.grid.isBorder(edge)) continue;
  //       if (replace.get(...) || a.grid.get(mid + 2 * delta as GridCoord)) continue;
  //       const i = TILEDIR[dir];
  //       if (tile[i] !== ' ') continue;
  //       const rep = tile.substring(0, i) + char + tile.substring(i + 1);
  //       if (this.orig.tileset.getMetascreensFromTileString(rep).length) {
  //         replace.set(mid + delta as GridCoord, char);
  //         replace.set(mid + 2 * delta as GridCoord, char);
  //         dir = nextDir;
  //         continue OUTER;
  //       }
  //     }
  //     break; // never found a follow-up, so quit
  //   }
  //   if (!works) return 0;
  //   for (const [c, v] of works) {
  //     a.grid.set(c, v);
  //   }
  //   return works.length >>> 1;
  // }

  /** Make arrangements to maximize the success chances of infer. */
  preinfer(a: A): Result<void> {
    let result;
    if (this.params.features?.spike) {
      if ((result = this.preinferSpikes(a)), !result.ok) return result;
    }
    return OK;
  }

  preinferSpikes(a: A): Result<void> {
    // make sure there's a 'c' above each 's'
    // check sides?
    return OK;
  }

  inferScreens(a: A): Result<Metalocation> {
    const screens: Metascreen[] = [];
    for (const s of a.grid.screens()) {
      const tile = this.extract(a.grid, s);
      const candidates =
          this.orig.tileset.getMetascreensFromTileString(tile)
              .filter(s => !s.data.mod);
      if (!candidates.length) {
        //console.error(a.grid.show());
if (a.grid.show().length > 100000) debugger;
        return {ok: false, fail: `infer screen ${hex(s)}: [${tile}]\n${a.grid.show()}`};
      }
      const pick = this.random.pick(candidates);
      screens.push(pick);
      if (pick.hasFeature('wall')) a.walls++;
      if (pick.hasFeature('bridge')) a.bridges++;

      // TODO - any other features to track?

    }

    const meta = new Metalocation(this.params.id, this.orig.tileset, a.h, a.w);
    for (let y = 0; y < a.h; y++) {
      for (let x = 0; x < a.w; x++) {
        meta.set(y << 4 | x, screens[y * a.w + x]);
      }
    }

    return {ok: true, value: meta};
  }

  refineMetascreens(a: A, meta: Metalocation): Result<void> {
    // make sure we have the right number of walls and bridges
    // a.walls = a.bridges = 0; // TODO - don't bother making these instance
    // for (const pos of meta.allPos()) {
    //   const scr = meta.get(pos);
    //   if (scr.hasFeature('bridge')) {console.warn(hex(pos)); a.bridges++;}
    //   if (scr.hasFeature('wall')) a.walls++;
    // }
    const bridges = this.params.features?.bridge || 0;
    const walls = this.params.features?.wall || 0;
    for (const pos of this.random.ishuffle(meta.allPos())) {
      const c = ((pos << 8 | pos << 4) & 0xf0f0) as GridCoord;
      const tile = this.extract(a.grid, c)
      const scr = meta.get(pos);
      if (a.bridges <= bridges && scr.hasFeature('bridge')) continue;
      if (this.addBlocks &&
          this.tryMeta(meta, pos, this.orig.tileset.withMod(tile, 'block'))) {
        if (scr.hasFeature('bridge')) a.bridges--;
        continue;
      }
      if (scr.hasFeature('bridge')) {
        if (this.tryMeta(meta, pos,
                         this.orig.tileset.withMod(tile, 'bridge'))) {
          a.bridges--;
          continue;
        }
      // } else if (bridges < a.bridges && scr.hasFeature('bridge')) {
      //   // can't add bridges?
      //   return false;
      }
      if (a.walls < walls && !scr.hasFeature('wall')) {
        if (this.tryMeta(meta, pos, this.orig.tileset.withMod(tile, 'wall'))) {
          a.walls++;
          continue;
        }
      }
    }
    // console.warn(`bridges ${a.bridges} ${bridges} / walls ${a.walls} ${walls}\n${a.grid.show()}\n${meta.show()}`);
    if (a.bridges !== bridges) {
      return {ok: false,
              fail: `refineMeta bridges want ${bridges} got ${a.bridges}\n${meta.show()}`};
    }
    if (a.walls !== walls) {
      return {ok: false,
              fail: `refineMeta walls want ${walls} got ${a.walls}\n${meta.show()}`};
    }
    return OK;
  }

  tryMeta(meta: Metalocation, pos: Pos,
          screens: Iterable<Metascreen>): boolean {
    for (const s of screens) {
      if (!this.checkMeta(meta, new Map([[pos, s]]))) continue;
      meta.set(pos, s);
      return true;
    }
    return false;
  }

  checkMeta(meta: Metalocation, replacements?: Map<Pos, Metascreen>): boolean {

    // TODO - flight?  may have a diff # of flight vs non-flight partitions
    const opts = replacements ? {with: replacements} : {};
    const parts = meta.traverse(opts);
    return new Set(parts.values()).size === this.maxPartitions;
  }

  requireEligiblePitDestination(meta: Metalocation): boolean {
    let v = false;
    let h = false;
    for (const pos of meta.allPos()) {
      const scr = meta.get(pos);
      if (scr.hasFeature('river') || scr.hasFeature('empty')) continue;
      const edges =
        (scr.data.edges || '').split('').map(x => x === ' ' ? '' : x);
      if (edges[0] && edges[2]) v = true;
      // NOTE: we clamp the target X coords so that spike screens are all good
      // this prevents errors from not having a viable destination screen.
      if ((edges[1] && edges[3]) || scr.hasFeature('spikes')) {
        h = true;
      }
      if (v && h) return true;
    }
    return false;
  }

  checkMetascreens(a: A, meta: Metalocation): Result<void> {
    if (!this.params.features?.statue) return OK;
    let statues = 0;
    for (const pos of meta.allPos()) {
      const scr = meta.get(pos);
      statues += scr.data.statues?.length || 0;
    }
    if (statues < this.params.features.statue) {
      return {ok: false, fail: `insufficient statue screens`};
    }
    return OK;
  }
}

// TODO:
//  - when there's a bridge, new rule to require a stair or poi
//    to be partitioned off if bridge tile is removed
//  - possibly also *link* to other screen?
//  - place bridge early or late?
//    - if early then no way to enforce throughness rule
//    - if late then hard to sync up with other floor
// ALSO, we don't have a ref to the tileset right now, don't even
// know what the tiles are!  Need to map the 3x3 grid of (??) to
// metatiles.
//  - consider updating "edge" to be whole 9x9?
//     ' c /ccc/   '
//     cave('cc c', 'c')
//     tile`
//       | c |
//       |ccc|
//       |   |`,
//
//     tile`
//       |   |
//       |cu |
//       |   |`,
//
// Basic idea would be to simplify the "features" bit quite a bit,
// and encapsulate the whole thing into the tile - edges, corners, center.
//
// For overworld, 'o' means open, 'g' for grass, etc...?
// - then the letters are always the walkable tiles, which makes sense
//   since those are the ones that have all the variety.
//     tile`
//       |oo |
//       |oo |
//       |   |`,
//     tile`
//       |oo |
//       |ooo|
//       |ogo|`,

// export class CaveShuffleAttempt extends MazeShuffleAttempt {

//   readonly tileset: Metatileset;
//   readonly grid: Grid<string>;
//   readonly fixed = new Set<GridCoord>();
//   readonly screens: readonly GridCoord[] = [];
//   meta!: Metalocation;
//   count = 0;
//   walls = 0;
//   bridges = 0;
//   maxPartitions = 1;
//   minSpikes = 2;

//   constructor(readonly h: number, readonly w: number,
//               readonly params: Survey, readonly random: Random) {
//     super();
//     this.grid = new Grid(h, w);
//     this.grid.data.fill('');
//     for (let y = 0.5; y < h; y++) {
//       for (let x = 0.5; x < w; x++) {
//         if (y > 1) this.grid.set2(y - 0.5, x, 'c');
//         if (x > 1) this.grid.set2(y, x - 0.5, 'c');
//         this.grid.set2(y, x, 'c');
//       }
//     }
//     this.count = h * w;
//     const screens: GridCoord[] = [];
//     for (let y = 0; y < this.h; y++) {
//       for (let x = 0; x < this.w; x++) {
//         screens.push((y << 12 | x << 4) as GridCoord);
//       }
//     }
//     this.screens = screens;
//   }


  // checkReachability(replace?: Map<GridCoord, string>): boolean {
  //   throw new Error();
  // }


export class WideCaveShuffle extends CaveShuffle {
  addLateFeatures(a: A): Result<void> {
    let result = super.addLateFeatures(a);
    if (!result.ok) return result;
    a.grid.data = a.grid.data.map(c => c === 'c' ? 'w' : c);
    return OK;
  }
}

export class CryptEntranceShuffle extends CaveShuffle {
  refineMetascreens(a: A, meta: Metalocation): Result<void> {
    // change arena into crypt arena
    for (let y = 0; y < a.h; y++) {
      for (let x = 0; x < a.w; x++) {
        if (a.grid.get((y << 12 | x << 4 | 0x808) as GridCoord) === 'a') {
          meta.set(y << 4 | x, meta.rom.metascreens.cryptArena_statues);
        }
      }
    }
    return super.refineMetascreens(a, meta);
  }

  isEligibleArena(a: A, c: GridCoord): boolean {
    return !a.grid.get(c - 0x800 as GridCoord) && super.isEligibleArena(a, c);
  }
}

const TILEDIR = [1, 3, 7, 5];
const GRIDDIR = [-0x800, -8, 0x800, 8];

// This might cover all of tryExtrude, tryContinueExtrude, tryConnect
//  - could also find a way to add tryAddLoop?
interface AddOpts {
  char?: string;
  // length: number;
  start?: GridCoord;
  // end: GridCoord;
  loop?: boolean; // allow vs require?

  attempts?: number;

  // branch: boolean;
  // reducePartitions: boolean;  -- or provide a "smart pick start/end" wrapper

  // TODO - some idea of whether to prefer extending an existing
  // dead end or not - this would provide some sort of "branching factor"
  // whereby we can tightly control how many dead ends we get...?
  // Provide a "find dead ends" function?
  //   - imagine a version of windmill cave where we wander two screens,
  //     then connect the dead ends, then branch and wander a little more?
}

// TODO - potentially we could look at the whole problem
// as making a list of extrude/feature types:
//   - r, c, branch, arena, bridge, stair, ...?
// nucleate w/ any edges, have a list of these operations and then
// try each one, if it doesn't work, reshuffle it later (fixed # of draws
// before giving up).
