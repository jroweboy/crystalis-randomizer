import {FlagSet} from '../flagset.js';
import {Rom} from '../rom.js';
import {Boss} from '../rom/bosses.js';
import {Flag} from '../rom/flags.js';
import {Item, ItemUse} from '../rom/item.js';
import {Location, Spawn} from '../rom/location.js';
import {LocalDialog, Npc} from '../rom/npc.js';
import {hex} from '../rom/util.js';
import {UnionFind} from '../unionfind.js';
import {DefaultMap, LabeledSet} from '../util.js';
import {Dir} from './dir.js';
import {ItemInfo, LocationList, SlotInfo} from './graph.js';
import {Hitbox} from './hitbox.js';
import {Condition, Requirement, Route} from './requirement.js';
import {ScreenId} from './screenid.js';
import {Terrain, Terrains} from './terrain.js';
import {TileId} from './tileid.js';
import {TilePair} from './tilepair.js';
import {WallType} from './walltype.js';
import { Slot } from '../nodes.js';

const [] = [hex];

interface Check {
  requirement: Requirement;
  checks: number[];
}

// Basic algorithm:
//  1. fill terrains from maps
//  2. modify terrains based on npcs, triggers, bosses, etc
//  2. fill allExits
//  3. start unionfind
//  4. fill ...?

/** Stores all the relevant information about the world's logic. */
export class World {

  /** Whether we're building the world for the tracker. */
  readonly tracker = false;

  /** Builds and caches Terrain objects. */
  readonly terrainFactory = new Terrains(this.rom);

  /** Terrains mapped by TileId. */
  readonly terrains = new Map<TileId, Terrain>();

  /** Checks mapped by TileId. */
  readonly checks = new DefaultMap<TileId, Set<Check>>(() => new Set());

  /** Slot info, built up as we discover slots. */
  readonly slots = new Map<number, SlotInfo>();

  /** Flags that should be treated as direct aliases for logic. */
  readonly aliases: Map<Flag, Flag>;

  /** Mapping from itemuse triggers to the itemuse that wants it. */
  readonly itemUses = new DefaultMap<number, [Item, ItemUse][]>(() => []);

  /** Mapping from exits to entrances. */
  readonly exitSet = new Set<TilePair>();

  /**
   * Set of TileIds with seamless exits.  This is used to ensure the
   * logic understands that the player can't walk across an exit tile
   * without changing locations (primarily for disabling teleport
   * skip).
   */
  readonly seamlessExits = new Set<TileId>();

  /**
   * Unionfind of connected components of tiles.  Note that all the
   * above properties can be built up in parallel, but the unionfind
   * cannot be started until after all terrains and exits are
   * registered, since we specifically need to *not* union certain
   * neighbors.
   */
  readonly tiles = new UnionFind<TileId>();

  /**
   * Map of TilePairs of canonical unionfind representative TileIds to
   * a bitset of neighbor directions.  We only need to worry about
   * representative elements because all TileIds have the same terrain.
   * We will add a route for each direction with unique requirements.
   */
  readonly neighbors = new DefaultMap<TilePair, number(() => 0);

  /** Requirement builder for reaching each canonical TileId. */
  readonly routes =
      new DefaultMap<TileId, Requirement.Builder>(
          () => new Requirement.Builder());

  /** Routes originating from each canonical tile. */
  readonly routeEdges =
      new DefaultMap<TileId, LabeledSet<Route>>(() => new LabeledSet());

  /** Location list: this is the result of combining routes with checks. */
  readonly requirementMap =
      new DefaultMap<Condition, Requirement.Builder>(
          () => new Requirement.Builder());

  constructor(readonly rom: Rom, readonly flagset: FlagSet) {
    // Build itemUses
    for (const item of rom.items) {
      for (const use of item.itemUseData) {
        if (use.kind === 'expect') {
          this.itemUses.get(use.want).push([item, use]);
        } else if (use.kind === 'location') {
          this.itemUses.get(~use.want).push([item, use]);
        }
      }
    }
    // Build aliases
    this.aliases = new Map([
      [rom.flags.ChangeAkahana, rom.flags.Change],
      [rom.flags.ChangeSoldier, rom.flags.Change],
      [rom.flags.ChangeStom, rom.flags.Change],
      [rom.flags.ChangeWoman, rom.flags.Change],
      [rom.flags.ParalyzedKensuInDanceHall, rom.flags.Paralysis],
      [rom.flags.ParalyzedKensuInTavern, rom.flags.Paralysis],
    ]);
    // Iterate over locations to build up info about tiles, terrains, checks.
    for (const location of rom.locations) {
      this.processLocation(location);
    }
    this.addExtraChecks();

    // Build up the UnionFind and the exits and neighbors structures.
    this.unionNeighbors();
    this.recordExits();
    this.buildNeighbors();

    // Build the routes/edges.
    this.addAllRoutes();

    // Build the location list.
    this.consolidateChecks();
    this.buildRequirementMap();
  }

