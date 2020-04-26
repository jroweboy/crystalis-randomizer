import { featureMask } from './metascreendata.js';
import { DefaultMap } from '../util.js';
export class Metascreen {
    constructor(rom, uid, data) {
        var _a, _b, _c;
        this.rom = rom;
        this.uid = uid;
        this.data = data;
        this._tilesets = new Set();
        this.used = false;
        this.neighbors = [
            new DefaultMap((s) => this._checkNeighbor(s, 0)),
            new DefaultMap((s) => this._checkNeighbor(s, 1)),
        ];
        for (const tileset of Object.values(data.tilesets)) {
            if (!tileset.requires)
                this.used = true;
        }
        let features = 0;
        for (const feature of (_a = data.feature) !== null && _a !== void 0 ? _a : []) {
            const mask = featureMask[feature];
            if (mask != null)
                features |= mask;
        }
        for (const exit of (_b = data.exits) !== null && _b !== void 0 ? _b : []) {
            if (exit.type === 'stair:down' || exit.type === 'stair:up') {
                features |= featureMask[exit.type];
            }
        }
        this._features = features;
        this._isEmpty = Boolean(features & featureMask.empty);
        this.flag = data.flag;
        const cxn = [[[]], [[]], [[]], [[]]];
        this.connections = cxn;
        for (let i = 0; i < 4; i++) {
            for (const term of (_c = this.data.connect) !== null && _c !== void 0 ? _c : '') {
                if (connectionBlocks[i].includes(term)) {
                    cxn[i].push([]);
                    continue;
                }
                const num = parseInt(term, 16);
                if (!num)
                    continue;
                const channel = (num & 3) << (num & 4);
                const offset = num & 8 ? (num & 4 ? 0x0100 : 0x1000) : 0;
                cxn[i][cxn[i].length - 1].push(channel | offset);
            }
        }
    }
    get features() {
        return this._features;
    }
    get manual() {
        return Boolean(this._features & manualFeatureMask);
    }
    get counted() {
        return Boolean(this._features & countedFeatureMask);
    }
    hasFeature(feature) {
        return Boolean(this._features & featureMask[feature]);
    }
    hasFeatures(features) {
        return (this._features & features) === features;
    }
    withFeature(feature) {
        throw new Error();
    }
    isEmpty() {
        return this._isEmpty;
    }
    withObstruction() {
        throw new Error();
    }
    isCompatibleWithTileset(id) {
        for (const tileset of this._tilesets) {
            if (tileset.tilesetId === id)
                return true;
        }
        return false;
    }
    replace(from, to) {
        const { tiles } = this.screen;
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i] === from)
                tiles[i] = to;
        }
        return this;
    }
    remove() {
        for (const key in this.data.tilesets) {
            const tileset = this.rom.metatilesets[key];
            tileset.deleteScreen(this);
        }
    }
    get sid() {
        return this.data.id;
    }
    set sid(sid) {
        if (this.sid === sid)
            return;
        this.rom.metascreens.renumber(this.sid, sid);
    }
    get screen() {
        const { sid, rom: { screens } } = this;
        return sid < 0 ? screens.unallocated[~sid] : screens[sid];
    }
    unsafeSetId(sid) {
        this.data.id = sid;
        for (const tileset of this._tilesets) {
            tileset.invalidate();
        }
    }
    unsafeAddTileset(tileset) {
        this._tilesets.add(tileset);
    }
    unsafeRemoveTileset(tileset) {
        this._tilesets.delete(tileset);
    }
    edgeExits() {
        var _a;
        let mask = 0;
        for (const e of (_a = this.data.exits) !== null && _a !== void 0 ? _a : []) {
            const dir = edgeTypeMap[e.type];
            if (dir != null)
                mask |= (1 << dir);
        }
        return mask;
    }
    edgeIndex(edgeType) {
        var _a;
        let index = 0;
        const edge = (_a = this.data.edges) !== null && _a !== void 0 ? _a : '';
        for (let i = 0; i < 4; i++) {
            if (edge[i] === ' ')
                continue;
            if (edge[i] !== edgeType)
                return undefined;
            index |= (1 << i);
        }
        return index;
    }
    findExitType(tile, single, seamless) {
        var _a, _b;
        for (const exit of (_a = this.data.exits) !== null && _a !== void 0 ? _a : []) {
            if (exit.type.startsWith('seamless') !== seamless)
                continue;
            const t0 = single && exit.type === 'edge:bottom' && tile >= 0xc0 ?
                tile + 0x20 : tile;
            if (exit.exits.includes(t0) || ((_b = exit.allowedExits) !== null && _b !== void 0 ? _b : []).includes(t0)) {
                return exit;
            }
        }
        return undefined;
    }
    findEntranceType(coord, single) {
        var _a, _b;
        for (const exit of (_a = this.data.exits) !== null && _a !== void 0 ? _a : []) {
            if (exit.type.startsWith('seamless'))
                continue;
            const c0 = single && exit.type === 'edge:bottom' && coord >= 0xbf00 ?
                coord + 0x2000 : coord;
            const t0 = (c0 & 0xf0) >> 4 | (c0 & 0xf000) >> 8;
            if (exit.entrance === c0 ||
                exit.exits.includes(t0) || ((_b = exit.allowedExits) !== null && _b !== void 0 ? _b : []).includes(t0)) {
                return exit.type;
            }
        }
        return undefined;
    }
    addCustomFlag(defaultValue) {
        this.flag = defaultValue ? 'custom:true' : 'custom:false';
    }
    checkNeighbor(that, dir) {
        const a = dir & 2 ? this : that;
        const b = dir & 2 ? that : this;
        return a.neighbors[dir & 1].get(b);
    }
    _checkNeighbor(that, dir) {
        const e1 = this.data.edges;
        const e2 = that.data.edges;
        if (e1 && e2) {
            const opp = dir ^ 2;
            if (e1[opp] !== '*' && e1[opp] === e2[dir])
                return true;
        }
        return false;
    }
}
const edgeTypeMap = {
    'edge:top': 0,
    'edge:left': 1,
    'edge:bottom': 2,
    'edge:right': 3,
};
const connectionBlocks = [
    '|:',
    '|:=-',
    '|',
    '|=',
];
const manualFeatures = new Set([
    'arena', 'portoa1', 'portoa2', 'portoa3', 'lake', 'overpass', 'underpass',
    'lighthouse', 'cabin', 'windmill', 'altar', 'pyramid', 'crypt',
]);
const countedFeatures = new Set([
    'pit', 'spikes', 'bridge', 'wall', 'ramp', 'whirlpool',
]);
const manualFeatureMask = [...manualFeatures].map(f => featureMask[f]).reduce((a, b) => a | b);
const countedFeatureMask = [...countedFeatures].map(f => featureMask[f]).reduce((a, b) => a | b);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YXNjcmVlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9qcy9yb20vbWV0YXNjcmVlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0MsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFJaEQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUl0QyxNQUFNLE9BQU8sVUFBVTtJQXNCckIsWUFBcUIsR0FBUSxFQUFXLEdBQVEsRUFDM0IsSUFBb0I7O1FBRHBCLFFBQUcsR0FBSCxHQUFHLENBQUs7UUFBVyxRQUFHLEdBQUgsR0FBRyxDQUFLO1FBQzNCLFNBQUksR0FBSixJQUFJLENBQWdCO1FBckJ4QixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQU9wRCxTQUFJLEdBQUcsS0FBSyxDQUFDO1FBS0osY0FBUyxHQUFHO1lBQ25CLElBQUksVUFBVSxDQUFzQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsSUFBSSxVQUFVLENBQXNCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM3RCxDQUFDO1FBT1QsS0FBSyxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsRCxJQUFJLENBQUMsT0FBUSxDQUFDLFFBQVE7Z0JBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7U0FDMUM7UUFHRCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDakIsS0FBSyxNQUFNLE9BQU8sVUFBSSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxFQUFFLEVBQUU7WUFDeEMsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xD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LENBQUMsQ0FBQyxHQUFHLENBQzdDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzNELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxDQUFDLEdBQUcsQ0FDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0Nvbm5lY3Rpb24sIENvbm5lY3Rpb25UeXBlLCBGZWF0dXJlLCBNZXRhc2NyZWVuRGF0YSxcbiAgICAgICAgZmVhdHVyZU1hc2t9IGZyb20gJy4vbWV0YXNjcmVlbmRhdGEuanMnO1xuaW1wb3J0IHtNZXRhdGlsZXNldCwgTWV0YXRpbGVzZXRzfSBmcm9tICcuL21ldGF0aWxlc2V0LmpzJztcbmltcG9ydCB7U2NyZWVufSBmcm9tICcuL3NjcmVlbi5qcyc7XG5pbXBvcnQge1JvbX0gZnJvbSAnLi4vcm9tLmpzJztcbmltcG9ydCB7RGVmYXVsdE1hcH0gZnJvbSAnLi4vdXRpbC5qcyc7XG5cbmV4cG9ydCB0eXBlIFVpZCA9IG51bWJlciAmIHtfX3VpZF9fOiBuZXZlcn07XG5cbmV4cG9ydCBjbGFzcyBNZXRhc2NyZWVuIHtcbiAgcHJpdmF0ZSByZWFkb25seSBfZmVhdHVyZXM6IG51bWJlcjsgLy8gPSBuZXcgU2V0PEZlYXR1cmU+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3RpbGVzZXRzID0gbmV3IFNldDxNZXRhdGlsZXNldD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfaXNFbXB0eTogYm9vbGVhbjtcbiAgLy8ga2V5OiBiaXRzZXQgLSAxIGZvciBmbGlnaHQsIDIgZm9yIG5vRmxhZ1xuICAvLyB2YWx1ZTogc2VnbWVudHMsIGVhY2ggY29udGFpbmluZyBhbiBvZmZzZXQgdG8gYWRkIHRvIHBvczw8OCB0byBnZXRcbiAgLy8gICAgICAgIGNvbm5lY3Rpb24gcG9pbnRzIChlLmcuIDAwMDEsIDAxMDEsIDEwMjAsIGV0YykuXG4gIHJlYWRvbmx5IGNvbm5lY3Rpb25zOiBSZWFkb25seUFycmF5PFJlYWRvbmx5QXJyYXk8UmVhZG9ubHlBcnJheTxudW1iZXI+Pj47XG5cbiAgdXNlZCA9IGZhbHNlO1xuXG4gIGZsYWc/OiAnYWx3YXlzJyB8ICdjYWxtJyB8ICdjdXN0b206ZmFsc2UnIHwgJ2N1c3RvbTp0cnVlJztcbiAgbmFtZT86IHN0cmluZztcblxuICByZWFkb25seSBuZWlnaGJvcnMgPSBbXG4gICAgbmV3IERlZmF1bHRNYXA8TWV0YXNjcmVlbiwgYm9vbGVhbj4oKHMpID0+IHRoaXMuX2NoZWNrTmVpZ2hib3IocywgMCkpLFxuICAgIG5ldyBEZWZhdWx0TWFwPE1ldGFzY3JlZW4sIGJvb2xlYW4+KChzKSA9PiB0aGlzLl9jaGVja05laWdoYm9yKHMsIDEpKSxcbiAgXSBhcyBjb25zdDtcblxuICAvL3JlYWRvbmx5IGZlYXR1cmVDb3VudDogUmVhZG9ubHlNYXA8RmVhdHVyZSwgbnVtYmVyPjtcblxuICAvLyBUT0RPIC0gbWFrZSBkYXRhIHByaXZhdGU/XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJvbTogUm9tLCByZWFkb25seSB1aWQ6IFVpZCxcbiAgICAgICAgICAgICAgcmVhZG9ubHkgZGF0YTogTWV0YXNjcmVlbkRhdGEpIHtcbiAgICBmb3IgKGNvbnN0IHRpbGVzZXQgb2YgT2JqZWN0LnZhbHVlcyhkYXRhLnRpbGVzZXRzKSkge1xuICAgICAgaWYgKCF0aWxlc2V0IS5yZXF1aXJlcykgdGhpcy51c2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gbGV0IGZpeGVkID0gZmFsc2U7XG4gICAgLy8gY29uc3QgZmVhdHVyZUNvdW50ID0gbmV3IERlZmF1bHRNYXA8RmVhdHVyZSwgbnVtYmVyPigoKSA9PiAwKTtcbiAgICBsZXQgZmVhdHVyZXMgPSAwO1xuICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBkYXRhLmZlYXR1cmUgPz8gW10pIHtcbiAgICAgIGNvbnN0IG1hc2sgPSBmZWF0dXJlTWFza1tmZWF0dXJlXTtcbiAgICAgIGlmIChtYXNrICE9IG51bGwpIGZlYXR1cmVzIHw9IG1hc2s7XG4gICAgICAvLyB0aGlzLl9mZWF0dXJlcy5hZGQoZmVhdHVyZSk7XG4gICAgICAvLyBpZiAoZml4ZWRGZWF0dXJlcy5oYXMoZmVhdHVyZSkpIGZpeGVkID0gdHJ1ZTtcbiAgICAgIC8vIGlmIChmaXhlZENvdW50RmVhdHVyZXMuaGFzKGZlYXR1cmUpKSB7XG4gICAgICAvLyAgIGZlYXR1cmVDb3VudC5zZXQoZmVhdHVyZSwgZmVhdHVyZUNvdW50LmdldChmZWF0dXJlKSArIDEpO1xuICAgICAgLy8gfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGV4aXQgb2YgZGF0YS5leGl0cyA/PyBbXSkge1xuICAgICAgaWYgKGV4aXQudHlwZSA9PT0gJ3N0YWlyOmRvd24nIHx8IGV4aXQudHlwZSA9PT0gJ3N0YWlyOnVwJykge1xuICAgICAgICBmZWF0dXJlcyB8PSBmZWF0dXJlTWFza1tleGl0LnR5cGVdO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9mZWF0dXJlcyA9IGZlYXR1cmVzO1xuICAgIHRoaXMuX2lzRW1wdHkgPSBCb29sZWFuKGZlYXR1cmVzICYgZmVhdHVyZU1hc2suZW1wdHkpO1xuICAgIHRoaXMuZmxhZyA9IGRhdGEuZmxhZztcbiAgICAvLyB0aGlzLmZpeGVkID0gZml4ZWQ7XG4gICAgLy8gdGhpcy5mZWF0dXJlQ291bnQgPSBmZWF0dXJlQ291bnQ7XG4gICAgLy8gVE9ETyAtIGJ1aWxkIFwiY29ubmVjdGlvbnNcIiBieSBpdGVyYXRpbmcgb3ZlciAwLi4zLlxuICAgIGNvbnN0IGN4bjogbnVtYmVyW11bXVtdID0gW1tbXV0sIFtbXV0sIFtbXV0sIFtbXV1dO1xuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBjeG47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgIGZvciAoY29uc3QgdGVybSBvZiB0aGlzLmRhdGEuY29ubmVjdCA/PyAnJykge1xuICAgICAgICBpZiAoY29ubmVjdGlvbkJsb2Nrc1tpXS5pbmNsdWRlcyh0ZXJtKSkge1xuICAgICAgICAgIGN4bltpXS5wdXNoKFtdKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBudW0gPSBwYXJzZUludCh0ZXJtLCAxNik7XG4gICAgICAgIGlmICghbnVtKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgY2hhbm5lbCA9IChudW0gJiAzKSA8PCAobnVtICYgNCk7IC8vIDAxLCAwMiwgMDMsIDEwLCAyMCwgb3IgMzBcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gbnVtICYgOCA/IChudW0gJiA0ID8gMHgwMTAwIDogMHgxMDAwKSA6IDA7XG4gICAgICAgIGN4bltpXVtjeG5baV0ubGVuZ3RoIC0gMV0ucHVzaChjaGFubmVsIHwgb2Zmc2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQgZmVhdHVyZXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZmVhdHVyZXM7XG4gIH1cblxuICBnZXQgbWFudWFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuX2ZlYXR1cmVzICYgbWFudWFsRmVhdHVyZU1hc2spO1xuICB9XG5cbiAgZ2V0IGNvdW50ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5fZmVhdHVyZXMgJiBjb3VudGVkRmVhdHVyZU1hc2spO1xuICB9XG5cbiAgLy8gZmVhdHVyZXMoKTogSXRlcmFibGU8RmVhdHVyZT4ge1xuICAvLyAgIHJldHVybiB0aGlzLl9mZWF0dXJlcy52YWx1ZXMoKTtcbiAgLy8gfVxuXG4gIGhhc0ZlYXR1cmUoZmVhdHVyZTogRmVhdHVyZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuX2ZlYXR1cmVzICYgZmVhdHVyZU1hc2tbZmVhdHVyZV0pO1xuICB9XG5cbiAgaGFzRmVhdHVyZXMoZmVhdHVyZXM6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5fZmVhdHVyZXMgJiBmZWF0dXJlcykgPT09IGZlYXR1cmVzO1xuICB9XG5cbiAgLyoqIFJldHVybiBhIG5ldyBtZXRhc2NyZWVuIHdpdGggdGhlIHNhbWUgcHJvZmlsZSBidXQgYW4gZXh0cmEgZmVhdHVyZS4gKi9cbiAgd2l0aEZlYXR1cmUoZmVhdHVyZTogRmVhdHVyZSk6IE1ldGFzY3JlZW5bXSB7XG4gICAgLy8gVE9ETyAtIGluZGV4IHRoaXM/XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gIH1cblxuICBpc0VtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc0VtcHR5O1xuICB9XG5cbiAgLyoqIFJldHVybiBhIG5ldyBtZXRhc2NyZWVuIHdpdGggdGhlIHNhbWUgcHJvZmlsZSBidXQgbW9yZSBvYnN0cnVjdGVkLiAqL1xuICB3aXRoT2JzdHJ1Y3Rpb24oKTogTWV0YXNjcmVlbltdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgfVxuXG4gIGlzQ29tcGF0aWJsZVdpdGhUaWxlc2V0KGlkOiBudW1iZXIpIHtcbiAgICBmb3IgKGNvbnN0IHRpbGVzZXQgb2YgdGhpcy5fdGlsZXNldHMpIHtcbiAgICAgIGlmICh0aWxlc2V0LnRpbGVzZXRJZCA9PT0gaWQpIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZSBvY2N1cnJlbmNlcyBvZiBhIG1ldGF0aWxlIHdpdGhpbiB0aGlzIHNjcmVlbi5cbiAgICovXG4gIHJlcGxhY2UoZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyKTogTWV0YXNjcmVlbiB7XG4gICAgY29uc3Qge3RpbGVzfSA9IHRoaXMuc2NyZWVuO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aWxlc1tpXSA9PT0gZnJvbSkgdGlsZXNbaV0gPSB0bztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgLy8gUmVtb3ZlIHNlbGYgZnJvbSBhbGwgbWV0YXRpbGVzZXRzLiAgVXNlZCBieSBsYWJ5cmludGhWYXJpYW50IHRvXG4gICAgLy8gZW5zdXJlIGltcG9zc2libGUgdmFyaWFudHMgYXJlbid0IGFkZGVkIChub3RlOiB3aXRoIGEgZGVkaWNhdGVkXG4gICAgLy8gcGFnZSB3ZSBjb3VsZCBtYWtlIG1vcmUgYXZhaWxhYmxlKS5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLmRhdGEudGlsZXNldHMpIHtcbiAgICAgIGNvbnN0IHRpbGVzZXQgPVxuICAgICAgICAgIHRoaXMucm9tLm1ldGF0aWxlc2V0c1trZXkgYXMga2V5b2YgTWV0YXRpbGVzZXRzXSBhcyBNZXRhdGlsZXNldDtcbiAgICAgIHRpbGVzZXQuZGVsZXRlU2NyZWVuKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBzaWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmlkO1xuICB9XG5cbiAgc2V0IHNpZChzaWQ6IG51bWJlcikge1xuICAgIGlmICh0aGlzLnNpZCA9PT0gc2lkKSByZXR1cm47XG4gICAgdGhpcy5yb20ubWV0YXNjcmVlbnMucmVudW1iZXIodGhpcy5zaWQsIHNpZCk7XG4gIH1cblxuICBnZXQgc2NyZWVuKCk6IFNjcmVlbiB7XG4gICAgY29uc3Qge3NpZCwgcm9tOiB7c2NyZWVuc319ID0gdGhpcztcbiAgICByZXR1cm4gc2lkIDwgMCA/IHNjcmVlbnMudW5hbGxvY2F0ZWRbfnNpZF0gOiBzY3JlZW5zW3NpZF07XG4gIH1cblxuICAvLyBPbmx5IE1ldGFzY3JlZW5zLnJlbnVtYmVyIHNob3VsZCBjYWxsIHRoaXMuXG4gIHVuc2FmZVNldElkKHNpZDogbnVtYmVyKSB7XG4gICAgKHRoaXMuZGF0YSBhcyB7aWQ6IG51bWJlcn0pLmlkID0gc2lkO1xuICAgIGZvciAoY29uc3QgdGlsZXNldCBvZiB0aGlzLl90aWxlc2V0cykge1xuICAgICAgdGlsZXNldC5pbnZhbGlkYXRlKCk7XG4gICAgfVxuICB9XG4gIC8vIE9ubHkgTWV0YXRpbGVzZXQuYWRkU2NyZWVuIHNob3VsZCBjYWxsIHRoaXMuXG4gIHVuc2FmZUFkZFRpbGVzZXQodGlsZXNldDogTWV0YXRpbGVzZXQpIHtcbiAgICB0aGlzLl90aWxlc2V0cy5hZGQodGlsZXNldCk7XG4gIH1cbiAgLy8gT25seSBNZXRhdGlsZXNldC5yZW1vdmVTY3JlZW4gc2hvdWxkIGNhbGwgdGhpcy5cbiAgdW5zYWZlUmVtb3ZlVGlsZXNldCh0aWxlc2V0OiBNZXRhdGlsZXNldCkge1xuICAgIHRoaXMuX3RpbGVzZXRzLmRlbGV0ZSh0aWxlc2V0KTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgYml0IG1hc2sgb2YgZWRnZXMgdGhhdCBfY291bGRfIGV4aXQ6IDE9TiwgMj1XLCA0PVMsIDg9RS4gKi9cbiAgZWRnZUV4aXRzKCk6IG51bWJlciB7XG4gICAgbGV0IG1hc2sgPSAwO1xuICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLmRhdGEuZXhpdHMgPz8gW10pIHtcbiAgICAgIGNvbnN0IGRpciA9IGVkZ2VUeXBlTWFwW2UudHlwZV07XG4gICAgICBpZiAoZGlyICE9IG51bGwpIG1hc2sgfD0gKDEgPDwgZGlyKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hc2s7XG4gIH1cblxuICBlZGdlSW5kZXgoZWRnZVR5cGU6IHN0cmluZyk6IG51bWJlcnx1bmRlZmluZWQge1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgY29uc3QgZWRnZSA9IHRoaXMuZGF0YS5lZGdlcyA/PyAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgaWYgKGVkZ2VbaV0gPT09ICcgJykgY29udGludWU7XG4gICAgICBpZiAoZWRnZVtpXSAhPT0gZWRnZVR5cGUpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICBpbmRleCB8PSAoMSA8PCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgZmluZEV4aXRUeXBlKHRpbGU6IG51bWJlciwgc2luZ2xlOiBib29sZWFuLFxuICAgICAgICAgICAgICAgc2VhbWxlc3M6IGJvb2xlYW4pOiBDb25uZWN0aW9ufHVuZGVmaW5lZCB7XG4gICAgZm9yIChjb25zdCBleGl0IG9mIHRoaXMuZGF0YS5leGl0cyA/PyBbXSkge1xuICAgICAgaWYgKGV4aXQudHlwZS5zdGFydHNXaXRoKCdzZWFtbGVzcycpICE9PSBzZWFtbGVzcykgY29udGludWU7XG4gICAgICBjb25zdCB0MCA9IHNpbmdsZSAmJiBleGl0LnR5cGUgPT09ICdlZGdlOmJvdHRvbScgJiYgdGlsZSA+PSAweGMwID9cbiAgICAgICAgICB0aWxlICsgMHgyMCA6IHRpbGU7XG4gICAgICBpZiAoZXhpdC5leGl0cy5pbmNsdWRlcyh0MCkgfHwgKGV4aXQuYWxsb3dlZEV4aXRzID8/IFtdKS5pbmNsdWRlcyh0MCkpIHtcbiAgICAgICAgcmV0dXJuIGV4aXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBmaW5kRW50cmFuY2VUeXBlKGNvb3JkOiBudW1iZXIsIHNpbmdsZTogYm9vbGVhbik6IENvbm5lY3Rpb25UeXBlfHVuZGVmaW5lZCB7XG4gICAgZm9yIChjb25zdCBleGl0IG9mIHRoaXMuZGF0YS5leGl0cyA/PyBbXSkge1xuICAgICAgaWYgKGV4aXQudHlwZS5zdGFydHNXaXRoKCdzZWFtbGVzcycpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGMwID0gc2luZ2xlICYmIGV4aXQudHlwZSA9PT0gJ2VkZ2U6Ym90dG9tJyAmJiBjb29yZCA+PSAweGJmMDAgP1xuICAgICAgICAgIGNvb3JkICsgMHgyMDAwIDogY29vcmQ7XG4gICAgICBjb25zdCB0MCA9IChjMCAmIDB4ZjApID4+IDQgfCAoYzAgJiAweGYwMDApID4+IDg7XG4gICAgICBpZiAoZXhpdC5lbnRyYW5jZSA9PT0gYzAgfHxcbiAgICAgICAgICBleGl0LmV4aXRzLmluY2x1ZGVzKHQwKSB8fCAoZXhpdC5hbGxvd2VkRXhpdHMgPz8gW10pLmluY2x1ZGVzKHQwKSkge1xuICAgICAgICByZXR1cm4gZXhpdC50eXBlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgYWRkQ3VzdG9tRmxhZyhkZWZhdWx0VmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmZsYWcgPSBkZWZhdWx0VmFsdWUgPyAnY3VzdG9tOnRydWUnIDogJ2N1c3RvbTpmYWxzZSc7XG5cbiAgICAvLyBUT0RPIC0gZm9yIG5vdywgY3VzdG9tIGZsYWdzIGFyZSBzZXQgYnkgZGVmYXVsdC5cblxuICAgIC8vIGlmICghZmxhZ0FsbCkgcmV0dXJuO1xuICAgIC8vIGZvciAoY29uc3QgbG9jIG9mIHRoaXMucm9tLmxvY2F0aW9ucykge1xuICAgIC8vICAgaWYgKCFsb2MudXNlZCkgY29udGludWU7XG4gICAgLy8gICBmb3IgKGNvbnN0IHBvcyBvZiBsb2MubWV0YS5hbGxQb3MoKSkge1xuICAgIC8vICAgICBpZiAobG9jLm1ldGEuZ2V0VWlkKHBvcykgIT09IHRoaXMudWlkKSBjb250aW51ZTtcbiAgICAvLyAgICAgbG9jLm1ldGEuY3VzdG9tRmxhZ3Muc2V0KHBvcywgdGhpcy5yb20uZmxhZ3MuQWx3YXlzVHJ1ZSk7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIGNhbiBuZWlnaGJvciB0aGF0IGluICdkaXInIGRpcmVjdGlvbi5cbiAgICogSWYgZGlyIGlzIDAsIGNoZWNrcyB0aGF0ICd0aGF0JyBpcyBhYm92ZSAndGhpcycuXG4gICAqIElmIGRpciBpcyAxLCBjaGVja3MgdGhhdCAndGhhdCcgaXMgbGVmdCBvZiAndGhpcycuXG4gICAqIElmIGRpciBpcyAyLCBjaGVja3MgdGhhdCAndGhhdCcgaXMgYmVsb3cgJ3RoaXMnLlxuICAgKiBJZiBkaXIgaXMgMywgY2hlY2tzIHRoYXQgJ3RoYXQnIGlzIHJpZ2h0IG9mICd0aGlzJy5cbiAgICovXG4gIGNoZWNrTmVpZ2hib3IodGhhdDogTWV0YXNjcmVlbiwgZGlyOiBudW1iZXIpIHtcbiAgICAvLyBjaGVjazogMCAtPiB0aGF0W3ZlcnRdLmdldCh0aGlzKSAtPiB0aGlzIGlzIHVuZGVyIHRoYXRcbiAgICBjb25zdCBhID0gZGlyICYgMiA/IHRoaXMgOiB0aGF0O1xuICAgIGNvbnN0IGIgPSBkaXIgJiAyID8gdGhhdCA6IHRoaXM7XG4gICAgcmV0dXJuIGEubmVpZ2hib3JzW2RpciAmIDFdLmdldChiKTtcbiAgfVxuXG4gIC8qKiBAcGFyYW0gZGlyIDAgdG8gY2hlY2sgaWYgdGhhdCBpcyB1bmRlciB0aGlzLCAxIGlmIHRoYXQgaXMgcmlnaHQgb2YgdGhpcyAqL1xuICBwcml2YXRlIF9jaGVja05laWdoYm9yKHRoYXQ6IE1ldGFzY3JlZW4sIGRpcjogMHwxKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZTEgPSB0aGlzLmRhdGEuZWRnZXM7XG4gICAgY29uc3QgZTIgPSB0aGF0LmRhdGEuZWRnZXM7XG4gICAgaWYgKGUxICYmIGUyKSB7XG4gICAgICBjb25zdCBvcHAgPSBkaXIgXiAyO1xuICAgICAgaWYgKGUxW29wcF0gIT09ICcqJyAmJiBlMVtvcHBdID09PSBlMltkaXJdKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmNvbnN0IGVkZ2VUeXBlTWFwOiB7W0MgaW4gQ29ubmVjdGlvblR5cGVdPzogbnVtYmVyfSA9IHtcbiAgJ2VkZ2U6dG9wJzogMCxcbiAgJ2VkZ2U6bGVmdCc6IDEsXG4gICdlZGdlOmJvdHRvbSc6IDIsXG4gICdlZGdlOnJpZ2h0JzogMyxcbn07XG5cbmNvbnN0IGNvbm5lY3Rpb25CbG9ja3MgPSBbXG4gICd8OicsIC8vIGJyZWFrIHdhbGwsIGZvcm0gYnJpZGdlLCBidXQgbm8gZmxpZ2h0XG4gICd8Oj0tJywgLy8gbm8gd2FsbHMvYnJpZGdlL2ZsaWdodFxuICAnfCcsIC8vIGZsaWdodCBhbmQgYnJlYWsgd2FsbHNcbiAgJ3w9JywgLy8gZmxpZ2h0IG9ubHlcbl07XG4gIFxuXG5jb25zdCBtYW51YWxGZWF0dXJlcyA9IG5ldyBTZXQ8RmVhdHVyZT4oW1xuICAnYXJlbmEnLCAncG9ydG9hMScsICdwb3J0b2EyJywgJ3BvcnRvYTMnLCAnbGFrZScsICdvdmVycGFzcycsICd1bmRlcnBhc3MnLFxuICAnbGlnaHRob3VzZScsICdjYWJpbicsICd3aW5kbWlsbCcsICdhbHRhcicsICdweXJhbWlkJywgJ2NyeXB0Jyxcbl0pO1xuY29uc3QgY291bnRlZEZlYXR1cmVzID0gbmV3IFNldDxGZWF0dXJlPihbXG4gICdwaXQnLCAnc3Bpa2VzJywgJ2JyaWRnZScsICd3YWxsJywgJ3JhbXAnLCAnd2hpcmxwb29sJyxcbl0pO1xuXG5jb25zdCBtYW51YWxGZWF0dXJlTWFzayA9IFsuLi5tYW51YWxGZWF0dXJlc10ubWFwKFxuICAgIGYgPT4gZmVhdHVyZU1hc2tbZl0gYXMgbnVtYmVyKS5yZWR1Y2UoKGEsIGIpID0+IGEgfCBiKTtcbmNvbnN0IGNvdW50ZWRGZWF0dXJlTWFzayA9IFsuLi5jb3VudGVkRmVhdHVyZXNdLm1hcChcbiAgICBmID0+IGZlYXR1cmVNYXNrW2ZdIGFzIG51bWJlcikucmVkdWNlKChhLCBiKSA9PiBhIHwgYik7XG4iXX0=