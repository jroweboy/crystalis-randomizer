import { DefaultMap, iters } from '../util.js';
import { Requirement } from './requirement.js';
export class Terrains {
    constructor(rom) {
        this.rom = rom;
        this.tiles = new DefaultMap((effects) => makeTile(this.rom, effects));
        this.bosses = new DefaultMap((flag) => new BossTerrain(flag));
        this.statues = new Map();
        this.flags = new DefaultMap((base) => new DefaultMap((flag) => new DefaultMap((alt) => new FlagTerrain(base, flag, alt))));
        this.meets = new DefaultMap((left) => new DefaultMap((right) => new MeetTerrain(left, right)));
        this._seamless = new DefaultMap((t) => new SeamlessTerrain(t));
    }
    tile(effects) {
        return effects & 0x04 ? undefined : this.tiles.get(effects);
    }
    boss(flag) {
        return this.bosses.get(flag);
    }
    statue(req) {
        const label = Requirement.label(req);
        let terrain = this.statues.get(label);
        if (!terrain)
            this.statues.set(label, terrain = new StatueTerrain(req));
        return terrain;
    }
    flag(base, flag, alt) {
        if (!base)
            base = CLOSED;
        return this.flags.get(base).get(flag).get(alt);
    }
    meet(left, right) {
        return this.meets.get(left).get(right);
    }
    seamless(delegate) {
        return this._seamless.get(delegate);
    }
    label(terrain, rom) {
        if (terrain.label)
            return terrain.label(rom);
        return 'Terrain';
    }
}
export var Terrain;
(function (Terrain) {
    Terrain.FLY = 0x02;
    Terrain.BLOCKED = 0x04;
    Terrain.SLOPE = 0x20;
    Terrain.BITS = 0x26;
    Terrain.SWAMP = 0x100;
    Terrain.BARRIER = 0x200;
    Terrain.SLOPE8 = 0x400;
    Terrain.SLOPE9 = 0x800;
    Terrain.DOLPHIN = 0x1000;
    function label(t, rom) {
        var _a, _b;
        return (_b = (_a = t.label) === null || _a === void 0 ? void 0 : _a.call(t, rom)) !== null && _b !== void 0 ? _b : 'Terrain';
    }
    Terrain.label = label;
})(Terrain || (Terrain = {}));
class SeamlessTerrain {
    constructor(_delegate) {
        this._delegate = _delegate;
        this.enter = _delegate.enter;
        this.exit = _delegate.exit;
    }
    label(rom) {
        return `Seamless(${Terrain.label(this._delegate, rom)})`;
    }
}
class SimpleTerrain {
    constructor(enter, exit = Requirement.OPEN) {
        this.enter = enter;
        this.exit = [[0xf, exit]];
    }
    get kind() { return 'Simple'; }
    label(rom) {
        const terr = [];
        if (!Requirement.isOpen(this.enter)) {
            terr.push(`enter = ${debugLabel(this.enter, rom)}`);
        }
        if (!Requirement.isOpen(this.exit[0][1])) {
            terr.push(`exit = ${debugLabel(this.exit[0][1], rom)}`);
        }
        return `${this.kind}(${terr.join(', ')})`;
    }
}
class SouthTerrain {
    constructor(enter, exit) {
        this.enter = enter;
        this.exit =
            exit ?
                [[0xb, exit], [0x4, Requirement.OPEN]] :
                [[0xf, Requirement.OPEN]];
    }
    get kind() { return 'South'; }
    label(rom) {
        if (this.exit.length === 1) {
            return SimpleTerrain.prototype.label.call(this, rom);
        }
        const terr = [];
        if (!Requirement.isOpen(this.enter)) {
            terr.push(`enter = ${debugLabel(this.enter, rom)}`);
        }
        if (!Requirement.isOpen(this.exit[0][1])) {
            terr.push(`other = ${debugLabel(this.exit[0][1], rom)}`);
        }
        if (!Requirement.isOpen(this.exit[1][1])) {
            terr.push(`south = ${debugLabel(this.exit[1][1], rom)}`);
        }
        return `${this.kind}(${terr.join(', ')})`;
    }
}
function makeTile(rom, effects) {
    let enter = Requirement.OPEN;
    let exit = undefined;
    if ((effects & Terrain.DOLPHIN) && (effects & Terrain.FLY)) {
        if (effects & Terrain.SLOPE) {
            exit = rom.flags.ClimbWaterfall.r;
        }
        enter = [[rom.flags.CurrentlyRidingDolphin.c], [rom.flags.Flight.c]];
    }
    else {
        if (effects & Terrain.SLOPE9) {
            exit = rom.flags.ClimbSlope9.r;
        }
        else if (effects & Terrain.SLOPE8) {
            exit = rom.flags.ClimbSlope8.r;
        }
        else if (effects & Terrain.SLOPE) {
            exit = rom.flags.Flight.r;
        }
        if (effects & Terrain.FLY)
            enter = rom.flags.Flight.r;
    }
    if (effects & Terrain.SWAMP) {
        enter = enter.map((cs) => [rom.flags.TravelSwamp.c, ...cs]);
    }
    if (effects & Terrain.BARRIER) {
        enter = enter.map((cs) => [rom.flags.ShootingStatue.c, ...cs]);
    }
    return new SouthTerrain(enter, exit);
}
class BossTerrain extends SimpleTerrain {
    constructor(_flag) {
        super(Requirement.OPEN, [[_flag]]);
        this._flag = _flag;
    }
    get kind() { return 'Boss'; }
}
class StatueTerrain extends SouthTerrain {
    constructor(_req) {
        super(Requirement.OPEN, _req);
        this._req = _req;
    }
    get kind() { return 'Statue'; }
}
class FlagTerrain extends SimpleTerrain {
    constructor(base, flag, alt) {
        if (base.exit.length !== 1 || alt.exit.length !== 1) {
            throw new Error('bad flag');
        }
        const f = [[flag]];
        const enter = flag >= 0 ? Requirement.meet(alt.enter, f) : alt.enter;
        const exit = flag >= 0 ? Requirement.meet(alt.exit[0][1], f) : alt.exit[0][1];
        super(Requirement.or(base.enter, enter), Requirement.or(base.exit[0][1], exit));
    }
    get kind() { return 'Flag'; }
}
const CLOSED = new SimpleTerrain(Requirement.CLOSED, Requirement.CLOSED);
function directionIndex(t) {
    const ind = [];
    for (let i = 0; i < t.exit.length; i++) {
        for (let b = 0; b < 4; b++) {
            if (t.exit[i][0] & (1 << b))
                ind[b] = i;
        }
    }
    for (let b = 0; b < 4; b++) {
        if (ind[b] == null) {
            throw new Error(`Bad terrain: ${t.exit.map(e => e[0]).join(',')}`);
        }
    }
    return ind;
}
class MeetTerrain {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        const leftInd = directionIndex(left);
        const rightInd = directionIndex(right);
        const sources = new Set();
        const exit = [];
        for (let i = 0; i < 4; i++) {
            sources.add(leftInd[i] << 2 | rightInd[i]);
        }
        for (const source of sources) {
            const [d0, r0] = left.exit[source >> 2];
            const [d1, r1] = right.exit[source & 3];
            exit.push([d0 & d1, Requirement.meet(r0, r1)]);
        }
        this.enter = Requirement.meet(left.enter, right.enter);
        this.exit = exit;
    }
    get kind() { return 'Terrain'; }
    label(rom) {
        if (this.exit.length === 1) {
            return SimpleTerrain.prototype.label.call(this, rom);
        }
        const terr = [];
        if (!Requirement.isOpen(this.enter)) {
            terr.push(`enter = ${debugLabel(this.enter, rom)}`);
        }
        for (const [dirs, req] of this.exit) {
            const dirstring = [dirs & 1 ? 'N' : '', dirs & 2 ? 'W' : '',
                dirs & 4 ? 'S' : '', dirs & 8 ? 'E' : ''].join('');
            terr.push(`exit${dirstring} = ${debugLabel(req, rom)}`);
        }
        return `${this.kind}(${terr.join(', ')})`;
    }
}
export function debugLabel(r, rom) {
    const css = [...r];
    const s = css.map(cs => iters.isEmpty(cs) ? 'open' :
        [...cs].map((c) => { var _a; return (_a = rom.flags[c]) === null || _a === void 0 ? void 0 : _a.debug; }).join(' & '))
        .join(') | (');
    return css.length > 1 ? `(${s})` : css.length ? s : 'never';
}
Terrain.debugLabel = debugLabel;
if (typeof window === 'object')
    window.debugLabel = debugLabel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9qcy9sb2dpYy90ZXJyYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzdDLE9BQU8sRUFBWSxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxNQUFNLE9BQU8sUUFBUTtJQXNCbkIsWUFBcUIsR0FBUTtRQUFSLFFBQUcsR0FBSCxHQUFHLENBQUs7UUFsQlosVUFBSyxHQUNsQixJQUFJLFVBQVUsQ0FDVixDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN6QyxXQUFNLEdBQ25CLElBQUksVUFBVSxDQUFrQixDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1RCxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7UUFDckMsVUFBSyxHQUNsQixJQUFJLFVBQVUsQ0FDVixDQUFDLElBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQzdCLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFVBQVUsQ0FDNUIsQ0FBQyxHQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsVUFBSyxHQUNsQixJQUFJLFVBQVUsQ0FDVixDQUFDLElBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQzdCLENBQUMsS0FBYyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlDLGNBQVMsR0FDdEIsSUFBSSxVQUFVLENBQW1CLENB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QUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsMENBQUUsS0FBSyxHQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25CLE9BQU8sR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQzlELENBQUM7QUFFQSxPQUFlLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUN6QyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVE7SUFBRyxNQUFjLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Um9tfSBmcm9tICcuLi9yb20uanMnO1xuaW1wb3J0IHtEZWZhdWx0TWFwLCBpdGVyc30gZnJvbSAnLi4vdXRpbC5qcyc7XG5pbXBvcnQge0NvbmRpdGlvbiwgUmVxdWlyZW1lbnR9IGZyb20gJy4vcmVxdWlyZW1lbnQuanMnO1xuXG5leHBvcnQgY2xhc3MgVGVycmFpbnMge1xuXG4gIC8vIEFnZ3Jlc3NpdmUgbWVtb2l6YXRpb24gcHJldmVudHMgaW5zdGFudGlhdGluZyB0aGUgc2FtZSB0ZXJyYWluIHR3aWNlLlxuICAvLyBUaGlzIGFsbG93cyByZWZlcmVuY2UgZXF1YWxpdHkgdG8gdGVsbCB3aGVuIHR3byB0ZXJyYWlucyBhcmUgdGhlIHNhbWUuXG4gIHByaXZhdGUgcmVhZG9ubHkgdGlsZXMgPVxuICAgICAgbmV3IERlZmF1bHRNYXA8bnVtYmVyLCBUZXJyYWluPihcbiAgICAgICAgICAoZWZmZWN0czogbnVtYmVyKSA9PiBtYWtlVGlsZSh0aGlzLnJvbSwgZWZmZWN0cykpO1xuICBwcml2YXRlIHJlYWRvbmx5IGJvc3NlcyA9XG4gICAgICBuZXcgRGVmYXVsdE1hcDxudW1iZXIsIFRlcnJhaW4+KChmbGFnOiBudW1iZXIpID0+IG5ldyBCb3NzVGVycmFpbihmbGFnKSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhdHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBUZXJyYWluPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IGZsYWdzID1cbiAgICAgIG5ldyBEZWZhdWx0TWFwPFRlcnJhaW4sIERlZmF1bHRNYXA8bnVtYmVyLCBEZWZhdWx0TWFwPFRlcnJhaW4sIFRlcnJhaW4+Pj4oXG4gICAgICAgICAgKGJhc2U6IFRlcnJhaW4pID0+IG5ldyBEZWZhdWx0TWFwKFxuICAgICAgICAgICAgICAoZmxhZzogbnVtYmVyKSA9PiBuZXcgRGVmYXVsdE1hcChcbiAgICAgICAgICAgICAgICAgIChhbHQ6IFRlcnJhaW4pID0+IG5ldyBGbGFnVGVycmFpbihiYXNlLCBmbGFnLCBhbHQpKSkpO1xuICBwcml2YXRlIHJlYWRvbmx5IG1lZXRzID1cbiAgICAgIG5ldyBEZWZhdWx0TWFwPFRlcnJhaW4sIERlZmF1bHRNYXA8VGVycmFpbiwgVGVycmFpbj4+KFxuICAgICAgICAgIChsZWZ0OiBUZXJyYWluKSA9PiBuZXcgRGVmYXVsdE1hcChcbiAgICAgICAgICAgICAgKHJpZ2h0OiBUZXJyYWluKSA9PiBuZXcgTWVldFRlcnJhaW4obGVmdCwgcmlnaHQpKSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3NlYW1sZXNzID1cbiAgICAgIG5ldyBEZWZhdWx0TWFwPFRlcnJhaW4sIFRlcnJhaW4+KCh0OiBUZXJyYWluKSA9PiBuZXcgU2VhbWxlc3NUZXJyYWluKHQpKTtcblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSByb206IFJvbSkge31cblxuICB0aWxlKGVmZmVjdHM6IG51bWJlcik6IFRlcnJhaW58dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gZWZmZWN0cyAmIDB4MDQgPyB1bmRlZmluZWQgOiB0aGlzLnRpbGVzLmdldChlZmZlY3RzKTtcbiAgfVxuXG4gIGJvc3MoZmxhZzogbnVtYmVyKTogVGVycmFpbiB7XG4gICAgcmV0dXJuIHRoaXMuYm9zc2VzLmdldChmbGFnKTtcbiAgfVxuXG4gIC8vIE5PVEU6IGFsc28gdXNlZCBmb3IgdHJpZ2dlcnNcbiAgc3RhdHVlKHJlcTogUmVxdWlyZW1lbnQuRnJvemVuKTogVGVycmFpbiB7XG4gICAgY29uc3QgbGFiZWwgPSBSZXF1aXJlbWVudC5sYWJlbChyZXEpO1xuICAgIGxldCB0ZXJyYWluID0gdGhpcy5zdGF0dWVzLmdldChsYWJlbCk7XG4gICAgaWYgKCF0ZXJyYWluKSB0aGlzLnN0YXR1ZXMuc2V0KGxhYmVsLCB0ZXJyYWluID0gbmV3IFN0YXR1ZVRlcnJhaW4ocmVxKSk7XG4gICAgcmV0dXJuIHRlcnJhaW4hO1xuICB9XG5cbiAgZmxhZyhiYXNlOiBUZXJyYWlufHVuZGVmaW5lZCwgZmxhZzogbnVtYmVyLCBhbHQ6IFRlcnJhaW4pOiBUZXJyYWluIHtcbiAgICBpZiAoIWJhc2UpIGJhc2UgPSBDTE9TRUQ7XG4gICAgcmV0dXJuIHRoaXMuZmxhZ3MuZ2V0KGJhc2UpLmdldChmbGFnKS5nZXQoYWx0KTtcbiAgfVxuXG4gIG1lZXQobGVmdDogVGVycmFpbiwgcmlnaHQ6IFRlcnJhaW4pOiBUZXJyYWluIHtcbiAgICAvLyBUT0RPIC0gbWVtb2l6ZSBwcm9wZXJseT8gIG9ubHkgYWxsb3cgdHdvP1xuICAgIHJldHVybiB0aGlzLm1lZXRzLmdldChsZWZ0KS5nZXQocmlnaHQpO1xuICB9XG5cbiAgc2VhbWxlc3MoZGVsZWdhdGU6IFRlcnJhaW4pIHtcbiAgICByZXR1cm4gdGhpcy5fc2VhbWxlc3MuZ2V0KGRlbGVnYXRlKTtcbiAgfVxuXG4gIGxhYmVsKHRlcnJhaW46IFRlcnJhaW4sIHJvbTogUm9tKSB7XG4gICAgaWYgKHRlcnJhaW4ubGFiZWwpIHJldHVybiB0ZXJyYWluLmxhYmVsKHJvbSk7XG4gICAgcmV0dXJuICdUZXJyYWluJztcbiAgfVxufVxuXG50eXBlIERpck1hc2sgPSBudW1iZXI7XG4vLyBOT1RFOiBtaXNzaW5nIGRpcmVjdGlvbnMgYXJlIGZvcmJpZGRlbi5cbnR5cGUgRXhpdFJlcXVpcmVtZW50cyA9IFJlYWRvbmx5QXJyYXk8cmVhZG9ubHkgW0Rpck1hc2ssIFJlcXVpcmVtZW50LkZyb3plbl0+O1xuZXhwb3J0IGludGVyZmFjZSBUZXJyYWluIHtcbiAgZW50ZXI6IFJlcXVpcmVtZW50LkZyb3plbjtcbiAgZXhpdDogRXhpdFJlcXVpcmVtZW50cztcbiAgbGFiZWw/OiAocm9tOiBSb20pID0+IHN0cmluZztcbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBUZXJyYWluIHtcbiAgLy8gQnVpbHQtaW4gdGVycmFpbiBiaXRzXG4gIC8vIDB4MDEgPT4gcGl0XG4gIGV4cG9ydCBjb25zdCBGTFkgPSAweDAyO1xuICBleHBvcnQgY29uc3QgQkxPQ0tFRCA9IDB4MDQ7XG4gIC8vIDB4MDggPT4gZmxhZyBhbHRlcm5hdGVcbiAgLy8gMHgxMCA9PiBiZWhpbmRcbiAgZXhwb3J0IGNvbnN0IFNMT1BFID0gMHgyMDtcbiAgLy8gMHg0MCA9PiBzbG93XG4gIC8vIDB4ODAgPT4gcGFpblxuICBleHBvcnQgY29uc3QgQklUUyA9IDB4MjY7XG5cbiAgLy8gQ3VzdG9tIHRlcnJhaW4gYml0c1xuICBleHBvcnQgY29uc3QgU1dBTVAgPSAweDEwMDtcbiAgZXhwb3J0IGNvbnN0IEJBUlJJRVIgPSAweDIwMDsgLy8gc2hvb3Rpbmcgc3RhdHVlc1xuICAvLyBzbG9wZSAwLi41ID0+IG5vIHJlcXVpcmVtZW50c1xuICBleHBvcnQgY29uc3QgU0xPUEU4ID0gMHg0MDA7IC8vIHNsb3BlIDYuLjhcbiAgZXhwb3J0IGNvbnN0IFNMT1BFOSA9IDB4ODAwOyAvLyBzbG9wdCA5XG4gIC8vIHNsb3BlIDEwKyA9PiBmbGlnaHQgb25seVxuICBleHBvcnQgY29uc3QgRE9MUEhJTiA9IDB4MTAwMDtcblxuICBleHBvcnQgZnVuY3Rpb24gbGFiZWwodDogVGVycmFpbiwgcm9tOiBSb20pIHtcbiAgICByZXR1cm4gdC5sYWJlbD8uKHJvbSkgPz8gJ1RlcnJhaW4nO1xuICB9XG59XG5cbmNsYXNzIFNlYW1sZXNzVGVycmFpbiBpbXBsZW1lbnRzIFRlcnJhaW4ge1xuICByZWFkb25seSBlbnRlcjogUmVxdWlyZW1lbnQuRnJvemVuO1xuICByZWFkb25seSBleGl0OiBFeGl0UmVxdWlyZW1lbnRzO1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBfZGVsZWdhdGU6IFRlcnJhaW4pIHtcbiAgICB0aGlzLmVudGVyID0gX2RlbGVnYXRlLmVudGVyO1xuICAgIHRoaXMuZXhpdCA9IF9kZWxlZ2F0ZS5leGl0O1xuICB9XG5cbiAgbGFiZWwocm9tOiBSb20pIHtcbiAgICByZXR1cm4gYFNlYW1sZXNzKCR7VGVycmFpbi5sYWJlbCh0aGlzLl9kZWxlZ2F0ZSwgcm9tKX0pYDtcbiAgfVxufVxuXG4vLyBCYXNpYyB0ZXJyYWluIHdpdGggYW4gZW50cmFuY2UgYW5kL29yIHVuZGlyZWN0ZWQgZXhpdCBjb25kaXRpb25cbmNsYXNzIFNpbXBsZVRlcnJhaW4gaW1wbGVtZW50cyBUZXJyYWluIHtcbiAgcmVhZG9ubHkgZXhpdDogRXhpdFJlcXVpcmVtZW50cztcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgZW50ZXI6IFJlcXVpcmVtZW50LkZyb3plbixcbiAgICAgICAgICAgICAgZXhpdDogUmVxdWlyZW1lbnQuRnJvemVuID0gUmVxdWlyZW1lbnQuT1BFTikge1xuICAgIHRoaXMuZXhpdCA9IFtbMHhmLCBleGl0XV07XG4gIH1cblxuICBnZXQga2luZCgpIHsgcmV0dXJuICdTaW1wbGUnOyB9XG5cbiAgbGFiZWwocm9tOiBSb20pIHtcbiAgICBjb25zdCB0ZXJyID0gW107XG4gICAgaWYgKCFSZXF1aXJlbWVudC5pc09wZW4odGhpcy5lbnRlcikpIHtcbiAgICAgIHRlcnIucHVzaChgZW50ZXIgPSAke2RlYnVnTGFiZWwodGhpcy5lbnRlciwgcm9tKX1gKTtcbiAgICB9XG4gICAgaWYgKCFSZXF1aXJlbWVudC5pc09wZW4odGhpcy5leGl0WzBdWzFdKSkge1xuICAgICAgdGVyci5wdXNoKGBleGl0ID0gJHtkZWJ1Z0xhYmVsKHRoaXMuZXhpdFswXVsxXSwgcm9tKX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGAke3RoaXMua2luZH0oJHt0ZXJyLmpvaW4oJywgJyl9KWA7XG4gIH1cbn1cblxuLy8gQmFzaWMgdGVycmFpbiB3aXRoIGFuIGVudHJhbmNlIGFuZC9vciBub24tc291dGggZXhpdCBjb25kaXRpb25cbmNsYXNzIFNvdXRoVGVycmFpbiBpbXBsZW1lbnRzIFRlcnJhaW4ge1xuICByZWFkb25seSBleGl0OiBFeGl0UmVxdWlyZW1lbnRzO1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBlbnRlcjogUmVxdWlyZW1lbnQuRnJvemVuLCBleGl0PzogUmVxdWlyZW1lbnQuRnJvemVuKSB7XG4gICAgdGhpcy5leGl0ID1cbiAgICAgICAgZXhpdCA/XG4gICAgICAgICAgICBbWzB4YiwgZXhpdF0sIFsweDQsIFJlcXVpcmVtZW50Lk9QRU5dXSA6XG4gICAgICAgICAgICBbWzB4ZiwgUmVxdWlyZW1lbnQuT1BFTl1dO1xuICB9XG5cbiAgZ2V0IGtpbmQoKSB7IHJldHVybiAnU291dGgnOyB9XG5cbiAgbGFiZWwocm9tOiBSb20pIHtcbiAgICBpZiAodGhpcy5leGl0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIFNpbXBsZVRlcnJhaW4ucHJvdG90eXBlLmxhYmVsLmNhbGwodGhpcyBhcyBhbnksIHJvbSk7XG4gICAgfVxuICAgIGNvbnN0IHRlcnIgPSBbXTtcbiAgICBpZiAoIVJlcXVpcmVtZW50LmlzT3Blbih0aGlzLmVudGVyKSkge1xuICAgICAgdGVyci5wdXNoKGBlbnRlciA9ICR7ZGVidWdMYWJlbCh0aGlzLmVudGVyLCByb20pfWApO1xuICAgIH1cbiAgICBpZiAoIVJlcXVpcmVtZW50LmlzT3Blbih0aGlzLmV4aXRbMF1bMV0pKSB7XG4gICAgICB0ZXJyLnB1c2goYG90aGVyID0gJHtkZWJ1Z0xhYmVsKHRoaXMuZXhpdFswXVsxXSwgcm9tKX1gKTtcbiAgICB9XG4gICAgaWYgKCFSZXF1aXJlbWVudC5pc09wZW4odGhpcy5leGl0WzFdWzFdKSkge1xuICAgICAgdGVyci5wdXNoKGBzb3V0aCA9ICR7ZGVidWdMYWJlbCh0aGlzLmV4aXRbMV1bMV0sIHJvbSl9YCk7XG4gICAgfVxuICAgIHJldHVybiBgJHt0aGlzLmtpbmR9KCR7dGVyci5qb2luKCcsICcpfSlgO1xuICB9XG59XG5cbi8vIE1ha2UgYSB0ZXJyYWluIGZyb20gYSB0aWxlZWZmZWN0cyB2YWx1ZSwgYXVnbWVudGVkIHdpdGggYSBmZXcgZGV0YWlscy5cbmZ1bmN0aW9uIG1ha2VUaWxlKHJvbTogUm9tLCBlZmZlY3RzOiBudW1iZXIpOiBUZXJyYWluIHtcbiAgbGV0IGVudGVyID0gUmVxdWlyZW1lbnQuT1BFTjtcbiAgbGV0IGV4aXQgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKChlZmZlY3RzICYgVGVycmFpbi5ET0xQSElOKSAmJiAoZWZmZWN0cyAmIFRlcnJhaW4uRkxZKSkge1xuICAgIGlmIChlZmZlY3RzICYgVGVycmFpbi5TTE9QRSkge1xuICAgICAgZXhpdCA9IHJvbS5mbGFncy5DbGltYldhdGVyZmFsbC5yO1xuICAgIH1cbiAgICBlbnRlciA9IFtbcm9tLmZsYWdzLkN1cnJlbnRseVJpZGluZ0RvbHBoaW4uY10sIFtyb20uZmxhZ3MuRmxpZ2h0LmNdXTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoZWZmZWN0cyAmIFRlcnJhaW4uU0xPUEU5KSB7XG4gICAgICBleGl0ID0gcm9tLmZsYWdzLkNsaW1iU2xvcGU5LnI7XG4gICAgfSBlbHNlIGlmIChlZmZlY3RzICYgVGVycmFpbi5TTE9QRTgpIHtcbiAgICAgIGV4aXQgPSByb20uZmxhZ3MuQ2xpbWJTbG9wZTgucjtcbiAgICB9IGVsc2UgaWYgKGVmZmVjdHMgJiBUZXJyYWluLlNMT1BFKSB7XG4gICAgICBleGl0ID0gcm9tLmZsYWdzLkZsaWdodC5yO1xuICAgIH1cbiAgICBpZiAoZWZmZWN0cyAmIFRlcnJhaW4uRkxZKSBlbnRlciA9IHJvbS5mbGFncy5GbGlnaHQucjtcbiAgfVxuICBpZiAoZWZmZWN0cyAmIFRlcnJhaW4uU1dBTVApIHsgLy8gc3dhbXBcbiAgICBlbnRlciA9IGVudGVyLm1hcChcbiAgICAgICAgKGNzOiByZWFkb25seSBDb25kaXRpb25bXSkgPT4gW3JvbS5mbGFncy5UcmF2ZWxTd2FtcC5jLCAuLi5jc10pO1xuICB9XG4gIGlmIChlZmZlY3RzICYgVGVycmFpbi5CQVJSSUVSKSB7IC8vIHNob290aW5nIHN0YXR1ZXNcbiAgICBlbnRlciA9IGVudGVyLm1hcChcbiAgICAgICAgKGNzOiByZWFkb25seSBDb25kaXRpb25bXSkgPT4gW3JvbS5mbGFncy5TaG9vdGluZ1N0YXR1ZS5jLCAuLi5jc10pO1xuICB9XG4gIHJldHVybiBuZXcgU291dGhUZXJyYWluKGVudGVyLCBleGl0KTtcbn1cblxuY2xhc3MgQm9zc1RlcnJhaW4gZXh0ZW5kcyBTaW1wbGVUZXJyYWluIHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgX2ZsYWc6IG51bWJlcikge1xuICAgIHN1cGVyKFJlcXVpcmVtZW50Lk9QRU4sIFtbX2ZsYWcgYXMgQ29uZGl0aW9uXV0pO1xuICB9XG5cbiAgZ2V0IGtpbmQoKSB7IHJldHVybiAnQm9zcyc7IH1cbn1cblxuY2xhc3MgU3RhdHVlVGVycmFpbiBleHRlbmRzIFNvdXRoVGVycmFpbiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IF9yZXE6IFJlcXVpcmVtZW50LkZyb3plbikge1xuICAgIHN1cGVyKFJlcXVpcmVtZW50Lk9QRU4sIF9yZXEpO1xuICB9XG5cbiAgZ2V0IGtpbmQoKSB7IHJldHVybiAnU3RhdHVlJzsgfVxufVxuXG5jbGFzcyBGbGFnVGVycmFpbiBleHRlbmRzIFNpbXBsZVRlcnJhaW4ge1xuICBjb25zdHJ1Y3RvcihiYXNlOiBUZXJyYWluLCBmbGFnOiBudW1iZXIsIGFsdDogVGVycmFpbikge1xuICAgIC8vIE5PVEU6IGJhc2UgYW5kIGFsdCBtdXN0IGJvdGggYmUgc2ltcGxlIHRlcnJhaW5zIVxuICAgIC8vIElmIGZsYWcgaXMgLTEgdGhlbiBkb24ndCBjb25zaWRlciBpdCAoaXQncyB1bnRyYWNrZWQpLlxuICAgIGlmIChiYXNlLmV4aXQubGVuZ3RoICE9PSAxIHx8IGFsdC5leGl0Lmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdiYWQgZmxhZycpO1xuICAgIH1cbiAgICBjb25zdCBmID0gW1tmbGFnIGFzIENvbmRpdGlvbl1dO1xuICAgIGNvbnN0IGVudGVyID0gZmxhZyA+PSAwID8gUmVxdWlyZW1lbnQubWVldChhbHQuZW50ZXIsIGYpIDogYWx0LmVudGVyO1xuICAgIGNvbnN0IGV4aXQgPVxuICAgICAgICBmbGFnID49IDAgPyBSZXF1aXJlbWVudC5tZWV0KGFsdC5leGl0WzBdWzFdLCBmKSA6IGFsdC5leGl0WzBdWzFdO1xuICAgIHN1cGVyKFJlcXVpcmVtZW50Lm9yKGJhc2UuZW50ZXIsIGVudGVyKSxcbiAgICAgICAgICBSZXF1aXJlbWVudC5vcihiYXNlLmV4aXRbMF1bMV0sIGV4aXQpKTtcbiAgfVxuXG4gIGdldCBraW5kKCkgeyByZXR1cm4gJ0ZsYWcnOyB9XG59XG5jb25zdCBDTE9TRUQgPSBuZXcgU2ltcGxlVGVycmFpbihSZXF1aXJlbWVudC5DTE9TRUQsIFJlcXVpcmVtZW50LkNMT1NFRCk7XG5cbi8qKiBSZXR1cm5zIGEgbWFwIGZyb20gRGlyIHRvIGluZGV4IGluIHRoZSBleGl0IG1hcC4gKi9cbmZ1bmN0aW9uIGRpcmVjdGlvbkluZGV4KHQ6IFRlcnJhaW4pOiBudW1iZXJbXSB7XG4gIGNvbnN0IGluZDogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0LmV4aXQubGVuZ3RoOyBpKyspIHtcbiAgICBmb3IgKGxldCBiID0gMDsgYiA8IDQ7IGIrKykge1xuICAgICAgaWYgKHQuZXhpdFtpXVswXSAmICgxIDw8IGIpKSBpbmRbYl0gPSBpO1xuICAgIH1cbiAgfVxuICBmb3IgKGxldCBiID0gMDsgYiA8IDQ7IGIrKykgeyAvLyBzYW5pdHkgY2hlY2tcbiAgICBpZiAoaW5kW2JdID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQmFkIHRlcnJhaW46ICR7dC5leGl0Lm1hcChlID0+IGVbMF0pLmpvaW4oJywnKX1gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZDtcbn1cblxuY2xhc3MgTWVldFRlcnJhaW4gaW1wbGVtZW50cyBUZXJyYWluIHtcbiAgcmVhZG9ubHkgZW50ZXI6IFJlcXVpcmVtZW50LkZyb3plbjtcbiAgcmVhZG9ubHkgZXhpdDogRXhpdFJlcXVpcmVtZW50cztcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgbGVmdDogVGVycmFpbiwgcmVhZG9ubHkgcmlnaHQ6IFRlcnJhaW4pIHtcbiAgICAvLyBUaGlzIGlzIHRyaWNreTogd2UgbmVlZCB0byBmaWd1cmUgb3V0IHdoaWNoIGV4aXRzIGFyZSBpbiBjb21tb24gYW5kXG4gICAgLy8gbm90IHJlcGVhdCB3b3JrLiAgU28gYnVpbGQgdXAgYSByZXZlcnNlIG1hcCBvZiBkaXJlY3Rpb24tdG8taW5kZXgsXG4gICAgLy8gdGhlbiBrZWVwIHRyYWNrIG9mIGFsbCB0aGUgdW5pcXVlIGNvbWJpbmF0aW9ucy5cbiAgICBjb25zdCBsZWZ0SW5kID0gZGlyZWN0aW9uSW5kZXgobGVmdCk7XG4gICAgY29uc3QgcmlnaHRJbmQgPSBkaXJlY3Rpb25JbmRleChyaWdodCk7XG4gICAgY29uc3Qgc291cmNlcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICAgIGNvbnN0IGV4aXQ6IEFycmF5PHJlYWRvbmx5IFtudW1iZXIsIFJlcXVpcmVtZW50LkZyb3plbl0+ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgIHNvdXJjZXMuYWRkKGxlZnRJbmRbaV0gPDwgMiB8IHJpZ2h0SW5kW2ldKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2Ygc291cmNlcykge1xuICAgICAgY29uc3QgW2QwLCByMF0gPSBsZWZ0LmV4aXRbc291cmNlID4+IDJdO1xuICAgICAgY29uc3QgW2QxLCByMV0gPSByaWdodC5leGl0W3NvdXJjZSAmIDNdO1xuICAgICAgZXhpdC5wdXNoKFtkMCAmIGQxLCBSZXF1aXJlbWVudC5tZWV0KHIwLCByMSldKTtcbiAgICB9XG4gICAgdGhpcy5lbnRlciA9IFJlcXVpcmVtZW50Lm1lZXQobGVmdC5lbnRlciwgcmlnaHQuZW50ZXIpO1xuICAgIHRoaXMuZXhpdCA9IGV4aXQ7XG4gIH1cblxuICBnZXQga2luZCgpIHsgcmV0dXJuICdUZXJyYWluJzsgfVxuXG4gIGxhYmVsKHJvbTogUm9tKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5leGl0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIFNpbXBsZVRlcnJhaW4ucHJvdG90eXBlLmxhYmVsLmNhbGwodGhpcyBhcyBhbnksIHJvbSk7XG4gICAgfVxuICAgIGNvbnN0IHRlcnIgPSBbXTtcbiAgICBpZiAoIVJlcXVpcmVtZW50LmlzT3Blbih0aGlzLmVudGVyKSkge1xuICAgICAgdGVyci5wdXNoKGBlbnRlciA9ICR7ZGVidWdMYWJlbCh0aGlzLmVudGVyLCByb20pfWApO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtkaXJzLCByZXFdIG9mIHRoaXMuZXhpdCkge1xuICAgICAgY29uc3QgZGlyc3RyaW5nID0gW2RpcnMgJiAxID8gJ04nIDogJycsIGRpcnMgJiAyID8gJ1cnIDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGlycyAmIDQgPyAnUycgOiAnJywgZGlycyAmIDggPyAnRScgOiAnJ10uam9pbignJyk7XG4gICAgICB0ZXJyLnB1c2goYGV4aXQke2RpcnN0cmluZ30gPSAke2RlYnVnTGFiZWwocmVxLCByb20pfWApO1xuICAgIH1cbiAgICByZXR1cm4gYCR7dGhpcy5raW5kfSgke3RlcnIuam9pbignLCAnKX0pYDtcbiAgfVxufVxuXG4vLyBOT1RFOiB0aGlzIGtpbmQgb2Ygd2FudHMgdG8gYmUgaW4gUmVxdWlyZW1lbnQsIGJ1dCBpdCdzIHJvbS1zcGVjaWZpYy4uLlxuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnTGFiZWwocjogUmVxdWlyZW1lbnQsIHJvbTogUm9tKTogc3RyaW5nIHtcbiAgY29uc3QgY3NzID0gWy4uLnJdO1xuICBjb25zdCBzID0gY3NzLm1hcChjcyA9PiBpdGVycy5pc0VtcHR5KGNzKSA/ICdvcGVuJyA6XG4gICAgICAgICAgICAgICAgICAgIFsuLi5jc10ubWFwKFxuICAgICAgICAgICAgICAgICAgICAgICAgKGM6IENvbmRpdGlvbikgPT4gcm9tLmZsYWdzW2NdPy5kZWJ1Zykuam9pbignICYgJykpXG4gICAgICAuam9pbignKSB8ICgnKTtcbiAgcmV0dXJuIGNzcy5sZW5ndGggPiAxID8gYCgke3N9KWAgOiBjc3MubGVuZ3RoID8gcyA6ICduZXZlcic7XG59XG5cbihUZXJyYWluIGFzIGFueSkuZGVidWdMYWJlbCA9IGRlYnVnTGFiZWw7XG5pZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpICh3aW5kb3cgYXMgYW55KS5kZWJ1Z0xhYmVsID0gZGVidWdMYWJlbDtcbiJdfQ==