  /** Adds checks that are not detectable from data tables. */
  addExtraChecks() {
    const {
      locations: {
        LeafToolShop,
        MezameShrine,
        Oak,
        ShyronToolShop,
      },
      flags: {
        AbleToRideDolphin,
        BallOfFire, BallOfThunder, BallOfWater, BallOfWind,
        Barrier, BlizzardBracelet, BowOfMoon, BowOfSun,
        BreakStone, BreakIce, BreakIron,
        BrokenStatue, BuyHealing, BuyWarp,
        ClimbWaterfall, ClimbSlope8, ClimbSlope9,
        Flight, FlameBracelet, FormBridge
        GasMask, GlowingLamp,
        LeadingChild, LeatherBoots,
        Money,
        OpenedCrypt,
        RabbitBoots, RepairedStatue, RescuedChild,
        ShootingStatue, StormBracelet, Sword, SwordOfFire, SwordOfThunder,
        SwordOfWater, SwordOfWind,
        TornadoBracelet, TravelSwamp,
      },
      items: {
        MedicalHerb,
        WarpBoots,
      },
    } = this.rom;
    const start = this.entrance(MezameShrine);
    const enterOak = this.entrance(Oak);
    this.addCheck([start], and(BowOfMoon, BowOfSun), [OpenedCrypt.id]);
    this.addCheck([enterOak], and(LeadingChild), [RescuedChild.id]);
    this.addItemCheck([start], and(GlowingLamp, BrokenStatue],
                      RepairedStatue.id, {lossy: true, unique: true});

    // Add shops
    for (const shop of this.rom.shops) {
      // leaf and shyron may not always be accessible, so don't rely on them.
      if (shop.location === LeafToolShop.id) continue;
      if (shop.location === ShyronToolShop.id) continue;
      if (!shop.used) continue;
      if (shop.type !== ShopType.TOOL) continue;
      const hitbox = [TileId(shop.location << 16 | 0x88)];
      for (const item of shop.contents) {
        if (item === MedicalHerb.id) {
          this.addCheck(hitbox, Money.r, [BuyHealing.id]);
        } else if (item === WarpBoots.id) {
          this.addCheck(hitbox, Money.r, [BuyWarp.id]);
        }
      }
    }

    // Add pseudo flags
    let breakStone = SwordOfWind.r;
    let breakIce = SwordOfFire.r;
    let formBridge = SwordOfWater.r;
    let breakIron = SwordOfThunder.r;
    if (!this.flagset.orbsOptional()) {
      const wind2 = or(BallOfWind, TornadoBracelet);
      const fire2 = or(BallOfFire, FlameBracelet);
      const water2 = or(BallOfWater, BlizzardBracelet);
      const thunder2 = or(BallOfThunder, StormBracelet);
      breakStone = Requirement.meet(breakStone, wind2);
      breakIce = Requirement.meet(breakIce, fire2);
      formBridge = Requirement.meet(formBridge, water2);
      breakIron = Requirement.meet(breakIron, );
      if (this.flagset.assumeSwordChargeGlitch()) {
        const level2 =
            Requirement.join(breakStone, breakIce, formBridge, breakIron);
        function need(sword: Flag): Requirement {
          return level2.map(c => c[0] === sword.c ? c : [condition, ...c]);
        }
        breakStone = need(SwordOfWind);
        breakIce = need(SwordOfFire);
        formBridge = need(SwordOfWater);
        breakIron = need(SwordOfThunder);
      }
    }
    this.addCheck([start], breakStone, [BreakStone.id]);
    this.addCheck([start], breakIce, [BreakIce.id]);
    this.addCheck([start], formBridge, [FormBridge.id]);
    this.addCheck([start], breakIron, [BreakIron.id]);
    this.addCheck([start],
                  or(SwordOfWind, SwordOfFire, SwordOfWater, SwordOfThunder),
                  [Sword.id, Money.id]);
    this.addCheck([start], Flight.r, [ClimbWaterfall.id]);
    this.addCheck([start], or(Flight, RabbitBoots), [ClimbSlope8.id]);
    this.addCheck([start], or(Flight, RabbitBoots), [ClimbSlope9.id]);
    this.addCheck([start], Barrier.r, [ShootingStatue.id]);
    this.addCheck([start], GasMask.r, [TravelSwamp.id]);

    if (this.flagset.leatherBootsGiveSpeed()) {
      this.addCheck([start], LeatherBoots.r, [ClimbSlope8.id]);
    }
    if (this.flagset.assumeGhettoFlight()) {
      this.addCheck(
        [start], and(AbleToRideDolphin, RabbitBoots), [ClimbWaterfall.id]);
    }
    if (this.flagset.fogLampNotRequired()) {
      // not actually used
      this.addCheck([start], ShellFlute.r, [AbleToRideDolphin.id]);
    }
    if (!this.flagset.guaranteeBarrier()) {
      this.addCheck([start], [[Money.c, BuyHealing.c],
                              [Money.c, ShieldRing.c],
                              [Money.c, Refresh.c]], [ShootingStatue.id]);
    }
    if (!this.flags.guaranteeGasMask()) {
      this.addCheck([start], [[Money.c, BuyHealing.c],
                              [Money.c, Refresh.c]], [TravelSwamp.id]);
    }
  }

  /** Adds routes that are not detectable from data tables. */
  addExtraRoutes() {
    const {
      locations: {
        MezameShrine,
      },
      flags: {
        BuyWarp,
        SwordOfThunder,
        Teleport,
      },
    } = this.rom;
    // Start the game at Mezame Shrine.
    this.addRoute(new Route(this.entrance(MezameShrine), Requirement.OPEN));
    // Sword of Thunder warp
    if (this.flagset.teleportOnThunderSword()) {
      const warp = this.rom.townWarp.thunderSwordWarp;
      this.addRoute(new Route(this.entrance(warp[0], warp[1] & 0x1f),
                              [[SwordOfThunder.c, BuyWarp.c],
                               [SwordOfThunder.c, Teleport.c]]));
    }
    // Wild warp
    if (this.flagset.assumeWildWarp()) {
      for (const location of this.rom.wildWarp.locations) {
        this.addRoute(new Route(this.entrance(location)));
      }
    }
  }

  /** Change the key of the checks map to only be canonical TileIds. */
  consolidateChecks() {
    for (const [tile, checks] of this.checks) {
      const root = this.tiles.find(tile);
      if (tile === root) continue;
      for (const check of checks) {
        this.checks.get(root).add(check);
      }
      this.checks.delete(tile);
    }
  }

