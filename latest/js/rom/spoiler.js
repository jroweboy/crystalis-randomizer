export class Spoiler {
    constructor(rom) {
        this.rom = rom;
        this.slots = [];
        this.route = [];
        this.mazes = [];
        this.trades = [];
        this.walls = [];
        this.unidentifiedItems = [];
        this.wildWarps = [];
        this.flags = '';
    }
    addCheck(condition, deps) {
        this.route.push(new Check(this, condition, deps));
    }
    addSlot(slot, slotName, item) {
        this.slots[slot & 0xff] =
            new Slot(this.rom, slot & 0xff, slotName, item & 0xff);
    }
    addMaze(id, name, maze) {
        this.mazes.push({ id, name, maze });
    }
    addTrade(itemId, item, npc) {
        this.trades.push({ itemId, item, npc });
    }
    addUnidentifiedItem(itemId, oldName, newName) {
        this.unidentifiedItems.push({ itemId, oldName, newName });
    }
    addWall(location, oldElement, newElement) {
        this.walls.push({ location, oldElement, newElement });
    }
    addWildWarp(id, name) {
        this.wildWarps.push({ id, name });
    }
    formatCondition(id) {
        var _a;
        return (_a = this.rom.flags[id]) === null || _a === void 0 ? void 0 : _a.name;
    }
    formatConditionList(conditions) {
        const terms = [];
        for (const c of conditions) {
            const f = this.rom.flags[c];
            if (f === null || f === void 0 ? void 0 : f.logic.track)
                terms.push(f.name);
        }
        return terms.join(', ');
    }
}
class Check {
    constructor(spoiler, condition, deps) {
        this.spoiler = spoiler;
        this.condition = condition;
        this.deps = deps;
    }
    toString() {
        let item = 0;
        if ((this.condition & ~0x7f) === 0x100) {
            item = 0x200 | this.spoiler.rom.slots[this.condition & 0xff];
        }
        return `${this.spoiler.formatCondition(this.condition)}${item ? ` (${this.spoiler.formatCondition(item)})` : ''}: [${this.spoiler.formatConditionList(this.deps)}]`;
    }
}
class Slot {
    constructor(rom, slot, slotName, item) {
        this.slot = slot;
        this.slotName = slotName;
        this.item = item;
        this.itemName = slotToItem(rom, item);
        this.originalItem = slotToItem(rom, slot);
    }
    toString() {
        return `${this.itemName}: ${this.slotName} (${this.originalItem})`;
    }
}
function slotToItem(rom, slot) {
    if (slot >= 0x70)
        return 'Mimic';
    return rom.items[rom.itemGets[slot].itemId].messageName;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BvaWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9qcy9yb20vc3BvaWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFXQSxNQUFNLE9BQU8sT0FBTztJQVlsQixZQUFxQixHQUFRO1FBQVIsUUFBRyxHQUFILEdBQUcsQ0FBSztRQVhwQixVQUFLLEdBQVcsRUFBRSxDQUFDO1FBQ25CLFVBQUssR0FBWSxFQUFFLENBQUM7UUFDcEIsVUFBSyxHQUFXLEVBQUUsQ0FBQztRQUNuQixXQUFNLEdBQVksRUFBRSxDQUFDO1FBQ3JCLFVBQUssR0FBVyxFQUFFLENBQUM7UUFDbkIsc0JBQWlCLEdBQXVCLEVBQUUsQ0FBQztRQUMzQyxjQUFTLEdBQWUsRUFBRSxDQUFDO1FBQ3BDLFVBQUssR0FBVyxFQUFFLENBQUM7SUFJYSxDQUFDO0lBRWpDLFFBQVEsQ0FBQyxTQUFpQixFQUFFLElBQXVCO1FBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVksRUFBRSxRQUFnQixFQUFFLElBQVk7UUFDbEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ25CLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxHQUFHLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxPQUFPLENBQUMsRUFBVSxFQUFFLElBQVksRUFBRSxJQUFZO1FBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxRQUFRLENBQUMsTUFBYyxFQUFFLElBQVksRUFBRSxHQUFX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LEdBQUcsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQztJQUNyRSxDQUFDO0NBQ0Y7QUFFRCxTQUFTLFVBQVUsQ0FBQyxHQUFRLEVBQUUsSUFBWTtJQUN4QyxJQUFJLElBQUksSUFBSSxJQUFJO1FBQUUsT0FBTyxPQUFPLENBQUM7SUFDakMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1JvbX0gZnJvbSAnLi4vcm9tLmpzJztcblxuLyoqXG4gKiBTdG9yZXMgb3JnYW5pemVkIGluZm9ybWF0aW9uIGFib3V0IHRoZSBzaHVmZmxlLCBpbmNsdWRpbmdcbiAqICAgLSB3aGljaCBpdGVtcyBhcmUgaW4gd2hpY2ggc2xvdHNcbiAqICAgLSBhIGtub3duLXdvcmtpbmcgcm91dGUgdGhyb3VnaCB0aGUgZ2FtZVxuICogICAtIHdoaWNoIGVuZW1pZXMgYXJlIHNodWZmbGUgd2hlcmVcbiAqICAgLSBlbmVteSB2dWxuZXJhYmlsaXRpZXNcbiAqICAgLSBsb2NhdGlvbiBjb25uZWN0aW9uc1xuICogICAtIHJvdXRlcyB0byBlYWNoIGFyZWFcbiAqL1xuZXhwb3J0IGNsYXNzIFNwb2lsZXIge1xuICByZWFkb25seSBzbG90czogU2xvdFtdID0gW107XG4gIHJlYWRvbmx5IHJvdXRlOiBDaGVja1tdID0gW107XG4gIHJlYWRvbmx5IG1hemVzOiBNYXplW10gPSBbXTtcbiAgcmVhZG9ubHkgdHJhZGVzOiBUcmFkZVtdID0gW107XG4gIHJlYWRvbmx5IHdhbGxzOiBXYWxsW10gPSBbXTtcbiAgcmVhZG9ubHkgdW5pZGVudGlmaWVkSXRlbXM6IFVuaWRlbnRpZmllZEl0ZW1bXSA9IFtdO1xuICByZWFkb25seSB3aWxkV2FycHM6IFdpbGRXYXJwW10gPSBbXTtcbiAgZmxhZ3M6IHN0cmluZyA9ICcnO1xuXG4gIC8vIFRPRE8gLSBzaG9wcywgYm9zcyB3ZWFrbmVzc2VzXG5cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcm9tOiBSb20pIHt9XG5cbiAgYWRkQ2hlY2soY29uZGl0aW9uOiBudW1iZXIsIGRlcHM6IHJlYWRvbmx5IG51bWJlcltdKTogdm9pZCB7XG4gICAgdGhpcy5yb3V0ZS5wdXNoKG5ldyBDaGVjayh0aGlzLCBjb25kaXRpb24sIGRlcHMpKTtcbiAgfVxuXG4gIGFkZFNsb3Qoc2xvdDogbnVtYmVyLCBzbG90TmFtZTogc3RyaW5nLCBpdGVtOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnNsb3RzW3Nsb3QgJiAweGZmXSA9XG4gICAgICAgIG5ldyBTbG90KHRoaXMucm9tLCBzbG90ICYgMHhmZiwgc2xvdE5hbWUsIGl0ZW0gJiAweGZmKTtcbiAgfVxuXG4gIGFkZE1hemUoaWQ6IG51bWJlciwgbmFtZTogc3RyaW5nLCBtYXplOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm1hemVzLnB1c2goe2lkLCBuYW1lLCBtYXplfSk7XG4gIH1cblxuICBhZGRUcmFkZShpdGVtSWQ6IG51bWJlciwgaXRlbTogc3RyaW5nLCBucGM6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMudHJhZGVzLnB1c2goe2l0ZW1JZCwgaXRlbSwgbnBjfSk7XG4gIH1cblxuICBhZGRVbmlkZW50aWZpZWRJdGVtKGl0ZW1JZDogbnVtYmVyLCBvbGROYW1lOiBzdHJpbmcsIG5ld05hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMudW5pZGVudGlmaWVkSXRlbXMucHVzaCh7aXRlbUlkLCBvbGROYW1lLCBuZXdOYW1lfSk7XG4gIH1cblxuICBhZGRXYWxsKGxvY2F0aW9uOiBzdHJpbmcsIG9sZEVsZW1lbnQ6IG51bWJlciwgbmV3RWxlbWVudDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy53YWxscy5wdXNoKHtsb2NhdGlvbiwgb2xkRWxlbWVudCwgbmV3RWxlbWVudH0pO1xuICB9XG5cbiAgYWRkV2lsZFdhcnAoaWQ6IG51bWJlciwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy53aWxkV2FycHMucHVzaCh7aWQsIG5hbWV9KTtcbiAgfVxuXG4gIGZvcm1hdENvbmRpdGlvbihpZDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5yb20uZmxhZ3NbaWRdPy5uYW1lXG4gIH1cblxuICBmb3JtYXRDb25kaXRpb25MaXN0KGNvbmRpdGlvbnM6IHJlYWRvbmx5IG51bWJlcltdKTogc3RyaW5nIHtcbiAgICBjb25zdCB0ZXJtczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgY29uZGl0aW9ucykge1xuICAgICAgY29uc3QgZiA9IHRoaXMucm9tLmZsYWdzW2NdO1xuICAgICAgaWYgKGY/LmxvZ2ljLnRyYWNrKSB0ZXJtcy5wdXNoKGYubmFtZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXJtcy5qb2luKCcsICcpO1xuICB9XG59XG5cbmludGVyZmFjZSBNYXplIHtcbiAgaWQ6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBtYXplOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUcmFkZSB7XG4gIGl0ZW1JZDogbnVtYmVyO1xuICBpdGVtOiBzdHJpbmc7XG4gIG5wYzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVW5pZGVudGlmaWVkSXRlbSB7XG4gIGl0ZW1JZDogbnVtYmVyO1xuICBvbGROYW1lOiBzdHJpbmc7XG4gIG5ld05hbWU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFdhbGwge1xuICBsb2NhdGlvbjogc3RyaW5nO1xuICBvbGRFbGVtZW50OiBudW1iZXI7XG4gIG5ld0VsZW1lbnQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFdpbGRXYXJwIHtcbiAgaWQ6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5jbGFzcyBDaGVjayB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHNwb2lsZXI6IFNwb2lsZXIsXG4gICAgICAgICAgICAgIHJlYWRvbmx5IGNvbmRpdGlvbjogbnVtYmVyLFxuICAgICAgICAgICAgICByZWFkb25seSBkZXBzOiByZWFkb25seSBudW1iZXJbXSkge31cblxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtID0gMDtcbiAgICBpZiAoKHRoaXMuY29uZGl0aW9uICYgfjB4N2YpID09PSAweDEwMCkge1xuICAgICAgaXRlbSA9IDB4MjAwIHwgdGhpcy5zcG9pbGVyLnJvbS5zbG90c1t0aGlzLmNvbmRpdGlvbiAmIDB4ZmZdO1xuICAgIH1cbiAgICByZXR1cm4gYCR7dGhpcy5zcG9pbGVyLmZvcm1hdENvbmRpdGlvbih0aGlzLmNvbmRpdGlvbil9JHtcbiAgICAgICAgICAgIGl0ZW0gPyBgICgke3RoaXMuc3BvaWxlci5mb3JtYXRDb25kaXRpb24oaXRlbSl9KWAgOiAnJ1xuICAgICAgICAgICAgfTogWyR7dGhpcy5zcG9pbGVyLmZvcm1hdENvbmRpdGlvbkxpc3QodGhpcy5kZXBzKX1dYDtcbiAgfVxufVxuXG5jbGFzcyBTbG90IHtcbiAgcmVhZG9ubHkgaXRlbU5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3JpZ2luYWxJdGVtOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iocm9tOiBSb20sXG4gICAgICAgICAgICAgIHJlYWRvbmx5IHNsb3Q6IG51bWJlcixcbiAgICAgICAgICAgICAgcmVhZG9ubHkgc2xvdE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgcmVhZG9ubHkgaXRlbTogbnVtYmVyKSB7XG4gICAgdGhpcy5pdGVtTmFtZSA9IHNsb3RUb0l0ZW0ocm9tLCBpdGVtKTtcbiAgICB0aGlzLm9yaWdpbmFsSXRlbSA9IHNsb3RUb0l0ZW0ocm9tLCBzbG90KTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgLy8gRmlndXJlIG91dCB0aGUgbmFtZSBvZiB0aGUgc2xvdCwgdGhlIG9yaWdpbmFsIGl0ZW0sIGV0Y1xuICAgIHJldHVybiBgJHt0aGlzLml0ZW1OYW1lfTogJHt0aGlzLnNsb3ROYW1lfSAoJHt0aGlzLm9yaWdpbmFsSXRlbX0pYDtcbiAgfVxufVxuXG5mdW5jdGlvbiBzbG90VG9JdGVtKHJvbTogUm9tLCBzbG90OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoc2xvdCA+PSAweDcwKSByZXR1cm4gJ01pbWljJztcbiAgcmV0dXJuIHJvbS5pdGVtc1tyb20uaXRlbUdldHNbc2xvdF0uaXRlbUlkXS5tZXNzYWdlTmFtZTtcbn1cbiJdfQ==