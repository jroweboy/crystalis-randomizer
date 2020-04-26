import { CaveShuffle } from './cave.js';
import { OK } from './maze.js';
import { E, N, S, W } from './grid.js';
import { ScreenFix } from '../rom/screenfix.js';
import { DefaultMap } from '../util.js';
export class LabyrinthShuffle extends CaveShuffle {
    initialFill(a) {
        const target = a.size + 3;
        const stair = (this.random.nextInt(a.w) << 4 | (a.h - 1) << 12 | 0x808);
        if (!a.grid.isBorder(W(stair)))
            a.fixed.add(W(stair, 2));
        if (!a.grid.isBorder(E(stair)))
            a.fixed.add(E(stair, 2));
        a.grid.set(stair, '>');
        a.fixed.add(stair);
        a.grid.set(N(stair), 'w');
        a.fixed.add(N(stair));
        a.fixed.add(W(stair));
        a.fixed.add(E(stair));
        const arena = (this.random.nextInt(a.w) << 4 | 0x808);
        const down = S(arena, 2);
        a.grid.set(arena, '<');
        a.fixed.add(arena);
        a.grid.set(S(arena), 'w');
        a.fixed.add(S(arena));
        a.grid.set(down, 'w');
        a.fixed.add(down);
        a.grid.set(S(down), 'w');
        a.fixed.add(S(down));
        a.fixed.add(W(down));
        a.fixed.add(E(down));
        if (!this.tryConnect(a, N(stair, 2), S(down, 2), 'w', 10)) {
            return { ok: false, fail: `initial connect` };
        }
        while (a.count < target) {
            if (!this.tryAddLoop(a, 'w', 10))
                return { ok: false, fail: `add loops` };
        }
        return OK;
    }
    refine() { return OK; }
    refineEdges() { return true; }
    addArenas() { return true; }
    addStairs() { return OK; }
    refineMetascreens(a, meta) {
        console.log(meta.show());
        for (let y = 0; y < meta.height; y++) {
            for (let x = 0; x < meta.width; x++) {
                const pos = y << 4 | x;
                const scr = meta.get(pos);
                const edge = scr.edgeIndex('w');
                if (scr.hasFeature('arena')) {
                    this.arena = pos + 0x10 << 8 | 1;
                }
                else if (edge === 5) {
                    if (pos < 16 || !meta.get(pos - 16).hasFeature('arena')) {
                        meta.set(pos, meta.rom.metascreens.goaWideHallNS_stairs);
                        const c = ((pos << 8 | pos << 4) & 0xf0f0 | 0x808);
                        a.grid.set(c, 'H');
                    }
                }
                else if (edge === 1) {
                    this.stair = pos << 8 | 2;
                }
            }
        }
        this.reachable = undefined;
        if (!this.checkMeta(meta))
            return { ok: false, fail: `initial meta check` };
        console.log(meta.show());
        const deadEnd = this.orig.rom.metascreens.goaWideHallNS_deadEnd;
        for (let x = 0; x < meta.width; x++) {
            for (let y = 0; y < meta.height; y++) {
                const c = (y << 12 | x << 4 | 0x808);
                let len = 0;
                while (y + len < meta.height &&
                    a.grid.get(c + len * 0x1000) === 'H') {
                    len++;
                }
                if (!len)
                    continue;
                const opts = [new Map(), new Map()];
                for (let i = 0; i < len; i++) {
                    opts[i & 1].set((y + i) << 4 | x, deadEnd);
                }
                let found = false;
                for (const opt of this.random.ishuffle(opts)) {
                    if (!opt.size) {
                        found = true;
                        continue;
                    }
                    if (!this.checkMeta(meta, opt))
                        continue;
                    for (const [pos, s] of opt) {
                        meta.set(pos, s);
                        a.grid.set(c + 0x1000 * ((pos >> 4) - y), '=');
                    }
                    found = true;
                    break;
                }
                if (!found)
                    return { ok: false, fail: `could not rectify hallway` };
                y += len;
            }
        }
        return super.refineMetascreens(a, meta);
    }
    checkMeta(meta, repl) {
        const opts = repl ? { with: repl } : {};
        const parts = meta.traverse(opts);
        const part = parts.get(this.stair);
        if (part !== parts.get(this.arena)) {
            console.log(`stair not connected to arena\n${meta.show()}`);
            return false;
        }
        if (this.reachable == null) {
            if (part && part.size < parts.size * 0.95) {
                console.log(`too small`);
                return false;
            }
            this.reachable = part === null || part === void 0 ? void 0 : part.size;
            return true;
        }
        else {
            if ((part === null || part === void 0 ? void 0 : part.size) > this.reachable * 0.95) {
                return true;
            }
            return false;
        }
    }
}
export function fixLabyrinthScreens(rom, random) {
    var _a;
    const { metatilesets: { cave, pyramid, labyrinth, iceCave } } = rom;
    rom.metascreens.registerFix(ScreenFix.LabyrinthParapets, 1);
    {
        for (const ts of [labyrinth, pyramid]) {
            ts.getTile(0x2b).copyFrom(0x19).replaceIn(...ts);
            ts.getTile(0xba).copyFrom(0x1b).replaceIn(...ts);
        }
        iceCave.getTile(0x17).copyFrom(0x19).replaceIn(...iceCave);
        iceCave.getTile(0x18).copyFrom(0x1b).replaceIn(...iceCave);
        for (const ts of [cave, pyramid]) {
            ts.getTile(0x19).copyFrom(0xc5);
            ts.getTile(0x1b).copyFrom(0xc5);
        }
        labyrinth.getTile(0x19).copyFrom(0xc6).setAlternative(0xc5);
        labyrinth.getTile(0x1b).copyFrom(0xc4).setAlternative(0xc5);
    }
    const bySid = new DefaultMap(() => []);
    for (const s of rom.metatilesets.labyrinth) {
        bySid.get(s.sid).push(s);
    }
    for (const [sid, screens] of bySid) {
        const screen = rom.screens[sid];
        const remove = screens.map(s => { var _a; return (_a = s.data.tilesets.labyrinth) === null || _a === void 0 ? void 0 : _a.removeWall; });
        const [removed, ...rest] = new Set(remove.filter(w => w != null));
        if (removed != null) {
            screen.set2d(removed, [[0xc5, 0xc5], [0xd0, 0xc5]]);
            if (rest.length)
                throw new Error(`bad remove`);
            for (let i = 0; i < remove.length; i++) {
                if (remove[i] == null) {
                    screens[i].data.tilesets.labyrinth.addWall = [removed];
                }
            }
        }
        if (screens.length < 2)
            continue;
        if (screens.length > 2) {
            const deleted = random.pick(screens.filter(s => { var _a; return (_a = s.data.tilesets.labyrinth) === null || _a === void 0 ? void 0 : _a.addWall; }));
            screens.splice(screens.indexOf(deleted), 1);
            deleted.remove();
        }
        for (const s of screens) {
            const add = (_a = s.data.tilesets.labyrinth) === null || _a === void 0 ? void 0 : _a.addWall;
            if (add != null) {
                s.data.mod = 'block';
                for (const w of add)
                    screen.set2d(w, [[0x19, 0x19], [0x1b, 0x1b]]);
            }
            else {
                s.flag = 'always';
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL21hemUvZ29hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBc0IsV0FBVyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQzVELE9BQU8sRUFBVSxFQUFFLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFHdkMsT0FBTyxFQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNsRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQVF4QyxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsV0FBVztJQU8vQyxXQUFXLENBQUMsQ0FBSTtRQUNkLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sS0FBSyxHQUNQLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBYyxDQUFDO1FBQzNFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXRCLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQWMsQ0FBQztRQUNuRSxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElB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O2lCQUFNO2dCQUNMLENBQUMsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO2FBQ25CO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDYXZlU2h1ZmZsZUF0dGVtcHQsIENhdmVTaHVmZmxlIH0gZnJvbSAnLi9jYXZlLmpzJztcbmltcG9ydCB7IFJlc3VsdCwgT0sgfSBmcm9tICcuL21hemUuanMnO1xuaW1wb3J0IHsgUm9tIH0gZnJvbSAnLi4vcm9tLmpzJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJy4uL3JhbmRvbS5qcyc7XG5pbXBvcnQgeyBHcmlkQ29vcmQsIEUsIE4sIFMsIFcgfSBmcm9tICcuL2dyaWQuanMnO1xuaW1wb3J0IHsgU2NyZWVuRml4IH0gZnJvbSAnLi4vcm9tL3NjcmVlbmZpeC5qcyc7XG5pbXBvcnQgeyBEZWZhdWx0TWFwIH0gZnJvbSAnLi4vdXRpbC5qcyc7XG5pbXBvcnQgeyBNZXRhc2NyZWVuIH0gZnJvbSAnLi4vcm9tL21ldGFzY3JlZW4uanMnO1xuaW1wb3J0IHsgTWV0YWxvY2F0aW9uLCBQb3MgfSBmcm9tICcuLi9yb20vbWV0YWxvY2F0aW9uLmpzJztcblxudHlwZSBBID0gQ2F2ZVNodWZmbGVBdHRlbXB0O1xuXG4vLyBUT0RPIC0gbmVlZHMgbW9yZSBsb29wcy4uLlxuXG5leHBvcnQgY2xhc3MgTGFieXJpbnRoU2h1ZmZsZSBleHRlbmRzIENhdmVTaHVmZmxlIHtcblxuICAvLyBtZXRhLnRyYXZlcnNlIHBvc2l0aW9ucyBmb3IgaW1wb3J0YW50IGZlYXR1cmVzLlxuICBzdGFpciE6IG51bWJlcjtcbiAgYXJlbmEhOiBudW1iZXI7XG4gIHJlYWNoYWJsZT86IG51bWJlcjtcblxuICBpbml0aWFsRmlsbChhOiBBKTogUmVzdWx0PHZvaWQ+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBhLnNpemUgKyAzOyAvLyArIHRoaXMucmFuZG9tLm5leHRJbnQoNCk7XG4gICAgY29uc3Qgc3RhaXIgPVxuICAgICAgICAodGhpcy5yYW5kb20ubmV4dEludChhLncpIDw8IDQgfCAoYS5oIC0gMSkgPDwgMTIgfCAweDgwOCkgYXMgR3JpZENvb3JkO1xuICAgIGlmICghYS5ncmlkLmlzQm9yZGVyKFcoc3RhaXIpKSkgYS5maXhlZC5hZGQoVyhzdGFpciwgMikpO1xuICAgIGlmICghYS5ncmlkLmlzQm9yZGVyKEUoc3RhaXIpKSkgYS5maXhlZC5hZGQoRShzdGFpciwgMikpO1xuICAgIGEuZ3JpZC5zZXQoc3RhaXIsICc+Jyk7XG4gICAgYS5maXhlZC5hZGQoc3RhaXIpO1xuICAgIGEuZ3JpZC5zZXQoTihzdGFpciksICd3Jyk7XG4gICAgYS5maXhlZC5hZGQoTihzdGFpcikpO1xuICAgIGEuZml4ZWQuYWRkKFcoc3RhaXIpKTtcbiAgICBhLmZpeGVkLmFkZChFKHN0YWlyKSk7XG5cbiAgICBjb25zdCBhcmVuYSA9ICh0aGlzLnJhbmRvbS5uZXh0SW50KGEudykgPDwgNCB8IDB4ODA4KSBhcyBHcmlkQ29vcmQ7XG4gICAgY29uc3QgZG93biA9IFMoYXJlbmEsIDIpO1xuICAgIGEuZ3JpZC5zZXQoYXJlbmEsICc8Jyk7XG4gICAgYS5maXhlZC5hZGQoYXJlbmEpO1xuICAgIGEuZ3JpZC5zZXQoUyhhcmVuYSksICd3Jyk7XG4gICAgYS5maXhlZC5hZGQoUyhhcmVuYSkpO1xuICAgIGEuZ3JpZC5zZXQoZG93biwgJ3cnKTtcbiAgICBhLmZpeGVkLmFkZChkb3duKTtcbiAgICBhLmdyaWQuc2V0KFMoZG93biksICd3Jyk7XG4gICAgYS5maXhlZC5hZGQoUyhkb3duKSk7XG4gICAgYS5maXhlZC5hZGQoVyhkb3duKSk7XG4gICAgYS5maXhlZC5hZGQoRShkb3duKSk7XG5cbiAgICAvLyBUT0RPIC0gY2FuIHN0YWlyIGJlIG5vdCBvbiBib3R0b20/ICBhcmVuYSBub3Qgb24gdG9wP1xuXG4gICAgaWYgKCF0aGlzLnRyeUNvbm5lY3QoYSwgTihzdGFpciwgMiksIFMoZG93biwgMiksICd3JywgMTApKSB7XG4gICAgICByZXR1cm4ge29rOiBmYWxzZSwgZmFpbDogYGluaXRpYWwgY29ubmVjdGB9O1xuICAgIH1cbiAgICB3aGlsZSAoYS5jb3VudCA8IHRhcmdldCkge1xuICAgICAgaWYgKCF0aGlzLnRyeUFkZExvb3AoYSwgJ3cnLCAxMCkpIHJldHVybiB7b2s6IGZhbHNlLCBmYWlsOiBgYWRkIGxvb3BzYH07XG4gICAgfVxuICAgIHJldHVybiBPSztcbiAgfVxuXG4gIHJlZmluZSgpIHsgcmV0dXJuIE9LOyB9XG4gIHJlZmluZUVkZ2VzKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICBhZGRBcmVuYXMoKSB7IHJldHVybiB0cnVlOyB9XG4gIGFkZFN0YWlycygpIHsgcmV0dXJuIE9LOyB9XG5cbiAgcmVmaW5lTWV0YXNjcmVlbnMoYTogQSwgbWV0YTogTWV0YWxvY2F0aW9uKTogUmVzdWx0PHZvaWQ+IHtcbmNvbnNvbGUubG9nKG1ldGEuc2hvdygpKTtcbiAgICAvLyAxLiByZXBsYWNlIGFsbCB0aGUgKG5vbi1maXhlZCkgd2lkZUhhbGxOUyB3aXRoIGVpdGhlciBzdGFpcnMgb3IgcGFpcnNcbiAgICAvLyAgICBvZiBkZWFkIGVuZHMgLSBubyBzYW1lIHZlcnRpY2FsIG5laWdoYm9yc1xuICAgIC8vIDIuIHN0YXJ0IGFkZGluZyBibG9ja3NcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG1ldGEuaGVpZ2h0OyB5KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgbWV0YS53aWR0aDsgeCsrKSB7XG4gICAgICAgIGNvbnN0IHBvcyA9IHkgPDwgNCB8IHg7XG4gICAgICAgIGNvbnN0IHNjciA9IG1ldGEuZ2V0KHBvcyk7XG4gICAgICAgIGNvbnN0IGVkZ2UgPSBzY3IuZWRnZUluZGV4KCd3Jyk7XG4gICAgICAgIGlmIChzY3IuaGFzRmVhdHVyZSgnYXJlbmEnKSkge1xuICAgICAgICAgIHRoaXMuYXJlbmEgPSBwb3MgKyAweDEwIDw8IDggfCAxO1xuICAgICAgICB9IGVsc2UgaWYgKGVkZ2UgPT09IDUpIHtcbiAgICAgICAgICBpZiAocG9zIDwgMTYgfHwgIW1ldGEuZ2V0KHBvcyAtIDE2KS5oYXNGZWF0dXJlKCdhcmVuYScpKSB7XG4gICAgICAgICAgICBtZXRhLnNldChwb3MsIG1ldGEucm9tLm1ldGFzY3JlZW5zLmdvYVdpZGVIYWxsTlNfc3RhaXJzKTtcbiAgICAgICAgICAgIGNvbnN0IGMgPSAoKHBvcyA8PCA4IHwgcG9zIDw8IDQpICYgMHhmMGYwIHwgMHg4MDgpIGFzIEdyaWRDb29yZDtcbiAgICAgICAgICAgIGEuZ3JpZC5zZXQoYywgJ0gnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZWRnZSA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuc3RhaXIgPSBwb3MgPDwgOCB8IDI7XG4gICAgICAgIC8vIH0gZWxzZSBpZiAoc2NyLmhhc0ZlYXR1cmUoJ2FyZW5hJykpIHtcbiAgICAgICAgLy8gICBtZXRhLnNldChwb3MsIG1ldGEucm9tLm1ldGFzY3JlZW5zLmdvYVdpZGVIYWxsTlNfc3RhaXJzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBNYWtlIHN1cmUgZXZlcnl0aGluZyBpcyBhY2Nlc3NpYmxlXG4gICAgdGhpcy5yZWFjaGFibGUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKCF0aGlzLmNoZWNrTWV0YShtZXRhKSkgcmV0dXJuIHtvazogZmFsc2UsIGZhaWw6IGBpbml0aWFsIG1ldGEgY2hlY2tgfTtcbmNvbnNvbGUubG9nKG1ldGEuc2hvdygpKTtcbiAgICAvLyBOb3cgdGhhdCBhIGJhc2VsaW5lIGhhcyBiZWVuIGVzdGFibGlzaGVkLCB0cnkgYWRkaW5nIHZhcmlvdXMgYmxvY2tzLFxuICAgIC8vIGluY2x1ZGluZyBkZWFkLWVuZHMgb3V0IG9mIHN0YWlyIGhhbGx3YXlzIC0gLi4uXG5cbiAgICBjb25zdCBkZWFkRW5kID0gdGhpcy5vcmlnLnJvbS5tZXRhc2NyZWVucy5nb2FXaWRlSGFsbE5TX2RlYWRFbmQ7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBtZXRhLndpZHRoOyB4KyspIHtcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgbWV0YS5oZWlnaHQ7IHkrKykge1xuICAgICAgICAvLyBjb25zdCBjID0gKChwb3MgPDwgOCB8IHBvcyA8PCA0KSAmIDB4ZjBmMCkgYXMgR3JpZENvb3JkO1xuICAgICAgICAvL2AgbGV0IHRpbGUgPSB0aGlzLmV4dHJhY3QoYS5ncmlkLCBjKTtcbiAgICAgICAgY29uc3QgYyA9ICh5IDw8IDEyIHwgeCA8PCA0IHwgMHg4MDgpIGFzIEdyaWRDb29yZDtcbiAgICAgICAgbGV0IGxlbiA9IDA7XG4gICAgICAgIHdoaWxlICh5ICsgbGVuIDwgbWV0YS5oZWlnaHQgJiZcbiAgICAgICAgICAgICAgIGEuZ3JpZC5nZXQoYyArIGxlbiAqIDB4MTAwMCBhcyBHcmlkQ29vcmQpID09PSAnSCcpIHtcbiAgICAgICAgICBsZW4rKztcbiAgICAgICAgfVxuICAgICAgICAvLyBhbHRlcm5hdGUgZGVhZCBlbmRzIGFuZCBzdGFpcnNcbiAgICAgICAgaWYgKCFsZW4pIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBvcHRzOiBBcnJheTxNYXA8UG9zLCBNZXRhc2NyZWVuPj4gPSBbbmV3IE1hcCgpLCBuZXcgTWFwKCldO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgb3B0c1tpICYgMV0uc2V0KCh5ICsgaSkgPDwgNCB8IHgsIGRlYWRFbmQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IG9wdCBvZiB0aGlzLnJhbmRvbS5pc2h1ZmZsZShvcHRzKSkge1xuICAgICAgICAgIGlmICghb3B0LnNpemUpIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXRoaXMuY2hlY2tNZXRhKG1ldGEsIG9wdCkpIGNvbnRpbnVlO1xuICAgICAgICAgIGZvciAoY29uc3QgW3Bvcywgc10gb2Ygb3B0KSB7XG4gICAgICAgICAgICBtZXRhLnNldChwb3MsIHMpO1xuICAgICAgICAgICAgYS5ncmlkLnNldChjICsgMHgxMDAwICogKChwb3MgPj4gNCkgLSB5KSBhcyBHcmlkQ29vcmQsICc9Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWZvdW5kKSByZXR1cm4ge29rOiBmYWxzZSwgZmFpbDogYGNvdWxkIG5vdCByZWN0aWZ5IGhhbGx3YXlgfTtcbiAgICAgICAgeSArPSBsZW47XG5cbi8vICAgICAgICAgaWYgKGEuZ3JpZC5nZXQoYykgPT09ICdIJykge1xuLy8gICAgICAgICAgIC8vIHRyeSB0byBzZXQgdG8gYSBkZWFkIGVuZC5cbi8vICAgICAgICAgaWYgKHRoaXMudHJ5TWV0YShtZXRhLCBwb3MsIFtkZWFkRW5kXSkpIHtcbi8vICAgICAgICAgICBhLmdyaWQuc2V0KGMsICc9Jyk7XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoYS5ncmlkLmdldChjIC0gMHgxMDAwIGFzIEdyaWRDb29yZCkgPT09ICdIJykge1xuLy8gLy9kZWJ1Z2dlcjtcbi8vICAgICAgICAgICByZXR1cm4ge29rOiBmYWxzZSwgZmFpbDogYGNvdWxkIG5vdCBicmVhayB1cCBzdGFpciBoYWxsc2B9O1xuLy8gICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBjb25zdCBibG9ja2VkID0gdGhpcy5vcmlnLnRpbGVzZXQud2l0aE1vZCh0aWxlLCAnYmxvY2snKTtcbiAgICAgIC8vIGlmIChibG9ja2VkLmxlbmd0aCAmJlxuICAgICAgLy8gICAgIHRoaXMudHJ5TWV0YShtZXRhLCBwb3MsIHRoaXMucmFuZG9tLnNodWZmbGUoYmxvY2tlZCkpKSB7XG4gICAgICAvLyAgIGNvbnRpbnVlO1xuICAgICAgLy8gfVxuICAgIH1cblxuICAgIC8vIFRPRE8gLSBjb252ZXJ0IGFkamFjZW50IHN0YWlycyB0byBkZWFkIGVuZHNcbiAgICByZXR1cm4gc3VwZXIucmVmaW5lTWV0YXNjcmVlbnMoYSwgbWV0YSk7XG4gIH1cblxuICBjaGVja01ldGEobWV0YTogTWV0YWxvY2F0aW9uLCByZXBsPzogTWFwPFBvcywgTWV0YXNjcmVlbj4pOiBib29sZWFuIHtcbiAgICBjb25zdCBvcHRzID0gcmVwbCA/IHt3aXRoOiByZXBsfSA6IHt9O1xuICAgIGNvbnN0IHBhcnRzID0gbWV0YS50cmF2ZXJzZShvcHRzKTtcbiAgICBjb25zdCBwYXJ0ID0gcGFydHMuZ2V0KHRoaXMuc3RhaXIpO1xuICAgIGlmIChwYXJ0ICE9PSBwYXJ0cy5nZXQodGhpcy5hcmVuYSkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBzdGFpciBub3QgY29ubmVjdGVkIHRvIGFyZW5hXFxuJHttZXRhLnNob3coKX1gKTtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgICByZXR1cm4gZmFsc2U7IC8ve29rOiBmYWxzZSwgZmFpbDogJ3N0YWlyIG5vdCBjb25uZWN0ZWQgdG8gYXJlbmEnfTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmVhY2hhYmxlID09IG51bGwpIHtcbiAgICAgIGlmIChwYXJ0ICYmIHBhcnQuc2l6ZSA8IHBhcnRzLnNpemUgKiAwLjk1KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGB0b28gc21hbGxgKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWFjaGFibGUgPSBwYXJ0Py5zaXplO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwYXJ0Py5zaXplISA+IHRoaXMucmVhY2hhYmxlICogMC45NSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTsvLyB7b2s6IGZhbHNlLCBmYWlsOiBgcmVmaW5lTWV0YTogY3V0IG9mZiB0b28gbXVjaGB9O1xuICAgIH0gICAgXG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZml4TGFieXJpbnRoU2NyZWVucyhyb206IFJvbSwgcmFuZG9tOiBSYW5kb20pIHtcbiAgLy8gVGhlcmUgYXJlIGZvdXIgdGlsZXNldHMgdGhhdCBhbGwgc2hhcmUgbG90cyBvZiBzY3JlZW5zLCBzbyBpdCdzIHRvdWdoXG4gIC8vIHRvIGZpbmQgYW4gZWxpZ2libGUgYWx0ZXJuYXRhYmxlIHRpbGUuICBJdCB0dXJucyBvdXQgdGhhdCAxOSBhbmQgMWIgYXJlXG4gIC8vIG5vdCB1c2VkIGluIGFueSBvZiB0aGUgcmVsZXZhbnQgc2NyZWVucyAoYWxsIGJ1dCBub3JtYWwgY2F2ZSkgZm9yXG4gIC8vIGFsdGVybmF0aW5nLCBzbyB3ZSBmcmVlIHVwIHRob3NlIHRpbGVzIGJ5IG1vdmluZyB0aGVtIGludG8gdmFyaW91c1xuICAvLyBmcmVlIHRpbGVzICgyYiBhbmQgYmEgaW4gcHlyYW1pZCBhbmQgZm9ydHJlc3MsIDE3IGFuZCAxOCBpbiBpY2UgY2F2ZVxuICAvLyBzaW5jZSB0aGlzIG9uZSBpcyB1c2VkIGZvciBzd2l0Y2hpbmcgdy8gNTQgYW5kIDU4KS5cblxuICAvLyBQTEFOOlxuICAvLyB0aWxlc2V0IGE0LDhjOiBtb3ZlIDE5LDFiIC0+IDJiLGJhXG4gIC8vIHRpbGVzZXQgYTg6ICAgIG1vdmUgMTksMWIgLT4gMTcsMThcbiAgLy8gdGlsZXNldCA4ODogICAgbW92ZSBjNSAtPiAxOSwxYlxuICAvLyAgICAgMTcsMTggdXNlZCBpbiA4OCwgd2hpY2ggc2hhcmVzIGEgbG90IHdpdGggYTgsIGJ1dFxuICAvLyAgICAgbm8gODggbWFwcyBoYXZlIGFueSAxOSwxYiBzbyB0aGV5J2xsIG5ldmVyIHNlZSBjb25mbGljdGluZyAxNywxOFxuICAvLyBjaGFuZ2UgdGhlIDg4IHVzZXJzIG9mIGUxLGUyIChoeWRyYSkgdG8gdGlsZXNldCBhOCB3aXRoIHBhdDE9MmEgdG8gYXZvaWRcbiAgLy8gY29uZmxpY3Q/ICB0aGUgY29zdCBpcyBvbmUgd2FsbCB0aGF0IGRvZXNuJ3QgZml0IGluIHF1aXRlIGFzIHdlbGwuXG4gIC8vIFRoaXMgZnJlZXMgdXAgMTksMWIgdG8gYWJzb3JiIGM2L2M0IHdpdGggYWx0cyBvZiBjNVxuICBjb25zdCB7bWV0YXRpbGVzZXRzOiB7Y2F2ZSwgcHlyYW1pZCwgbGFieXJpbnRoLCBpY2VDYXZlfX0gPSByb207XG4gIHJvbS5tZXRhc2NyZWVucy5yZWdpc3RlckZpeChTY3JlZW5GaXguTGFieXJpbnRoUGFyYXBldHMsIDEpO1xuICAvLyBGaXggdGhlIHRpbGVzXG4gIHtcbiAgICAvLyBGaXJzdCBwYXRjaCBhIGZldyBub25lc2Vuc2UgYWx0ZXJuYXRlcyB0byBnZXQgYXJvdW5kIG91ciBzYWZldHkgY2hlY2tcbiAgICAvLyBmb3IgKGNvbnN0IHRzIG9mIFtweXJhbWlkLCBsYWJ5cmludGgsIGljZUNhdmVdKSB7XG4gICAgLy8gICB0cy50aWxlc2V0LmFsdGVybmF0ZXNbMHgxOV0gPSAweDE5O1xuICAgIC8vICAgdHMudGlsZXNldC5hbHRlcm5hdGVzWzB4MWJdID0gMHgxYjtcbiAgICAvLyB9XG4gICAgLy8gRnJlZSB1cCAxOSBhbmQgMWIgaW4gdGhlIHRpbGVzZXRzIHRoYXQgbmVlZCBpdC5cbiAgICBmb3IgKGNvbnN0IHRzIG9mIFtsYWJ5cmludGgsIHB5cmFtaWRdKSB7XG4gICAgICB0cy5nZXRUaWxlKDB4MmIpLmNvcHlGcm9tKDB4MTkpLnJlcGxhY2VJbiguLi50cyk7XG4gICAgICB0cy5nZXRUaWxlKDB4YmEpLmNvcHlGcm9tKDB4MWIpLnJlcGxhY2VJbiguLi50cyk7XG4gICAgfVxuICAgIGljZUNhdmUuZ2V0VGlsZSgweDE3KS5jb3B5RnJvbSgweDE5KS5yZXBsYWNlSW4oLi4uaWNlQ2F2ZSk7XG4gICAgaWNlQ2F2ZS5nZXRUaWxlKDB4MTgpLmNvcHlGcm9tKDB4MWIpLnJlcGxhY2VJbiguLi5pY2VDYXZlKTtcbiAgICAvLyBGaWxsIGluIGM1J3MgZ3JhcGhpY3MgZm9yIG9yZGluYXJ5IGNhdmVzIHRvIGNsZWFuIHVwIGdyYXBoaWNhbCBnbGl0Y2hlc1xuICAgIGZvciAoY29uc3QgdHMgb2YgW2NhdmUsIHB5cmFtaWRdKSB7XG4gICAgICB0cy5nZXRUaWxlKDB4MTkpLmNvcHlGcm9tKDB4YzUpO1xuICAgICAgdHMuZ2V0VGlsZSgweDFiKS5jb3B5RnJvbSgweGM1KTtcbiAgICB9XG5cbiAgICAvLyBOb3cgdGhhdCBzcGFjZSBoYXMgYmVlbiBhbGxvY2F0ZWQsIGZpbGwgaXQuXG4gICAgbGFieXJpbnRoLmdldFRpbGUoMHgxOSkuY29weUZyb20oMHhjNikuc2V0QWx0ZXJuYXRpdmUoMHhjNSk7XG4gICAgbGFieXJpbnRoLmdldFRpbGUoMHgxYikuY29weUZyb20oMHhjNCkuc2V0QWx0ZXJuYXRpdmUoMHhjNSk7XG4gIH1cbiAgLy8gRml4IHRoZSBzY3JlZW5zXG4gIGNvbnN0IGJ5U2lkID0gbmV3IERlZmF1bHRNYXA8bnVtYmVyLCBNZXRhc2NyZWVuW10+KCgpID0+IFtdKTtcbiAgZm9yIChjb25zdCBzIG9mIHJvbS5tZXRhdGlsZXNldHMubGFieXJpbnRoKSB7XG4gICAgYnlTaWQuZ2V0KHMuc2lkKS5wdXNoKHMpO1xuICB9XG4gIGZvciAoY29uc3QgW3NpZCwgc2NyZWVuc10gb2YgYnlTaWQpIHtcbiAgICAvLyBGaXJzdCBzZWUgaWYgdGhlIGRlZmF1bHQgc2NyZWVuIGhhcyBhIHdhbGwgdGhhdCBtYXkgYmUgcmVtb3ZlZFxuICAgIGNvbnN0IHNjcmVlbiA9IHJvbS5zY3JlZW5zW3NpZF07XG4gICAgY29uc3QgcmVtb3ZlID0gc2NyZWVucy5tYXAocyA9PiBzLmRhdGEudGlsZXNldHMubGFieXJpbnRoPy5yZW1vdmVXYWxsKTtcbiAgICBjb25zdCBbcmVtb3ZlZCwgLi4ucmVzdF0gPSBuZXcgU2V0KHJlbW92ZS5maWx0ZXIodyA9PiB3ICE9IG51bGwpKTtcbiAgICBpZiAocmVtb3ZlZCAhPSBudWxsKSB7XG4gICAgICBzY3JlZW4uc2V0MmQocmVtb3ZlZCwgW1sweGM1LCAweGM1XSwgWzB4ZDAsIDB4YzVdXSk7XG4gICAgICBpZiAocmVzdC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihgYmFkIHJlbW92ZWApO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW1vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJlbW92ZVtpXSA9PSBudWxsKSB7XG4gICAgICAgICAgc2NyZWVuc1tpXS5kYXRhLnRpbGVzZXRzLmxhYnlyaW50aCEuYWRkV2FsbCA9IFtyZW1vdmVkXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2NyZWVucy5sZW5ndGggPCAyKSBjb250aW51ZTtcbiAgICAvLyBOb3cgaWYgdGhlcmUncyB0d28gd2l0aCBhZGRzLCBwaWNrIG9uZSB0byBkZWxldGUuXG4gICAgaWYgKHNjcmVlbnMubGVuZ3RoID4gMikge1xuICAgICAgY29uc3QgZGVsZXRlZCA9XG4gICAgICAgICAgcmFuZG9tLnBpY2soc2NyZWVucy5maWx0ZXIocyA9PiBzLmRhdGEudGlsZXNldHMubGFieXJpbnRoPy5hZGRXYWxsKSk7XG4gICAgICBzY3JlZW5zLnNwbGljZShzY3JlZW5zLmluZGV4T2YoZGVsZXRlZCksIDEpO1xuICAgICAgZGVsZXRlZC5yZW1vdmUoKTtcbiAgICB9XG4gICAgLy8gRmlndXJlIG91dCB3aGljaCBzY3JlZW4gbmVlZHMgdG8gZ2V0IGEgd2FsbCBhZGRlZC5cbiAgICBmb3IgKGNvbnN0IHMgb2Ygc2NyZWVucykge1xuICAgICAgY29uc3QgYWRkID0gcy5kYXRhLnRpbGVzZXRzLmxhYnlyaW50aD8uYWRkV2FsbDtcbiAgICAgIGlmIChhZGQgIT0gbnVsbCkge1xuICAgICAgICBzLmRhdGEubW9kID0gJ2Jsb2NrJztcbiAgICAgICAgZm9yIChjb25zdCB3IG9mIGFkZCkgc2NyZWVuLnNldDJkKHcsIFtbMHgxOSwgMHgxOV0sIFsweDFiLCAweDFiXV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcy5mbGFnID0gJ2Fsd2F5cyc7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=