  /** At this point we know that all of this.checks' keys are canonical. */
  buildRequirementMap() {
    for (const [tile, checks] of this.checks) {
      for (const {check, requirement} of checks) {
        const req = this.requirementMap.get(check);
        for (const r1 of requirement) {
          for (const r2 of this.routes.get(tile) || []) {
            req.addList([...r1, ...r2]);
          }
        }
      }
    }
  }

  /** Returns a LocationList structure after the requirement map is built. */
  getLocationList(): LocationList {
    // TODO - consider just implementing this directly?
    const itemInfos = new Map<number, ItemInfo>();
    for (const itemget of this.rom.itemGets) {
      const item = this.rom.items[itemget.itemId];
      const unique = item.unique;
      const losable = itemget.isLosable();
      // TODO - refactor to just "can't be bought"?
      const preventLoss = unique || item === this.rom.items.OpelStatue;
      let weight = 1;
      if (item === this.rom.items.SwordOfWind) weight = 5;
      if (item === this.rom.items.SwordOfFire) weight = 5;
      if (item === this.rom.items.SwordOfWater) weight = 10;
      if (item === this.rom.items.SwordOfThunder) weight = 15;
      if (item === this.rom.items.Flight) weight = 15;
      itemInfos.set(itemget.id, {unique, losable, preventLoss, weight});
    }
    return {
      requirements: this.requirementMap,
      items: itemInfos,
      slots: this.slotInfo,
      name: (check: number) => this.rom.flags[check].name,
      prefill: (random: Random) => {
        const {Crystalis, ForgeCrystalis, LeafElder} = this.rom.flags;
        const map = new Map([[ForgeCrystalis.id, Crystalis.id]]);
        if (this.flagset.guaranteeSword()) {
          // Pick a sword at random...? inverse weight?
          map.set(LeafElder.id, 0x200 | random.nextInt(4));
        }
        return map;
        // TODO - if any items shouldn't be shuffled, then do the pre-fill...
      },
    };
  }

  /** Add terrains and checks for a location, from tiles and spawns. */
  processLocation(location: Location) {
    if (!location.used) return;
    // Look for walls, which we need to know about later.
    this.processLocationTiles(location);
    this.processLocationSpawns(location);
    this.processLocationItemUses(location);
  }

  /** Run the first pass of unions now that all terrains are final. */
  unionNeighbors() {
    for (const [tile, terrain] of this.terrains) {
      const x1 = TileId.add(tile, 0, 1);
      if (this.terrains.get(x1) === terrain) this.tiles.union([tile, x1]);
      const y1 = TileId.add(tile, 1, 0);
      if (this.terrains.get(y1) === terrain) this.tiles.union([tile, y1]);
    }
  }

  /** Builds up the routes and routeEdges data structures. */
  addAllRoutes() {
    // Add any extra routes first, such as the starting tile.
    this.addExtraRoutes();
    // Add all the edges from all neighbors.
    for (const [pair, dirs] of this.neighbors) {
      const [c0, c1] = TilePair.split(exit);
      const t0 = this.terrains.get(c0);
      const t1 = this.terrains.get(c1);
      if (!t0 || !t1) throw new Error(`missing terrain ${hex(t0 ? c0 : c1)}`);
      for (const [dir, exitReq] of t0.exit) {
        if (!(dir & dirs)) continue;
        for (const exitConds of exitReq) {
          for (const enterConds of t1.enter) {
            this.addRoute(new Route(c1, [...exitConds, ...enterConds], c0));
          }
        }
      }
    }
  }

  /** Adds a route, optionally with a prerequisite (canonical) source tile. */
  addRoute(route: Route, source?: TileId) {
    if (source != null) {
      // Add an edge instead of a route, recursing on the source's
      // requirements.
      this.routeEdges.get(given).add(source);
      for (const srcRoute of this.routes.get(source)) {
        this.addRoute(new Route(target, [...srcRoute, ...route.deps]));
      }
      return;
    }
    // This is now an "initial route" with no prerequisite source.
    const queue = new LabeledSet<Route>();
    const seen = new LabeledSet<Route>();
    const start = route; // TODO inline
    queue.add(start);
    const iter = queue[Symbol.iterator]();
    while (true) {
      const {value, done} = iter.next();
      if (done) return;
      seen.add(value);
      queue.delete(value);
      const follow = new LabeledSet<Route>();
      const target = value.target;
      const builder = this.routes.get(target);
      if (builder.addRoute(value)) {
        for (const next of this.routeEdges.get(target)) {
          follow.add(new Route(next.target, [...value.deps, ...next.deps]));
        }
      }
      for (const next of follow) {
        if (seen.has(next)) continue;
        queue.delete(next); // re-add at the end of the queue
        queue.add(next);
      }
    }
  }

  /**
   * Builds up `this.exitSet` to include all the "from-to" tile pairs
   * of exits that _don't_ share the same terrain For any two-way exit
   * that shares the same terrain, just add it directly to the
   * unionfind.
   */
  recordExits() {
    // Add exit TilePairs to exitSet from all locations' exits.
    for (const location of this.rom.locations) {
      if (!location.used) continue;
      for (const exit of location.exits) {
        const {dest, entrance} = exit;
        const from = TileId.from(location, exit);
        // Seamless exits (0x20) ignore the entrance index, and
        // instead preserve the TileId, just changing the location.
        const to = exit.isSeamless() ?
            TileId(from & 0xffff | (dest << 16)) :
            TileId.from(this.rom.locations[dest].entrance(entrance & 0x1f));
        this.exitSet.add(
            TilePair.of(this.tiles.find(from), this.tiles.find(to)));
      }
    }
    // Look for two-way exits with the same terrain: remove them from
    // exitSet and add them to the tiles unionfind.
    for (const exit of this.exitSet) {
      const [from, to] = TilePair.split(exit);
      if (this.terrains.get(from) !== this.terrains.get(to)) continue;
      const reverse = TilePair.of(to, from);
      if (this.exitSet.has(reverse)) {
        this.tiles.union([from, to]);
        this.exitSet.delete(exit);
        this.exitSet.delete(reverse);
      }
    }
  }

