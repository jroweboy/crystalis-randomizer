import { shuffleCave } from '../maze/cave.js';
import { extendGoaScreens, shuffleGoa1 } from '../maze/goa.js';
import { shuffleSwamp } from '../maze/swamp.js';
import { shufflePyramid } from '../maze/pyramid.js';
export function shuffleMazes(rom, random) {
    shufflePyramid(rom, random);
    shuffleSwamp(rom, random);
    shuffleGoa1(rom, random);
    for (const cave of SHUFFLED_CAVES) {
        shuffleCave(rom.locations[cave], random);
    }
}
export function prepareScreens(rom) {
    extendGoaScreens(rom);
}
const SHUFFLED_CAVES = [
    0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0c,
    0x0e,
    0x10,
    0x11, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27,
    0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x31, 0x33, 0x34, 0x35, 0x38, 0x39,
    0x44, 0x45, 0x46,
    0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f,
    0x54, 0x55, 0x56, 0x57,
    0x69,
    0x70,
    0x7d, 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x8f,
    0x92, 0x95,
    0x9d,
    0xab,
    0xb0, 0xb1, 0xb2, 0xb3,
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2h1ZmZsZW1hemVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL3Bhc3Mvc2h1ZmZsZW1hemVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUlsRCxNQUFNLFVBQVUsWUFBWSxDQUFDLEdBQVEsRUFBRSxNQUFjO0lBTW5ELGNBQWMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDNUIsWUFBWSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMxQixXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pCLEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxFQUFFO1FBQ2pDLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsR0FBUTtJQUNyQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBRUQsTUFBTSxjQUFjLEdBQUc7SUFFckIsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7SUFFOUMsSUFBSTtJQUVKLElBQUk7SUFFSixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0lBRXhDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0lBRWhFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtJQUVoQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtJQUU5QyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0lBRXRCLElBQUk7SUFJSixJQUFJO0lBRUosSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtJQUkxRCxJQUFJO0lBSUosSUFBSSxFQUFFLElBQUk7SUFFVixJQUFJO0lBTUosSUFBSTtJQUlKLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7Q0FDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7c2h1ZmZsZUNhdmV9IGZyb20gJy4uL21hemUvY2F2ZS5qcyc7XG5pbXBvcnQge2V4dGVuZEdvYVNjcmVlbnMsIHNodWZmbGVHb2ExfSBmcm9tICcuLi9tYXplL2dvYS5qcyc7XG5pbXBvcnQge3NodWZmbGVTd2FtcH0gZnJvbSAnLi4vbWF6ZS9zd2FtcC5qcyc7XG5pbXBvcnQge3NodWZmbGVQeXJhbWlkfSBmcm9tICcuLi9tYXplL3B5cmFtaWQuanMnO1xuaW1wb3J0IHtSYW5kb219IGZyb20gJy4uL3JhbmRvbS5qcyc7XG5pbXBvcnQge1JvbX0gZnJvbSAnLi4vcm9tLmpzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGVNYXplcyhyb206IFJvbSwgcmFuZG9tOiBSYW5kb20pIHtcbiAgLy8gVE9ETyAtIGNvbnNvbGlkYXRlIGZyZWUgZmxhZ3M/ICBGaW5kIGEgbGlzdCBvZiB3aGF0J3MgdXNlZC4uLlxuICAvLyBbLi4ubmV3IFNldChyb20ubG9jYXRpb25zLmZsYXRNYXAobCA9PiBsLmZsYWdzLm1hcChmID0+IGYuZmxhZylcbiAgLy8gICAgICAgICAgIC5maWx0ZXIoZiA9PiBmICE9IDB4MjAwKS5tYXAoeD0+eC50b1N0cmluZygxNikpKSldLnNvcnQoKVxuICAvLyBBbHNvIG1hcCBvdmVyIHRyaWdnZXJzLCBkaWFsb2dzIC0gZmluZCB3aGF0J3Mgc2V0L2NsZWFyZWRcbiAgLy8gQWxzbyAyZjAgaXMgY28tb3B0ZWQgYXMgYW4gXCJhbHdheXMgdHJ1ZVwiIHRyaWdnZXIuXG4gIHNodWZmbGVQeXJhbWlkKHJvbSwgcmFuZG9tKTtcbiAgc2h1ZmZsZVN3YW1wKHJvbSwgcmFuZG9tKTtcbiAgc2h1ZmZsZUdvYTEocm9tLCByYW5kb20pO1xuICBmb3IgKGNvbnN0IGNhdmUgb2YgU0hVRkZMRURfQ0FWRVMpIHtcbiAgICBzaHVmZmxlQ2F2ZShyb20ubG9jYXRpb25zW2NhdmVdLCByYW5kb20pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmVwYXJlU2NyZWVucyhyb206IFJvbSkge1xuICBleHRlbmRHb2FTY3JlZW5zKHJvbSk7XG59XG5cbmNvbnN0IFNIVUZGTEVEX0NBVkVTID0gW1xuICAvLyBTZWFsZWQgQ2F2ZVxuICAweDA0LCAweDA1LCAweDA2LCAweDA3LCAweDA4LCAweDA5LCAweDBhLCAweDBjLFxuICAvLyBXaW5kbWlsbCBDYXZlXG4gIDB4MGUsXG4gIC8vIFplYnUgQ2F2ZVxuICAweDEwLFxuICAvLyBNdCBTYWJyZSBXXG4gIDB4MTEsIDB4MjIsIDB4MjMsIDB4MjQsIDB4MjUsIDB4MjYsIDB4MjcsXG4gIC8vIE10IFNhYnJlIE5cbiAgMHgyYSwgMHgyYiwgMHgyYywgMHgyZCwgMHgyZSwgMHgzMSwgMHgzMywgMHgzNCwgMHgzNSwgMHgzOCwgMHgzOSxcbiAgLy8gS2lyaXNhXG4gIDB4NDQsIDB4NDUsIDB4NDYsXG4gIC8vIEZvZyBMYW1wXG4gIDB4NDgsIDB4NDksIDB4NGEsIDB4NGIsIDB4NGMsIDB4NGQsIDB4NGUsIDB4NGYsXG4gIC8vIFdhdGVyZmFsbFxuICAweDU0LCAweDU1LCAweDU2LCAweDU3LCAvLyBjYW4ndCBoYW5kbGUgdGhpcyBvbmUgeWV0XG4gIC8vIEV2aWwgc3Bpcml0XG4gIDB4NjksIC8vIDB4NmEsIDB4NmJcbiAgLy8gU2FiZXJhIHBhbGFjZSAocHJvYmFibHkganVzdCBza2lwIHNhYmVyYSBtYXAgNmUpXG4gIC8vIDB4NmMsIDB4NmRcbiAgLy8gSm9lbCBwYXNzYWdlXG4gIDB4NzAsXG4gIC8vIE10IEh5ZHJhXG4gIDB4N2QsIDB4N2YsIDB4ODAsIDB4ODEsIDB4ODIsIDB4ODMsIDB4ODQsIDB4ODUsIDB4ODYsIDB4ODcsXG4gIC8vIFN0eHlcbiAgLy8gMHg4OCwgMHg4OSwgMHg4YSxcbiAgLy8gR29hIEJhc2VtZW50XG4gIDB4OGYsXG4gIC8vIE9hc2lzIENhdmVcbiAgLy8gMHg5MSwgMHhiOCwgXG4gIC8vIENvbm5lY3RvcnNcbiAgMHg5MiwgMHg5NSxcbiAgLy8gUHlyYW1pZFxuICAweDlkLCAvLzB4OWUsXG4gIC8vIENyeXB0XG4gIC8vIDB4YTAsIDB4YTEsIDB4YTIsIDB4YTMsIDB4YTQsIDB4YTUsXG4gIC8vIEdvYSAtIEtlbGJlc3F1ZSAyXG4gIC8vIDB4YTgsIDB4YTksIC8vIE5PVEU6IGE5IGhhbmRsZWQgYnkgc2h1ZmZsZUdvYTFcbiAgLy8gR29hIC0gU2FiZXJhIDJcbiAgMHhhYixcbiAgLy8gR29hIC0gTWFkbyAyXG4gIC8vIDB4YWQsIDB4YWUsIDB4YWYsIDB4YjlcbiAgLy8gR29hIC0gS2FybWluZVxuICAweGIwLCAweGIxLCAweGIyLCAweGIzLCAvLyAweGI0LCAweGI1LCAweGI4LFxuXTtcbiJdfQ==