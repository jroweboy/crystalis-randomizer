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
        for (const ts of [iceCave, cave, pyramid]) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL21hemUvZ29hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBc0IsV0FBVyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQzVELE9BQU8sRUFBVSxFQUFFLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFHdkMsT0FBTyxFQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNsRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQVF4QyxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsV0FBVztJQU8vQyxXQUFXLENBQUMsQ0FBSTtRQUNkLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sS0FBSyxHQUNQLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBYyxDQUFDO1FBQzNFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXRCLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQWMsQ0FBQztRQUNuRSxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElB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Q0FBQzthQUNwRTtpQkFBTTtnQkFDTCxDQUFDLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQzthQUNuQjtTQUNGO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2F2ZVNodWZmbGVBdHRlbXB0LCBDYXZlU2h1ZmZsZSB9IGZyb20gJy4vY2F2ZS5qcyc7XG5pbXBvcnQgeyBSZXN1bHQsIE9LIH0gZnJvbSAnLi9tYXplLmpzJztcbmltcG9ydCB7IFJvbSB9IGZyb20gJy4uL3JvbS5qcyc7XG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICcuLi9yYW5kb20uanMnO1xuaW1wb3J0IHsgR3JpZENvb3JkLCBFLCBOLCBTLCBXIH0gZnJvbSAnLi9ncmlkLmpzJztcbmltcG9ydCB7IFNjcmVlbkZpeCB9IGZyb20gJy4uL3JvbS9zY3JlZW5maXguanMnO1xuaW1wb3J0IHsgRGVmYXVsdE1hcCB9IGZyb20gJy4uL3V0aWwuanMnO1xuaW1wb3J0IHsgTWV0YXNjcmVlbiB9IGZyb20gJy4uL3JvbS9tZXRhc2NyZWVuLmpzJztcbmltcG9ydCB7IE1ldGFsb2NhdGlvbiwgUG9zIH0gZnJvbSAnLi4vcm9tL21ldGFsb2NhdGlvbi5qcyc7XG5cbnR5cGUgQSA9IENhdmVTaHVmZmxlQXR0ZW1wdDtcblxuLy8gVE9ETyAtIG5lZWRzIG1vcmUgbG9vcHMuLi5cblxuZXhwb3J0IGNsYXNzIExhYnlyaW50aFNodWZmbGUgZXh0ZW5kcyBDYXZlU2h1ZmZsZSB7XG5cbiAgLy8gbWV0YS50cmF2ZXJzZSBwb3NpdGlvbnMgZm9yIGltcG9ydGFudCBmZWF0dXJlcy5cbiAgc3RhaXIhOiBudW1iZXI7XG4gIGFyZW5hITogbnVtYmVyO1xuICByZWFjaGFibGU/OiBudW1iZXI7XG5cbiAgaW5pdGlhbEZpbGwoYTogQSk6IFJlc3VsdDx2b2lkPiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gYS5zaXplICsgMzsgLy8gKyB0aGlzLnJhbmRvbS5uZXh0SW50KDQpO1xuICAgIGNvbnN0IHN0YWlyID1cbiAgICAgICAgKHRoaXMucmFuZG9tLm5leHRJbnQoYS53KSA8PCA0IHwgKGEuaCAtIDEpIDw8IDEyIHwgMHg4MDgpIGFzIEdyaWRDb29yZDtcbiAgICBpZiAoIWEuZ3JpZC5pc0JvcmRlcihXKHN0YWlyKSkpIGEuZml4ZWQuYWRkKFcoc3RhaXIsIDIpKTtcbiAgICBpZiAoIWEuZ3JpZC5pc0JvcmRlcihFKHN0YWlyKSkpIGEuZml4ZWQuYWRkKEUoc3RhaXIsIDIpKTtcbiAgICBhLmdyaWQuc2V0KHN0YWlyLCAnPicpO1xuICAgIGEuZml4ZWQuYWRkKHN0YWlyKTtcbiAgICBhLmdyaWQuc2V0KE4oc3RhaXIpLCAndycpO1xuICAgIGEuZml4ZWQuYWRkKE4oc3RhaXIpKTtcbiAgICBhLmZpeGVkLmFkZChXKHN0YWlyKSk7XG4gICAgYS5maXhlZC5hZGQoRShzdGFpcikpO1xuXG4gICAgY29uc3QgYXJlbmEgPSAodGhpcy5yYW5kb20ubmV4dEludChhLncpIDw8IDQgfCAweDgwOCkgYXMgR3JpZENvb3JkO1xuICAgIGNvbnN0IGRvd24gPSBTKGFyZW5hLCAyKTtcbiAgICBhLmdyaWQuc2V0KGFyZW5hLCAnPCcpO1xuICAgIGEuZml4ZWQuYWRkKGFyZW5hKTtcbiAgICBhLmdyaWQuc2V0KFMoYXJlbmEpLCAndycpO1xuICAgIGEuZml4ZWQuYWRkKFMoYXJlbmEpKTtcbiAgICBhLmdyaWQuc2V0KGRvd24sICd3Jyk7XG4gICAgYS5maXhlZC5hZGQoZG93bik7XG4gICAgYS5ncmlkLnNldChTKGRvd24pLCAndycpO1xuICAgIGEuZml4ZWQuYWRkKFMoZG93bikpO1xuICAgIGEuZml4ZWQuYWRkKFcoZG93bikpO1xuICAgIGEuZml4ZWQuYWRkKEUoZG93bikpO1xuXG4gICAgLy8gVE9ETyAtIGNhbiBzdGFpciBiZSBub3Qgb24gYm90dG9tPyAgYXJlbmEgbm90IG9uIHRvcD9cblxuICAgIGlmICghdGhpcy50cnlDb25uZWN0KGEsIE4oc3RhaXIsIDIpLCBTKGRvd24sIDIpLCAndycsIDEwKSkge1xuICAgICAgcmV0dXJuIHtvazogZmFsc2UsIGZhaWw6IGBpbml0aWFsIGNvbm5lY3RgfTtcbiAgICB9XG4gICAgd2hpbGUgKGEuY291bnQgPCB0YXJnZXQpIHtcbiAgICAgIGlmICghdGhpcy50cnlBZGRMb29wKGEsICd3JywgMTApKSByZXR1cm4ge29rOiBmYWxzZSwgZmFpbDogYGFkZCBsb29wc2B9O1xuICAgIH1cbiAgICByZXR1cm4gT0s7XG4gIH1cblxuICByZWZpbmUoKSB7IHJldHVybiBPSzsgfVxuICByZWZpbmVFZGdlcygpIHsgcmV0dXJuIHRydWU7IH1cbiAgYWRkQXJlbmFzKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICBhZGRTdGFpcnMoKSB7IHJldHVybiBPSzsgfVxuXG4gIHJlZmluZU1ldGFzY3JlZW5zKGE6IEEsIG1ldGE6IE1ldGFsb2NhdGlvbik6IFJlc3VsdDx2b2lkPiB7XG5jb25zb2xlLmxvZyhtZXRhLnNob3coKSk7XG4gICAgLy8gMS4gcmVwbGFjZSBhbGwgdGhlIChub24tZml4ZWQpIHdpZGVIYWxsTlMgd2l0aCBlaXRoZXIgc3RhaXJzIG9yIHBhaXJzXG4gICAgLy8gICAgb2YgZGVhZCBlbmRzIC0gbm8gc2FtZSB2ZXJ0aWNhbCBuZWlnaGJvcnNcbiAgICAvLyAyLiBzdGFydCBhZGRpbmcgYmxvY2tzXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBtZXRhLmhlaWdodDsgeSsrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG1ldGEud2lkdGg7IHgrKykge1xuICAgICAgICBjb25zdCBwb3MgPSB5IDw8IDQgfCB4O1xuICAgICAgICBjb25zdCBzY3IgPSBtZXRhLmdldChwb3MpO1xuICAgICAgICBjb25zdCBlZGdlID0gc2NyLmVkZ2VJbmRleCgndycpO1xuICAgICAgICBpZiAoc2NyLmhhc0ZlYXR1cmUoJ2FyZW5hJykpIHtcbiAgICAgICAgICB0aGlzLmFyZW5hID0gcG9zICsgMHgxMCA8PCA4IHwgMTtcbiAgICAgICAgfSBlbHNlIGlmIChlZGdlID09PSA1KSB7XG4gICAgICAgICAgaWYgKHBvcyA8IDE2IHx8ICFtZXRhLmdldChwb3MgLSAxNikuaGFzRmVhdHVyZSgnYXJlbmEnKSkge1xuICAgICAgICAgICAgbWV0YS5zZXQocG9zLCBtZXRhLnJvbS5tZXRhc2NyZWVucy5nb2FXaWRlSGFsbE5TX3N0YWlycyk7XG4gICAgICAgICAgICBjb25zdCBjID0gKChwb3MgPDwgOCB8IHBvcyA8PCA0KSAmIDB4ZjBmMCB8IDB4ODA4KSBhcyBHcmlkQ29vcmQ7XG4gICAgICAgICAgICBhLmdyaWQuc2V0KGMsICdIJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGVkZ2UgPT09IDEpIHtcbiAgICAgICAgICB0aGlzLnN0YWlyID0gcG9zIDw8IDggfCAyO1xuICAgICAgICAvLyB9IGVsc2UgaWYgKHNjci5oYXNGZWF0dXJlKCdhcmVuYScpKSB7XG4gICAgICAgIC8vICAgbWV0YS5zZXQocG9zLCBtZXRhLnJvbS5tZXRhc2NyZWVucy5nb2FXaWRlSGFsbE5TX3N0YWlycyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIGV2ZXJ5dGhpbmcgaXMgYWNjZXNzaWJsZVxuICAgIHRoaXMucmVhY2hhYmxlID0gdW5kZWZpbmVkO1xuICAgIGlmICghdGhpcy5jaGVja01ldGEobWV0YSkpIHJldHVybiB7b2s6IGZhbHNlLCBmYWlsOiBgaW5pdGlhbCBtZXRhIGNoZWNrYH07XG5jb25zb2xlLmxvZyhtZXRhLnNob3coKSk7XG4gICAgLy8gTm93IHRoYXQgYSBiYXNlbGluZSBoYXMgYmVlbiBlc3RhYmxpc2hlZCwgdHJ5IGFkZGluZyB2YXJpb3VzIGJsb2NrcyxcbiAgICAvLyBpbmNsdWRpbmcgZGVhZC1lbmRzIG91dCBvZiBzdGFpciBoYWxsd2F5cyAtIC4uLlxuXG4gICAgY29uc3QgZGVhZEVuZCA9IHRoaXMub3JpZy5yb20ubWV0YXNjcmVlbnMuZ29hV2lkZUhhbGxOU19kZWFkRW5kO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgbWV0YS53aWR0aDsgeCsrKSB7XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG1ldGEuaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgLy8gY29uc3QgYyA9ICgocG9zIDw8IDggfCBwb3MgPDwgNCkgJiAweGYwZjApIGFzIEdyaWRDb29yZDtcbiAgICAgICAgLy9gIGxldCB0aWxlID0gdGhpcy5leHRyYWN0KGEuZ3JpZCwgYyk7XG4gICAgICAgIGNvbnN0IGMgPSAoeSA8PCAxMiB8IHggPDwgNCB8IDB4ODA4KSBhcyBHcmlkQ29vcmQ7XG4gICAgICAgIGxldCBsZW4gPSAwO1xuICAgICAgICB3aGlsZSAoeSArIGxlbiA8IG1ldGEuaGVpZ2h0ICYmXG4gICAgICAgICAgICAgICBhLmdyaWQuZ2V0KGMgKyBsZW4gKiAweDEwMDAgYXMgR3JpZENvb3JkKSA9PT0gJ0gnKSB7XG4gICAgICAgICAgbGVuKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWx0ZXJuYXRlIGRlYWQgZW5kcyBhbmQgc3RhaXJzXG4gICAgICAgIGlmICghbGVuKSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgb3B0czogQXJyYXk8TWFwPFBvcywgTWV0YXNjcmVlbj4+ID0gW25ldyBNYXAoKSwgbmV3IE1hcCgpXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIG9wdHNbaSAmIDFdLnNldCgoeSArIGkpIDw8IDQgfCB4LCBkZWFkRW5kKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBvcHQgb2YgdGhpcy5yYW5kb20uaXNodWZmbGUob3B0cykpIHtcbiAgICAgICAgICBpZiAoIW9wdC5zaXplKSB7XG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCF0aGlzLmNoZWNrTWV0YShtZXRhLCBvcHQpKSBjb250aW51ZTtcbiAgICAgICAgICBmb3IgKGNvbnN0IFtwb3MsIHNdIG9mIG9wdCkge1xuICAgICAgICAgICAgbWV0YS5zZXQocG9zLCBzKTtcbiAgICAgICAgICAgIGEuZ3JpZC5zZXQoYyArIDB4MTAwMCAqICgocG9zID4+IDQpIC0geSkgYXMgR3JpZENvb3JkLCAnPScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmb3VuZCkgcmV0dXJuIHtvazogZmFsc2UsIGZhaWw6IGBjb3VsZCBub3QgcmVjdGlmeSBoYWxsd2F5YH07XG4gICAgICAgIHkgKz0gbGVuO1xuXG4vLyAgICAgICAgIGlmIChhLmdyaWQuZ2V0KGMpID09PSAnSCcpIHtcbi8vICAgICAgICAgICAvLyB0cnkgdG8gc2V0IHRvIGEgZGVhZCBlbmQuXG4vLyAgICAgICAgIGlmICh0aGlzLnRyeU1ldGEobWV0YSwgcG9zLCBbZGVhZEVuZF0pKSB7XG4vLyAgICAgICAgICAgYS5ncmlkLnNldChjLCAnPScpO1xuLy8gICAgICAgICB9IGVsc2UgaWYgKGEuZ3JpZC5nZXQoYyAtIDB4MTAwMCBhcyBHcmlkQ29vcmQpID09PSAnSCcpIHtcbi8vIC8vZGVidWdnZXI7XG4vLyAgICAgICAgICAgcmV0dXJuIHtvazogZmFsc2UsIGZhaWw6IGBjb3VsZCBub3QgYnJlYWsgdXAgc3RhaXIgaGFsbHNgfTtcbi8vICAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gY29uc3QgYmxvY2tlZCA9IHRoaXMub3JpZy50aWxlc2V0LndpdGhNb2QodGlsZSwgJ2Jsb2NrJyk7XG4gICAgICAvLyBpZiAoYmxvY2tlZC5sZW5ndGggJiZcbiAgICAgIC8vICAgICB0aGlzLnRyeU1ldGEobWV0YSwgcG9zLCB0aGlzLnJhbmRvbS5zaHVmZmxlKGJsb2NrZWQpKSkge1xuICAgICAgLy8gICBjb250aW51ZTtcbiAgICAgIC8vIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIC0gY29udmVydCBhZGphY2VudCBzdGFpcnMgdG8gZGVhZCBlbmRzXG4gICAgcmV0dXJuIHN1cGVyLnJlZmluZU1ldGFzY3JlZW5zKGEsIG1ldGEpO1xuICB9XG5cbiAgY2hlY2tNZXRhKG1ldGE6IE1ldGFsb2NhdGlvbiwgcmVwbD86IE1hcDxQb3MsIE1ldGFzY3JlZW4+KTogYm9vbGVhbiB7XG4gICAgY29uc3Qgb3B0cyA9IHJlcGwgPyB7d2l0aDogcmVwbH0gOiB7fTtcbiAgICBjb25zdCBwYXJ0cyA9IG1ldGEudHJhdmVyc2Uob3B0cyk7XG4gICAgY29uc3QgcGFydCA9IHBhcnRzLmdldCh0aGlzLnN0YWlyKTtcbiAgICBpZiAocGFydCAhPT0gcGFydHMuZ2V0KHRoaXMuYXJlbmEpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgc3RhaXIgbm90IGNvbm5lY3RlZCB0byBhcmVuYVxcbiR7bWV0YS5zaG93KCl9YCk7XG4gICAgICAvL2RlYnVnZ2VyO1xuICAgICAgcmV0dXJuIGZhbHNlOyAvL3tvazogZmFsc2UsIGZhaWw6ICdzdGFpciBub3QgY29ubmVjdGVkIHRvIGFyZW5hJ307XG4gICAgfVxuICAgIGlmICh0aGlzLnJlYWNoYWJsZSA9PSBudWxsKSB7XG4gICAgICBpZiAocGFydCAmJiBwYXJ0LnNpemUgPCBwYXJ0cy5zaXplICogMC45NSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgdG9vIHNtYWxsYCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVhY2hhYmxlID0gcGFydD8uc2l6ZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocGFydD8uc2l6ZSEgPiB0aGlzLnJlYWNoYWJsZSAqIDAuOTUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7Ly8ge29rOiBmYWxzZSwgZmFpbDogYHJlZmluZU1ldGE6IGN1dCBvZmYgdG9vIG11Y2hgfTtcbiAgICB9ICAgIFxuICB9XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpeExhYnlyaW50aFNjcmVlbnMocm9tOiBSb20sIHJhbmRvbTogUmFuZG9tKSB7XG4gIC8vIFRoZXJlIGFyZSBmb3VyIHRpbGVzZXRzIHRoYXQgYWxsIHNoYXJlIGxvdHMgb2Ygc2NyZWVucywgc28gaXQncyB0b3VnaFxuICAvLyB0byBmaW5kIGFuIGVsaWdpYmxlIGFsdGVybmF0YWJsZSB0aWxlLiAgSXQgdHVybnMgb3V0IHRoYXQgMTkgYW5kIDFiIGFyZVxuICAvLyBub3QgdXNlZCBpbiBhbnkgb2YgdGhlIHJlbGV2YW50IHNjcmVlbnMgKGFsbCBidXQgbm9ybWFsIGNhdmUpIGZvclxuICAvLyBhbHRlcm5hdGluZywgc28gd2UgZnJlZSB1cCB0aG9zZSB0aWxlcyBieSBtb3ZpbmcgdGhlbSBpbnRvIHZhcmlvdXNcbiAgLy8gZnJlZSB0aWxlcyAoMmIgYW5kIGJhIGluIHB5cmFtaWQgYW5kIGZvcnRyZXNzLCAxNyBhbmQgMTggaW4gaWNlIGNhdmVcbiAgLy8gc2luY2UgdGhpcyBvbmUgaXMgdXNlZCBmb3Igc3dpdGNoaW5nIHcvIDU0IGFuZCA1OCkuXG5cbiAgLy8gUExBTjpcbiAgLy8gdGlsZXNldCBhNCw4YzogbW92ZSAxOSwxYiAtPiAyYixiYVxuICAvLyB0aWxlc2V0IGE4OiAgICBtb3ZlIDE5LDFiIC0+IDE3LDE4XG4gIC8vIHRpbGVzZXQgODg6ICAgIG1vdmUgYzUgLT4gMTksMWJcbiAgLy8gICAgIDE3LDE4IHVzZWQgaW4gODgsIHdoaWNoIHNoYXJlcyBhIGxvdCB3aXRoIGE4LCBidXRcbiAgLy8gICAgIG5vIDg4IG1hcHMgaGF2ZSBhbnkgMTksMWIgc28gdGhleSdsbCBuZXZlciBzZWUgY29uZmxpY3RpbmcgMTcsMThcbiAgLy8gY2hhbmdlIHRoZSA4OCB1c2VycyBvZiBlMSxlMiAoaHlkcmEpIHRvIHRpbGVzZXQgYTggd2l0aCBwYXQxPTJhIHRvIGF2b2lkXG4gIC8vIGNvbmZsaWN0PyAgdGhlIGNvc3QgaXMgb25lIHdhbGwgdGhhdCBkb2Vzbid0IGZpdCBpbiBxdWl0ZSBhcyB3ZWxsLlxuICAvLyBUaGlzIGZyZWVzIHVwIDE5LDFiIHRvIGFic29yYiBjNi9jNCB3aXRoIGFsdHMgb2YgYzVcbiAgY29uc3Qge21ldGF0aWxlc2V0czoge2NhdmUsIHB5cmFtaWQsIGxhYnlyaW50aCwgaWNlQ2F2ZX19ID0gcm9tO1xuICByb20ubWV0YXNjcmVlbnMucmVnaXN0ZXJGaXgoU2NyZWVuRml4LkxhYnlyaW50aFBhcmFwZXRzLCAxKTtcbiAgLy8gRml4IHRoZSB0aWxlc1xuICB7XG4gICAgLy8gRmlyc3QgcGF0Y2ggYSBmZXcgbm9uZXNlbnNlIGFsdGVybmF0ZXMgdG8gZ2V0IGFyb3VuZCBvdXIgc2FmZXR5IGNoZWNrXG4gICAgLy8gZm9yIChjb25zdCB0cyBvZiBbcHlyYW1pZCwgbGFieXJpbnRoLCBpY2VDYXZlXSkge1xuICAgIC8vICAgdHMudGlsZXNldC5hbHRlcm5hdGVzWzB4MTldID0gMHgxOTtcbiAgICAvLyAgIHRzLnRpbGVzZXQuYWx0ZXJuYXRlc1sweDFiXSA9IDB4MWI7XG4gICAgLy8gfVxuICAgIC8vIEZyZWUgdXAgMTkgYW5kIDFiIGluIHRoZSB0aWxlc2V0cyB0aGF0IG5lZWQgaXQuXG4gICAgZm9yIChjb25zdCB0cyBvZiBbbGFieXJpbnRoLCBweXJhbWlkXSkge1xuICAgICAgdHMuZ2V0VGlsZSgweDJiKS5jb3B5RnJvbSgweDE5KS5yZXBsYWNlSW4oLi4udHMpO1xuICAgICAgdHMuZ2V0VGlsZSgweGJhKS5jb3B5RnJvbSgweDFiKS5yZXBsYWNlSW4oLi4udHMpO1xuICAgIH1cbiAgICBpY2VDYXZlLmdldFRpbGUoMHgxNykuY29weUZyb20oMHgxOSkucmVwbGFjZUluKC4uLmljZUNhdmUpO1xuICAgIGljZUNhdmUuZ2V0VGlsZSgweDE4KS5jb3B5RnJvbSgweDFiKS5yZXBsYWNlSW4oLi4uaWNlQ2F2ZSk7XG4gICAgLy8gRmlsbCBpbiBjNSdzIGdyYXBoaWNzIGZvciBvcmRpbmFyeSBjYXZlcyB0byBjbGVhbiB1cCBncmFwaGljYWwgZ2xpdGNoZXNcbiAgICBmb3IgKGNvbnN0IHRzIG9mIFtpY2VDYXZlLCBjYXZlLCBweXJhbWlkXSkge1xuICAgICAgdHMuZ2V0VGlsZSgweDE5KS5jb3B5RnJvbSgweGM1KTtcbiAgICAgIHRzLmdldFRpbGUoMHgxYikuY29weUZyb20oMHhjNSk7XG4gICAgfVxuXG4gICAgLy8gTm93IHRoYXQgc3BhY2UgaGFzIGJlZW4gYWxsb2NhdGVkLCBmaWxsIGl0LlxuICAgIGxhYnlyaW50aC5nZXRUaWxlKDB4MTkpLmNvcHlGcm9tKDB4YzYpLnNldEFsdGVybmF0aXZlKDB4YzUpO1xuICAgIGxhYnlyaW50aC5nZXRUaWxlKDB4MWIpLmNvcHlGcm9tKDB4YzQpLnNldEFsdGVybmF0aXZlKDB4YzUpO1xuICB9XG4gIC8vIEZpeCB0aGUgc2NyZWVuc1xuICBjb25zdCBieVNpZCA9IG5ldyBEZWZhdWx0TWFwPG51bWJlciwgTWV0YXNjcmVlbltdPigoKSA9PiBbXSk7XG4gIGZvciAoY29uc3QgcyBvZiByb20ubWV0YXRpbGVzZXRzLmxhYnlyaW50aCkge1xuICAgIGJ5U2lkLmdldChzLnNpZCkucHVzaChzKTtcbiAgfVxuICBmb3IgKGNvbnN0IFtzaWQsIHNjcmVlbnNdIG9mIGJ5U2lkKSB7XG4gICAgLy8gRmlyc3Qgc2VlIGlmIHRoZSBkZWZhdWx0IHNjcmVlbiBoYXMgYSB3YWxsIHRoYXQgbWF5IGJlIHJlbW92ZWRcbiAgICBjb25zdCBzY3JlZW4gPSByb20uc2NyZWVuc1tzaWRdO1xuICAgIGNvbnN0IHJlbW92ZSA9IHNjcmVlbnMubWFwKHMgPT4gcy5kYXRhLnRpbGVzZXRzLmxhYnlyaW50aD8ucmVtb3ZlV2FsbCk7XG4gICAgY29uc3QgW3JlbW92ZWQsIC4uLnJlc3RdID0gbmV3IFNldChyZW1vdmUuZmlsdGVyKHcgPT4gdyAhPSBudWxsKSk7XG4gICAgaWYgKHJlbW92ZWQgIT0gbnVsbCkge1xuICAgICAgc2NyZWVuLnNldDJkKHJlbW92ZWQsIFtbMHhjNSwgMHhjNV0sIFsweGQwLCAweGM1XV0pO1xuICAgICAgaWYgKHJlc3QubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYGJhZCByZW1vdmVgKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtb3ZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyZW1vdmVbaV0gPT0gbnVsbCkge1xuICAgICAgICAgIHNjcmVlbnNbaV0uZGF0YS50aWxlc2V0cy5sYWJ5cmludGghLmFkZFdhbGwgPSBbcmVtb3ZlZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNjcmVlbnMubGVuZ3RoIDwgMikgY29udGludWU7XG4gICAgLy8gTm93IGlmIHRoZXJlJ3MgdHdvIHdpdGggYWRkcywgcGljayBvbmUgdG8gZGVsZXRlLlxuICAgIGlmIChzY3JlZW5zLmxlbmd0aCA+IDIpIHtcbiAgICAgIGNvbnN0IGRlbGV0ZWQgPVxuICAgICAgICAgIHJhbmRvbS5waWNrKHNjcmVlbnMuZmlsdGVyKHMgPT4gcy5kYXRhLnRpbGVzZXRzLmxhYnlyaW50aD8uYWRkV2FsbCkpO1xuICAgICAgc2NyZWVucy5zcGxpY2Uoc2NyZWVucy5pbmRleE9mKGRlbGV0ZWQpLCAxKTtcbiAgICAgIGRlbGV0ZWQucmVtb3ZlKCk7XG4gICAgfVxuICAgIC8vIEZpZ3VyZSBvdXQgd2hpY2ggc2NyZWVuIG5lZWRzIHRvIGdldCBhIHdhbGwgYWRkZWQuXG4gICAgZm9yIChjb25zdCBzIG9mIHNjcmVlbnMpIHtcbiAgICAgIGNvbnN0IGFkZCA9IHMuZGF0YS50aWxlc2V0cy5sYWJ5cmludGg/LmFkZFdhbGw7XG4gICAgICBpZiAoYWRkICE9IG51bGwpIHtcbiAgICAgICAgcy5kYXRhLm1vZCA9ICdibG9jayc7XG4gICAgICAgIGZvciAoY29uc3QgdyBvZiBhZGQpIHNjcmVlbi5zZXQyZCh3LCBbWzB4MTksIDB4MTldLCBbMHgxYiwgMHgxYl1dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMuZmxhZyA9ICdhbHdheXMnO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19