  /**
   * Find different-terrain neighbors in the same location.  Add
   * representative elements to `this.neighbors` with all the
   * directions that it neighbors in.  Also add exits as neighbors.
   * This must happen *after* the entire unionfind is complete so
   * that we can leverage it.
   */
  buildNeighbors() {
    // Adjacent different-terrain tiles.
    for (const [tile, terrain] of this.terrains) {
      if (!terrain) continue;
      const y1 = TileId.add(tile, 1, 0);
      const ty1 = this.terrains.get(y1);
      if (ty1 !== terrain) this.handleAdjacentNeighbors(tile, y1, Dir.NORTH);
      const x1 = TileId.add(tile, 0, 1);
      const tx1 = this.terrains.get(x1);
      if (tx1 !== terrain) this.handleAdjacentNeighbors(tile, x1, Dir.WEST);
    }
    // Exits (just use "north" for these).
    for (const exit of this.exitSet) {
      const [t0, t1] = TilePair.split(exit);
      if (!this.terrains.has(t0) || !this.terrains.has(t1)) continue;
      const p = TilePair.of(this.tiles.find(t0), this.tiles.find(t1));
      this.neighbors.set(p, this.neighbors.get(p) | 1);
    }
  }

  handleAdjacentNeighbors(t0: TileId, t1: TileId, dir: Dir) {
    // NOTE: t0 < t1 because dir is always WEST or NORTH.
    const c0 = this.tiles.find(t0);
    const c1 = this.tiles.find(t1);
    if (!this.exits.has(t1)) {
      // 1 -> 0 (west/north).  If 1 is an exit then this doesn't work.
      const p10 = TilePair.of(c1, c0);
      this.neighbors.set(p10, this.neighbors.get(p10) | (1 << dir));
    }
    if (!this.exits.has(t0)) {
      // 0 -> 1 (east/south).  If 0 is an exit then this doesn't work.
      const opp = dir ^ 2;
      const p01 = TilePair.of(c0, c1);
      this.neighbors.set(p01, this.neighbors.get(p01) | (1 << opp));
    }
  }

  processLocationTiles(location: Location) {
    const walls = new Map<ScreenId, WallType>();
    const shootingStatues = new Set<ScreenId>();
    for (const spawn of location.spawns) {
      // Walls need to come first so we can avoid adding separate
      // requirements for every single wall - just use the type.
      if (spawn.isWall()) {
        walls.set(ScreenId.from(location, spawn), (spawn.id & 3) as WallType);
      } else if (spawn.isMonster() && spawn.id === 0x3f) { // shooting statues
        shootingStatues.add(ScreenId.from(location, spawn));
      }
    }
    const page = location.screenPage;
    const tileset = this.rom.tileset(location.tileset);
    const tileEffects = this.rom.tileEffects[location.tileEffects - 0xb3];
    const alwaysTrue = this.rom.flags.AlwaysTrue.id;

    const getEffects = (tile: TileId) => {
      const screen =
          location.screens[(tile & 0xf000) >>> 12][(tile & 0xf00) >>> 8] | page;
      return tileEffects.effects[this.rom.screens[screen].tiles[tile & 0xff]];
    };

    // Returns undefined if impassable.
    const makeTerrain = (effects: number, tile: TileId, barrier: boolean) => {
      // Check for dolphin or swamp.  Currently don't support shuffling these.
      effects &= Terrain.BITS;
      if (location.id === 0x1a) effects |= Terrain.SWAMP;
      if (location.id === 0x60 || location.id === 0x68) {
        effects |= Terrain.DOLPHIN;
      }
      // NOTE: only the top half-screen in underground channel is dolphinable
      if (location.id === 0x64 && ((tile & 0xf0f0) < 0x90)) {
        effects |= Terrain.DOLPHIN;
      }
      if (barrier) effects |= Terrain.BARRIER;
      if (effects & Terrain.SLOPE) { // slope
        // Determine length of slope: short slopes are climbable.
        // 6-8 are both doable with boots
        // 0-5 is doable with no boots
        // 9 is doable with rabbit boots only (not aware of any of these...)
        // 10 is right out
        let bottom = tile;
        let height = 0;
        while (getEffects(bottom) & Terrain.SLOPE) {
          bottom = TileId.add(bottom, 1, 0);
          height++;
        }
        if (height < 6) {
          effects &= ~Terrain.SLOPE;
        } else if (height < 9) {
          effects |= Terrain.SLOPE8;
        } else if (height < 10) {
          effects |= Terrain.SLOPE9;
        }
      }
      return this.terrainFactory.tile(effects);
    };

    for (let y = 0, height = location.height; y < height; y++) {
      const row = location.screens[y];
      const rowId = location.id << 8 | y << 4;
      for (let x = 0, width = location.width; x < width; x++) {
        const screen = this.rom.screens[row[x] | page];
        const screenId = ScreenId(rowId | x);
        const barrier = shootingStatues.has(screenId);
        const flagYx = screenId & 0xff;
        const wall = walls.get(screenId);
        const flag =
            wall != null ?
                this.wallCapability(wall) :
                location.flags.find(f => f.yx === flagYx)?.flag;
        for (let t = 0; t < 0xf0; t++) {
          const tid = TileId(screenId << 8 | t);
          let tile = screen.tiles[t];
          // flag 2ef is "always on", don't even bother making it conditional.
          if (flag === alwaysTrue && tile < 0x20) {
            tile = tileset.alternates[tile];
          }
          const effects =
              location.isShop() ? 0 : tileEffects.effects[tile] & 0x26;
          let terrain = makeTerrain(effects, tid, barrier);
          if (!terrain) throw new Error(`bad terrain for alternate`);
          if (tile < 0x20 && tileset.alternates[tile] !== tile &&
              flag !== alwaysTrue) {
            const alternate =
                makeTerrain(tileEffects.effects[tileset.alternates[tile]],
                                 tid, barrier);
            if (!alternate) throw new Error(`bad terrain for alternate`);
            if (flag == null) throw new Error(`missing flag`);
            terrain = this.terrainFactory.flag(terrain, flag, alternate);
          }
          if (terrain) this.terrains.set(tid, terrain);
        }
      }
    }

    // Clobber terrain with seamless exits
    for (const exit of location.exits) {
      if (exit.entrance & 0x20) {
        const tile = TileId.from(location, exit);
        this.seamlessExits.add(tile);
        const previous = this.terrains.get(tile);
        if (previous) {
          this.terrains.set(tile, this.terrainFactory.seamless(previous));
        }
      }
    }
  }

