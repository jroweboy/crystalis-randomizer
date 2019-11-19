import { DataTuple, hex } from './util.js';
export class MessageId extends DataTuple {
    constructor() {
        super(...arguments);
        this.action = this.prop([0, 0xf8, 3]);
        this.part = this.prop([0, 0x07, -3], [1, 0xe0, 5]);
        this.index = this.prop([1, 0x1f]);
    }
    toString() {
        const action = this.action ? ` (action ${hex(this.action)})` : '';
        return `MessageId ${this.hex()}: (${hex(this.part)}:${hex(this.index)}${action}`;
    }
    mid() {
        return `${hex(this.part)}:${hex(this.index)}`;
    }
    nonzero() {
        return !!(this.part || this.index);
    }
}
MessageId.size = 2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZWlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL3JvbS9tZXNzYWdlaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFekMsTUFBTSxPQUFPLFNBQVUsU0FBUSxTQUFTO0lBQXhDOztRQVVFLFdBQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLFNBQUksR0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELFVBQUssR0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFrQmhDLENBQUM7SUFoQkMsUUFBUTtRQUNOLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDbEUsT0FBTyxhQUFhLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQzdELE1BQU0sRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFJRCxHQUFHO1FBQ0QsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFHRCxPQUFPO1FBQ0wsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxDQUFDOztBQTVCTSxjQUFJLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtEYXRhVHVwbGUsIGhleH0gZnJvbSAnLi91dGlsLmpzJztcblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2VJZCBleHRlbmRzIERhdGFUdXBsZSB7XG4gIHN0YXRpYyBzaXplID0gMjtcblxuICAvLyBUT0RPIC0gY29uc2lkZXIganVzdCBsaXN0aW5nIGJpdHM/ICAoaGFyZGVyIHRvIG1hcCB0byBjb2RlKVxuICAvLyAgICAgICAgcHJvYmFibHkgdGhlIHdheSB0byBtYXAgaXMgdG8gYnVja2V0IGJ5IGJ5dGU6c2hpZnQsIHRoZW5cbiAgLy8gICAgICAgIE9SIHRvZ2V0aGVyIGV2ZXJ5dGhpbmcgd2l0aCB0aGUgc2FtZSBzaGlmdC4uLlxuICAvLyBhY3Rpb24gPSB0aGlzLmJpdHMoMTEsIDEyLCAxMywgMTQsIDE1KSA9IHRoaXMuYml0cyhbMTEsIDE2XSk7XG4gIC8vIHBhcnQgICA9IHRoaXMuYml0cyg1LCA2LCA3LCA4LCA5LCAxMCkgID0gdGhpcy5iaXRzKFs1LCAxMV0pO1xuICAvLyBpbmRleCAgPSB0aGlzLmJpdHMoMCwgMSwgMiwgMywgNCkgICAgICA9IHRoaXMuYml0cyhbMCwgNV0pO1xuXG4gIGFjdGlvbiA9IHRoaXMucHJvcChbMCwgMHhmOCwgM10pO1xuICBwYXJ0ICAgPSB0aGlzLnByb3AoWzAsIDB4MDcsIC0zXSwgWzEsIDB4ZTAsIDVdKTtcbiAgaW5kZXggID0gdGhpcy5wcm9wKFsxLCAweDFmXSk7XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCBhY3Rpb24gPSB0aGlzLmFjdGlvbiA/IGAgKGFjdGlvbiAke2hleCh0aGlzLmFjdGlvbil9KWAgOiAnJztcbiAgICByZXR1cm4gYE1lc3NhZ2VJZCAke3RoaXMuaGV4KCl9OiAoJHtoZXgodGhpcy5wYXJ0KX06JHtoZXgodGhpcy5pbmRleCl9JHtcbiAgICAgICAgICAgIGFjdGlvbn1gO1xuICB9XG5cbiAgLy8gVW5pcXVlIHN0cmluZyBJRCBmb3IgdGhlIG1lc3NhZ2UgcGFydCBvbmx5IChubyBhY3Rpb24pLlxuICAvLyBTdWl0YWJsZSBmb3Iga2V5aW5nIGEgbWFwLlxuICBtaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7aGV4KHRoaXMucGFydCl9OiR7aGV4KHRoaXMuaW5kZXgpfWA7XG4gIH1cblxuICAvLyBXaGV0aGVyIHRoZSBtaWQgaXMgbm9uemVyby5cbiAgbm9uemVybygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISEodGhpcy5wYXJ0IHx8IHRoaXMuaW5kZXgpO1xuICB9XG59XG4iXX0=