  processLocationSpawns(location: Location) {
    for (const spawn of location.spawns) {
      if (spawn.isTrigger()) {
        this.processTrigger(location, spawn);
      } else if (spawn.isNpc()) {
        this.processNpc(location, spawn);
      } else if (spawn.isBoss()) {
        this.processBoss(location, spawn);
      } else if (spawn.isChest()) {
        this.processChest(location, spawn);
      } else if (spawn.isMonster()) {
        this.processMonster(location, spawn);
      }
      // At what point does this logic belong elsewhere?
      for (const [item, use] of this.itemUses.get(spawn.type << 8 | spawn.id)) {
        this.processItemUse([TileId.from(location, spawn)], item, use);
      }
    }
  }

  processTrigger(location: Location, spawn: Spawn) {
    // For triggers, which tiles do we mark?
    // The trigger hitbox is 2 tiles wide and 1 tile tall, but it does not
    // line up nicely to the tile grid.  Also, the player hitbox is only
    // $c wide (though it's $14 tall) so there's some slight disparity.
    // It seems like probably marking it as (x-1, y-1) .. (x, y) makes the
    // most sense, with the caveat that triggers shifted right by a half
    // tile should go from x .. x+1 instead.

    // TODO - consider checking trigger's action: $19 -> push-down message

    // TODO - pull out this.recordTriggerTerrain() and this.recordTriggerCheck()
    const trigger = this.rom.trigger(spawn.id);
    if (!trigger) throw new Error(`Missing trigger ${spawn.id.toString(16)}`);

    const requirements = this.filterRequirements(trigger.conditions);
    const antiRequirements = this.filterAntiRequirements(trigger.conditions);

    const tile = TileId.from(location, spawn);
    let hitbox = Hitbox.trigger(location, spawn);

    const checks = [];
    for (const flag of trigger.flags) {
      const f = this.flag(flag);
      if (f?.logic.track) {
        checks.push(f.id);
      }
    }
    if (checks.length) this.addCheck(hitbox, requirements, checks);

    switch (trigger.message.action) {
    case 0x19:
      // push-down trigger
      if (trigger.id === 0x86 && !this.flagset.assumeRabbitSkip()) {
        // bigger hitbox to not find the path through
        hitbox = Hitbox.adjust(hitbox, [0, -16], [0, 16]);
      } else if (trigger.id === 0xba &&
                 !this.flagset.assumeTeleportSkip() &&
                 !this.flagset.disableTeleportSkip()) {
        // copy the teleport hitbox into the other side of cordel
        hitbox = Hitbox.atLocation(hitbox,
                                   this.rom.locations.CordelPlainEast,
                                   this.rom.locations.CordelPlainWest);
      }
      this.addTerrain(hitbox, this.terrainFactory.statue(antiRequirements));
      break;

    case 0x1d:
      // start mado 1 boss fight
      this.addBossCheck(hitbox, this.rom.bosses.Mado1, requirements);
      break;

    case 0x08: case 0x0b: case 0x0c: case 0x0d: case 0x0e: case 0x0f:
      // find itemgrant for trigger ID => add check
      this.addItemGrantChecks(hitbox, requirements, trigger.id);
      break;

    case 0x18:
      // stom fight
      {
        // Special case: warp boots glitch required if charge shots only.
        const req =
            this.flagset.chargeShotsOnly() ?
                Requirement.meet(requirements, and(this.rom.flags.WarpBoots)) :
                requirements;
        this.addItemCheck(hitbox, req, this.rom.flags.StomFightReward.id,
                          {lossy: true, unique: true});
      }
      break;

    case 0x1e:
      // forge crystalis
      this.addItemCheck(hitbox, requirements, this.rom.flags.ForgeCrystalis.id,
                        {lossy: true, unique: true});
      break;

    case 0x1f:
      this.handleBoat(tile, location, requirements);
      break;

    case 0x1b:
      // portoa palace guard moves
      // treat this as a statue?  but the conditions are not super useful...
      //   - only tracked conditions matter? 9e == paralysis... except not.
      // paralyzable?  check DataTable_35045
      this.handleMovingGuard(hitbox, location, antiRequirements);
      break;
    }
  }

  processNpc(location: Location, spawn: Spawn) {
    const npc = this.rom.npcs[spawn.id];
    if (!npc || !npc.used) throw new Error(`Unknown npc: ${hex(spawn.id)}`);
    const spawnConditions = npc.spawnConditions.get(location.id) || [];

    const tile = TileId.from(location, spawn);

    // NOTE: Rage has no walkable neighbors, and we need the same hitbox
    // for both the terrain and the check.
    //
    // NOTE ALSO - Rage probably shows up as a boss, not an NPC?
    let hitbox: Hitbox =
        [this.terrains.has(tile) ? tile : this.walkableNeighbor(tile) ?? tile];

    if (npc === this.rom.npcs.SaberaDisguisedAsMesia) {
      this.addBossCheck(hitbox, this.rom.bosses.Sabera1, requirements);
    }

    if ((npc.data[2] & 0x04) && !this.flagset.assumeStatueGlitch()) {
      let antiReq;
      antiReq = this.filterAntiRequirements(spawnConditions);
      if (npc === this.rom.npcs.Rage) {
        // TODO - move hitbox down, change requirement?
        hitbox = Hitbox.adjust(hitbox, [2, -1], [2, 0], [2, 1], [2, 2]);
        hitbox = Hitbox.adjust(hitbox, [0, -6], [0, -2], [0, 2], [0, 6]);
        // TODO - check if this works?  the ~check spawn condition should
        // allow passing if gotten the check, which is the same as gotten
        // the correct sword.
        if (this.flagset.assumeRageSkip()) antiReq = undefined;
      }
      // if spawn is always false then req needs to be open?
      if (antiReq) this.addTerrain(hitbox, this.terrainFactory.statue(antiReq));
    }

    // req is now mutable
    const [[...req]] = this.filterRequirements(spawnConditions); // single

    // Iterate over the global dialogs - do nothing if we can't pass them.
    for (const d of npc.globalDialogs) {
      const f = this.flag(~d.condition);
      if (!f?.logic.track) continue;
      req.push(f.id as Condition);
    }

    // Iterate over the appropriate local dialogs
    const locals =
        npc.localDialogs.get(location.id) ?? npc.localDialogs.get(-1) ?? [];
    for (const d of locals) {
      // Compute the condition 'r' for this message.
      const r = [...req];
      const f0 = this.flag(d.condition);
      if (f0?.logic.track) {
        r.push(f0.id as Condition);
      }
      this.processDialog(hitbox, npc, r, d);
      // Add any new conditions to 'req' to get beyond this message.
      const f1 = this.flag(~d.condition);
      if (f1?.logic.track) {
        req.push(f1.id as Condition);
      }
    }
  }

  processDialog(hitbox: Hitbox, npc: Npc,
                req: readonly Condition[], dialog: LocalDialog) {
    this.addCheckFromFlags(hitbox, [req], dialog.flags);

    const checks = [];
    switch (dialog.message.action) {
    case 0x08: case 0x0b: case 0x0c: case 0x0d: case 0x0e: case 0x0f:
      throw new Error(`Bad dialog action: ${dialog}`);

    case 0x14:
      checks.push(this.rom.flags.SlimedKensu.id);
      break;

    case 0x10:
      checks.push(this.rom.flags.AsinaInBackRoom.id);
      break;

    case 0x11:
      checks.push(0x100 | npc.data[1]);
      break;

    case 0x03:
    case 0x0a: // normally this hard-codes glowing lamp, but we extended it
      checks.push(0x100 | npc.data[0]);
      break;

    case 0x09:
      // If zebu student has an item...?  TODO - store ff if unused
      const item = npc.data[1];
      if (item !== 0xff) checks.push(0x100 | item);
      break;

    case 0x19:
      checks.push(this.rom.flags.AkahanaStoneTradein.id);
      break;

    case 0x1a:
      // TODO - can we reach this spot?  may need to move down?
      checks.push(this.rom.flags.Rage.id);
      break;

    case 0x1b:
      // Rage throwing player out...
      // This should actually already be handled by the statue code above?
      break;
    }

    // TODO - add extra dialogs for itemuse trades, extra triggers
    //      - if item traded but no reward, then re-give reward...
    if (checks.length) this.addCheck(hitbox, [req], checks);
  }

  processLocationItemUses(location: Location) {
    for (const [item, use] of this.itemUses.get(~location.id)) {
      this.processItemUse([this.entrance(location)], item, use);
    }
  }

  handleMovingGuard(hitbox: Hitbox, location: Location, req: Requirement) {
    // This is the 1b trigger action follow-up.  It looks for an NPC in 0d or 0e
    // and moves them over a pixel.  For the logic, it's always in a position
    // where just making the trigger square be a no-exit square is sufficient,
    // but we need to get the conditions right.  We pass in the requirements to
    // NOT trigger the trigger, and then we join in paralysis and/or statue
    // glitch if appropriate.  There could theoretically be cases where the
    // guard is paralyzable but the geometry prevents the player from actually
    // hitting them before they move, but it doesn't happen in practice.
    if (this.flagset.assumeStatueGlitch()) return;
    const extra: Condition[][] = [];
    for (const spawn of location.spawns.slice(0, 2)) {
      if (spawn.isNpc() && this.rom.npcs[spawn.id].isParalyzable()) {
        extra.push([this.rom.flags.Paralysis.id as Condition]);
        break;
      }
    }
    this.addTerrain(hitbox, this.terrainFactory.statue([...req, ...extra]));
  }

  handleBoat(tile: TileId, location: Location, requirements: Requirement) {
    // board boat - this amounts to adding a route edge from the tile
    // to the left, through an exit, and then continuing until finding land.
    const t0 = this.walkableNeighbor(tile);
    if (t0 == null) throw new Error(`Could not find walkable neighbor.`);
    const yt = (tile >> 8) & 0xf0 | (tile >> 4) & 0xf;
    const xt = (tile >> 4) & 0xf0 | tile & 0xf;
    let boatExit;
    for (const exit of location.exits) {
      if (exit.yt === yt && exit.xt < xt) boatExit = exit;
    }
    if (!boatExit) throw new Error(`Could not find boat exit`);
    // TODO - look up the entrance.
    const dest = this.rom.locations[boatExit.dest];
    if (!dest) throw new Error(`Bad destination`);
    const entrance = dest.entrances[boatExit.entrance];
    const entranceTile = TileId.from(dest, entrance);
    let t = entranceTile;
    while (true) {
      t = TileId.add(t, 0, -1);
      const t1 = this.walkableNeighbor(tile);
      if (t1 != null) {
        const boat = new Terrain();
        boat.exit = () => requirements;
        this.addTerrain([t0], boat);
        this.exitSet.add(TilePair(t0, t1));
        return;
      }
    }
  }

  addItemGrantChecks(hitbox: Hitbox, req: Requirement, grantId: number) {
    const item = this.itemGrant(grantId);
    const slot = 0x100 | item;
    if (item == null) {
      throw new Error(`missing item grant for ${grantId.toString(16)}`);
    }
    // is the 100 flag sufficient here?  probably?
    const preventLoss = grantId >= 0x80; // granted from a trigger
    this.addItemCheck(hitbox, req, slot,
                      {lossy: true, unique: true, preventLoss});
  }

  addTerrain(hitbox: Hitbox, terrain: Terrain) {
    for (const tile of hitbox) {
      const t = this.terrains.get(tile);
      if (t == null) continue; // unreachable tiles don't need extra reqs
      this.terrains.set(tile, this.terrainFactory.meet(t, terrain));
    }
  }

  addCheck(hitbox: Hitbox, requirement: Requirement, checks: number[]) {
    if (Requirement.isClosed(requirement)) return; // do nothing if unreachable
    const check = {requirement: Requirement.freeze(requirement), checks};
    for (const tile of hitbox) {
      if (!this.terrains.has(tile)) continue;
      this.checks.get(tile).add(check);
    }
  }

  addItemCheck(hitbox: Hitbox, requirement: Requirement,
               check: number, slot: SlotInfo) {
    this.addCheck(hitbox, requirement, [check]);
    this.slots.set(check, slot);
  }

  addCheckFromFlags(hitbox: Hitbox, requirement: Requirement, flags: number[]) {
    const checks = [];
    for (const flag of flags) {
      const f = this.flag(flag);
      if (f?.logic.track) {
        checks.push(f.id);
      }
    }
    if (checks.length) this.addCheck(hitbox, requirement, checks);
  }

  walkableNeighbor(t: TileId): TileId|undefined {
    if (this.isWalkable(t)) return t;
    for (let d of [-1, 1]) {
      const t1 = TileId.add(t, d, 0);
      const t2 = TileId.add(t, 0, d);
      if (this.isWalkable(t1)) return t1;
      if (this.isWalkable(t2)) return t2;
    }
    return undefined;
  }

  isWalkable(t: TileId): boolean {
    return !(this.getEffects(t) & Terrain.BITS);
  }

  ensurePassable(t: TileId): TileId {
    return this.isWalkable(t) ? t : this.walkableNeighbor(t) ?? t;
  }

  getEffects(t: TileId): number {
    const location = this.rom.locations[t >>> 16];
    const page = location.screenPage;
    const effects = this.rom.tileEffects[location.tileEffects - 0xb3].effects;
    const scr = location.screens[(t & 0xf000) >>> 12][(t & 0xf00) >>> 8] | page;
    return effects[this.rom.screens[scr].tiles[t & 0xff]];
  }

  processBoss(location: Location, spawn: Spawn) {
    // Bosses will clobber the entrance portion of all tiles on the screen,
    // and will also add their drop.
    const isRage = spawn.id === 0xc3;
    const boss =
        isRage ? this.rom.bosses.Rage :
        this.rom.bosses.fromLocation(location.id);
    const tile = TileId.from(location, spawn);
    if (!boss.flag) throw new Error(`Bad boss at ${location.name}`);
    const screen = tile & ~0xff;
    // NOTE: Rage can be exited south... but this only matters if there's
    // anything other than Mesia's shrine behind him, which makes a lot of
    // logic more difficult, so likely this entrance will stay put forever.
    const bossTerrain = this.terrainFactory.boss(boss.flag.id);
    const hitbox = seq(0xf0, t => (screen | t) as TileId);
    this.addTerrain(hitbox, bossTerrain);
    this.addBossCheck(hitbox, boss)
  }

  addBossCheck(hitbox: Hitbox, boss: Boss,
               requirements: Requirements = Requirement.OPEN) {
    const req = Requirement.meet(requirements, this.bossRequirements(boss));
    this.addItemCheck(hitbox, req, boss.flag.id, {lossy: false, unique: true});
  }

  processChest(location: Location, spawn: Spawn) {
    // Add a check for the 1xx flag.  Make sure it's not a mimic.
    if (this.rom.slots[spawn.id] >= 0x70) return;
    const slot = 0x100 | spawn.id;
    const item = this.rom.items[spawn.id];
    const unique = this.flagset.preserveUniqueChecks() ? item.unique : true;
    this.addItemCheck([TileId.from(location, spawn)], Requirement.OPEN,
                      slot, {lossy: false, unique});
  }

  processMonster(_location: Location, _spawn: Spawn) {
        // TODO - compute money-dropping monster vulnerabilities and add a trigger
        // for the MONEY capability dependent on any of the swords.
    // const monster = rom.objects[spawn.monsterId];
    // if (monster.goldDrop) monsters.set(TileId.from(location, spawn), monster.elements);
  }

  processItemUse(hitbox: Hitbox, item: Item, use: ItemUse) {
    // this should handle most trade-ins automatically
    hitbox = new Set([...hitbox].map(t => this.walkableNeighbor(t) ?? t));
    const req = [[(0x200 | item.id) as Condition]]; // requires the item.
    // check for kirisa plant, add change as a requirement.
    if (item.id === this.rom.prg[0x3d4b5] + 0x1c) {
      req[0].push(this.rom.flags.Change.c);
    }
    // set any flags
    this.addCheckFromFlags(hitbox, req, use.flags);
    // handle any extra actions
    switch (use.message.action) {
    case 0x10:
      // use key
      this.processKeyUse(hitbox, req);
      break;
    case 0x08: case 0x0b: case 0x0c: case 0x0d: case 0x0e: case 0x0f:
      // find itemgrant for item ID => add check
      this.addItemGrantChecks(hitbox, req, item.id);
      break;
    }
  }

  processKeyUse(hitbox: Hitbox, req: Requirement) {
    // set the current screen's flag if the conditions are met...
    // make sure there's only a single screen.
    const [screen, ...rest] = new Set([...hitbox].map(t => ScreenId.from(t)));
    if (screen == null || rest.length) throw new Error(`Expected one screen`);
    const location = this.rom.locations[screen >>> 8];
    const flag = location.flags.find(f => f.screen === (screen & 0xff));
    if (flag == null) throw new Error(`Expected flag on screen`);
    this.addCheck(hitbox, req, [flag.flag]);
  }

  bossRequirements(boss: Boss): Requirement {
    // TODO - handle boss shuffle somehow?
    if (boss === this.rom.bosses.Rage) {
      // Special case for Rage.  Figure out what he wants from the dialog.
      const unknownSword = this.tracker && this.flagset.randomizeTrades();
      if (unknownSword) return this.rom.flags.Sword.r; // any sword might do.
      return [[this.rom.npcs.Rage.dialog()[0].condition as Condition]];
    }
    const id = boss.object;
    const r = new Requirement.Builder();
    if (this.tracker && this.flagset.shuffleBossElements() ||
        !this.flagset.guaranteeMatchingSword()) {
      r.addAll(this.rom.flags.Sword.id);
    } else {
      const level = this.flagset.guaranteeSwordMagic() ? boss.swordLevel : 1;
      const obj = this.rom.objects[id];
      for (let i = 0; i < 4; i++) {
        if (obj.isVulnerable(i)) r.addAll(this.swordRequirement(i, level));
      }
    }
    // Can't actually kill the boss if it doesn't spawn.
    const extra: Condition[] = [];
    if (boss.npc != null && boss.location != null) {
      const spawnCondition = boss.npc.spawns(this.rom.locations[boss.location]);
      extra.push(...this.filterRequirements(spawnCondition)[0]);
    }
    if (boss === this.rom.bosses.Insect) {
      extra.push(this.rom.flags.InsectFlute.c, this.rom.flags.GasMask.c);
    }
    if (this.flagset.guaranteeRefresh()) {
      extra.push(this.rom.flags.Refresh.c);
    }
    r.restrict([extra]);
    return r.freeze();
  }

  swordRequirement(element: number, level: number): Requirement {
    const sword = [
      this.rom.flags.SwordOfWind, this.rom.flags.SwordOfFire,
      this.rom.flags.SwordOfWater, this.rom.flags.SwordOfThunder,
    ][element];
    if (level === 1) return sword.r;
    const powers = [
      [this.rom.flags.OrbOfWind, this.rom.flags.TornadoBracelet],
      [this.rom.flags.OrbOfFire, this.rom.flags.FlameBracelet],
      [this.rom.flags.OrbOfWater, this.rom.flags.BlizzardBracelet],
      [this.rom.flags.OrbOfThunder, this.rom.flags.StormBracelet],
    ][element];
    if (level === 3) return and(sword, ...powers);
    return powers.map(power => [sword.c, power.c]);
  }

  itemGrant(id: number): number {
    for (let i = 0x3d6d5; this.rom.prg[i] !== 0xff; i += 2) {
      if (this.rom.prg[i] === id) return this.rom.prg[i + 1];
    }
    throw new Error(`Could not find item grant ${id.toString(16)}`);
  }

  /** Return a Requirement for all of the flags being met. */
  filterRequirements(flags: number[]): Requirement.Single {
    const conds = [];
    for (const flag of flags) {
      if (flag < 0) {
        const logic = this.flag(~flag)?.logic;
        if (logic?.assumeTrue) return Requirement.CLOSED;
      } else {
        const logic = this.flag(flag)?.logic;
        if (logic?.assumeFalse) return Requirement.CLOSED;
        if (logic?.track) conds.push(flag as Condition);
      }
    }
    return [conds];    
  }

  /** Return a Requirement for some flag not being met. */
  filterAntiRequirements(flags: number[]): Requirement.Frozen {
    const req = [];
    for (const flag of flags) {
      if (flag >= 0) {
        const logic = this.flag(~flag)?.logic;
        if (logic?.assumeFalse) return Requirement.OPEN;
      } else {
        const logic = this.flag(~flag)?.logic;
        if (logic?.assumeTrue) return Requirement.OPEN;
        if (logic?.track) req.push([~flag as Condition]);
      }
    }
    return req;
  }

  flag(flag: number): Flag|undefined {
    const f = this.rom.flags[~flag];
    return this.aliases.get(f) ?? f;
  }

  entrance(location: Location|number, index = 0): TileId {
    if (typeof location === 'number') location = this.rom.locations[location];
    return TileId.from(location, location.entrances[index]);
  }

  wallCapability(wall: WallType): number {
    switch (wall) {
    case WallType.WIND: return this.rom.flags.BreakStone.id;
    case WallType.FIRE: return this.rom.flags.BreakIce.id;
    case WallType.WATER: return this.rom.flags.FormBridge.id;
    case WallType.THUNDER: return this.rom.flags.BreakIron.id;
    default: throw new Error(`bad wall type: ${wall}`);
    }
  }
}

function and(...flags: Flag[]): Requirement.Single {
  return [flags.map((f: Flag) => f.id as Condition)];
}

function or(...flags: Flag[]): Requirement.Frozen {
  return flags.map((f: Flag) => [f.id as Condition]);
}

// An interesting way to track terrain combinations is with primes.
// If we have N elements we can label each atom with a prime and
// then label arbitrary combinations with the product.  For N=1000
// the highest number is 8000, so that it contributes about 13 bits
// to the product, meaning we can store combinations of 4 safely
// without resorting to bigint.  This is inherently order-independent.
// If the rarer ones are higher, we can fit significantly more than 4.
